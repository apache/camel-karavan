/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerCmd;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.LABEL_PROJECT_ID;

@ApplicationScoped
public class DockerService {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());

    @ConfigProperty(name = "karavan.docker.network")
    String networkName;

    @ConfigProperty(name = "karavan.container-image.registry")
    String registry;
    @ConfigProperty(name = "karavan.container-image.group")
    String group;
    @ConfigProperty(name = "karavan.container-image.registry-username")
    Optional<String> username;
    @ConfigProperty(name = "karavan.container-image.registry-password")
    Optional<String> password;

    @Inject
    DockerEventHandler dockerEventHandler;

    @Inject
    CodeService codeService;

    @Inject
    Vertx vertx;

    private DockerClient dockerClient;

    void onStart(@Observes StartupEvent ev) {
        if (!ConfigService.inKubernetes()) {
            getDockerClient().eventsCmd().exec(dockerEventHandler);
        }
    }

    void onStop(@Observes ShutdownEvent ev) throws IOException  {
        if (!ConfigService.inKubernetes()) {
            dockerEventHandler.close();
        }
    }

    public boolean checkDocker() {
        try {
            getDockerClient().pingCmd().exec();
            LOGGER.info("Docker is available");
            return true;
        } catch (Exception e) {
            LOGGER.error("Error connecting Docker: " + e.getMessage());
            return false;
        }
    }

    public Info getInfo(){
        return getDockerClient().infoCmd().exec();
    }

    public Container getContainer(String id) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(List.of(id)).exec();
        return containers.isEmpty() ? null : containers.get(0);
    }

    public Container getContainerByName(String name) {
        List<Container> containers = findContainer(name);
        return !containers.isEmpty() ? containers.get(0) : null;
    }

    public List<Container> getAllContainers() {
        return getDockerClient().listContainersCmd().withShowAll(true).exec();
    }

    public Container createContainerFromCompose(DockerComposeService compose, Map<String, String> labels, Boolean pullAlways, String... command) throws InterruptedException {
        return createContainerFromCompose(compose, labels, Map.of(), pullAlways, command);
    }

    public Container createContainerFromCompose(DockerComposeService compose, Map<String, String> labels, Map<String, String> volumes, Boolean pullAlways, String... command) throws InterruptedException {
        List<Container> containers = findContainer(compose.getContainer_name());
        if (containers.isEmpty()) {
            HealthCheck healthCheck = DockerUtils.getHealthCheck(compose.getHealthcheck());

            List<String> env = new ArrayList<>();
            if (compose.getEnv_file() != null) {
                env.addAll(codeService.getComposeEnvironmentVariables(compose));
            } else {
                env.addAll(compose.getEnvironmentList());
            }

            LOGGER.infof("Compose Service started for %s in network:%s", compose.getContainer_name(), networkName);

            RestartPolicy restartPolicy = RestartPolicy.noRestart();
            if (Objects.equals(compose.getRestart(), RestartPolicy.onFailureRestart(10).getName())) {
                restartPolicy = RestartPolicy.onFailureRestart(10);
            } else if (Objects.equals(compose.getRestart(), RestartPolicy.alwaysRestart().getName())) {
                restartPolicy = RestartPolicy.alwaysRestart();
            }

            return createContainer(compose.getContainer_name(), compose.getImage(), 
                    env, compose.getPortsMap(), healthCheck, labels, volumes, networkName, restartPolicy, pullAlways, 
                    compose.getCpus(), compose.getCpu_percent(), compose.getMem_limit(), compose.getMem_reservation(), command);

        } else {
            LOGGER.info("Compose Service already exists: " + containers.get(0).getId());
            return containers.get(0);
        }
    }

    public List<Container> findContainer(String containerName) {
        return getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(containerName)).exec()
                .stream().filter(c -> Objects.equals(c.getNames()[0].replaceFirst("/", ""), containerName)).toList();
    }

    public Container createContainer(String name, String image, List<String> env, Map<Integer, Integer> ports,
                                     HealthCheck healthCheck, Map<String, String> labels,
                                     Map<String, String> volumes, String network, RestartPolicy restartPolicy,
                                     boolean pullAlways, String cpus, String cpu_percent, String mem_limit, String mem_reservation,
                                     String... command) throws InterruptedException {
        List<Container> containers = findContainer(name);
        if (containers.isEmpty()) {
            pullImage(image, pullAlways);

            CreateContainerCmd createContainerCmd = getDockerClient().createContainerCmd(image)
                    .withName(name).withLabels(labels).withEnv(env).withHostName(name).withHealthcheck(healthCheck);

            Ports portBindings = DockerUtils.getPortBindings(ports);

            List<Mount> mounts = new ArrayList<>();
            if (volumes != null && !volumes.isEmpty()) {
                volumes.forEach((hostPath, containerPath) -> {
                    mounts.add(new Mount().withType(MountType.BIND).withSource(hostPath).withTarget(containerPath));
                });
            }
            if (command.length > 0) {
                createContainerCmd.withCmd(command);
            }
            if (Objects.equals(labels.get(LABEL_PROJECT_ID), PodContainerStatus.ContainerType.build.name())) {
                mounts.add(new Mount().withType(MountType.BIND).withSource("/var/run/docker.sock").withTarget("/var/run/docker.sock"));
            }
            createContainerCmd.withHostConfig(new HostConfig()
                            .withRestartPolicy(restartPolicy)
                    .withPortBindings(portBindings)
                    .withMounts(mounts)
                    .withMemory(DockerUtils.parseMemory(mem_limit))
                    .withMemoryReservation(DockerUtils.parseMemory(mem_reservation))
                    .withCpuPercent(NumberUtils.toLong(cpu_percent))
                    .withNanoCPUs(NumberUtils.toLong(cpus))
                    .withNetworkMode(network != null ? network : networkName));

            CreateContainerResponse response = createContainerCmd.exec();
            LOGGER.info("Container created: " + response.getId());
            return getDockerClient().listContainersCmd().withShowAll(true)
                    .withIdFilter(Collections.singleton(response.getId())).exec().get(0);
        } else {
            LOGGER.info("Container already exists: " + containers.get(0).getId());
            return containers.get(0);
        }
    }

    public void runContainer(String name) {
        List<Container> containers = findContainer(name);
        if (containers.size() == 1) {
            runContainer(containers.get(0));
        }
    }

    public void runContainer(Container container) {
        if (container.getState().equals("paused")) {
            getDockerClient().unpauseContainerCmd(container.getId()).exec();
        } else if (!container.getState().equals("running")) {
            getDockerClient().startContainerCmd(container.getId()).exec();
        }
    }

    protected void copyFiles(String containerId, String containerPath, Map<String, String> files, boolean dirChildrenOnly) throws IOException {
        String temp = codeService.saveProjectFilesInTemp(files);
        dockerClient.copyArchiveToContainerCmd(containerId).withRemotePath(containerPath)
                .withDirChildrenOnly(dirChildrenOnly).withHostResource(temp).exec();
    }

    public void copyExecFile(String containerId, String containerPath, String filename, String script) {
        String temp = vertx.fileSystem().createTempDirectoryBlocking(containerId);
        String path = temp + File.separator + filename;
        vertx.fileSystem().writeFileBlocking(path, Buffer.buffer(script));

        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             TarArchiveOutputStream tarArchive = new TarArchiveOutputStream(byteArrayOutputStream)) {
            tarArchive.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
            tarArchive.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_POSIX);

            TarArchiveEntry tarEntry = new TarArchiveEntry(new File(path));
            tarEntry.setName(filename);
            tarEntry.setMode(0755);
            tarArchive.putArchiveEntry(tarEntry);
            IOUtils.write(Files.readAllBytes(Paths.get(path)), tarArchive);
            tarArchive.closeArchiveEntry();
            tarArchive.finish();

            dockerClient.copyArchiveToContainerCmd(containerId)
                    .withTarInputStream(new ByteArrayInputStream(byteArrayOutputStream.toByteArray()))
                    .withRemotePath(containerPath).exec();
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
            e.printStackTrace();
        }
    }

    public void logContainer(String containerName, DockerLogCallback callback) {
        try {
            Container container = getContainerByName(containerName);
            if (container != null) {
                getDockerClient().logContainerCmd(container.getId())
                        .withStdOut(true)
                        .withStdErr(true)
                        .withTimestamps(false)
                        .withFollowStream(true)
                        .withTail(100)
                        .exec(callback);
                callback.awaitCompletion();
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void pauseContainer(String name) {
        List<Container> containers = findContainer(name);
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (container.getState().equals("running")) {
                getDockerClient().pauseContainerCmd(container.getId()).exec();
            }
        }
    }

    public void stopContainer(String name) {
        List<Container> containers = findContainer(name);
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (container.getState().equals("running") || container.getState().equals("paused")) {
                getDockerClient().stopContainerCmd(container.getId()).exec();
            }
        }
    }

    public void deleteContainer(String name) {
        List<Container> containers = findContainer(name);
        if (containers.size() == 1) {
            Container container = containers.get(0);
            getDockerClient().removeContainerCmd(container.getId()).withForce(true).exec();
        }
    }

    public void pullImage(String image, boolean pullAlways) throws InterruptedException {
        List<Image> images = getDockerClient().listImagesCmd().withShowAll(true).exec();
        List<String> tags = images.stream()
                .map(i -> Arrays.stream(i.getRepoTags()).collect(Collectors.toList()))
                .flatMap(Collection::stream)
                .toList();

        if (pullAlways || !images.stream().anyMatch(i -> tags.contains(image))) {
            var callback = new DockerPullCallback(LOGGER::info);
            getDockerClient().pullImageCmd(image).exec(callback);
            callback.awaitCompletion();
        }
    }

    private DockerClientConfig getDockerClientConfig() {
        LOGGER.info("Docker Client Configuring....");
        LOGGER.info("Docker Client Registry " + registry);
        LOGGER.info("Docker Client Username " + (username.isPresent() ? "is not empty " : "is empty"));
        LOGGER.info("Docker Client Password " + (password.isPresent() ? "is not empty " : "is empty"));
        DefaultDockerClientConfig.Builder builder =  DefaultDockerClientConfig.createDefaultConfigBuilder();
        if (!Objects.equals(registry, "registry:5000") && username.isPresent() && password.isPresent()) {
            builder.withRegistryUrl(registry);
            builder.withRegistryUsername(username.get());
            builder.withRegistryPassword(password.get());
        }
        return builder.build();
    }

    private DockerHttpClient getDockerHttpClient(DockerClientConfig config) {
        return new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(100)
                .build();
    }

    public DockerClient getDockerClient() {
        if (dockerClient == null) {
            DockerClientConfig config = getDockerClientConfig();
            DockerHttpClient httpClient = getDockerHttpClient(config);
            dockerClient = DockerClientImpl.getInstance(config, httpClient);
        }
        return dockerClient;
    }

    public int getMaxPortMapped(int port) {
        return getDockerClient().listContainersCmd().withShowAll(true).exec().stream()
                .map(c -> List.of(c.ports))
                .flatMap(List::stream)
                .filter(p -> Objects.equals(p.getPrivatePort(), port))
                .map(ContainerPort::getPublicPort).filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max().orElse(port);
    }

    public List<String> getImages() {
        return getDockerClient().listImagesCmd().withShowAll(true).exec().stream()
                .filter(image -> image != null && image.getRepoTags() != null && image.getRepoTags().length > 0)
                .map(image -> image.getRepoTags()[0]).toList();
    }

    public void deleteImage(String imageName) {
        Optional<Image> image = getDockerClient().listImagesCmd().withShowAll(true).exec().stream()
                .filter(i -> Arrays.stream(i.getRepoTags()).anyMatch(s -> Objects.equals(s, imageName))).findFirst();
        if (image.isPresent()) {
            getDockerClient().removeImageCmd(image.get().getId()).exec();
        }
    }
}
