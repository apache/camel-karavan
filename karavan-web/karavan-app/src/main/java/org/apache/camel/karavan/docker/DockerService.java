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
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.*;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.InvocationBuilder;
import com.github.dockerjava.core.util.CompressArchiveUtil;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.docker.model.DockerComposeService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.*;
import java.nio.file.LinkOption;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.Constants.LABEL_TYPE;

@ApplicationScoped
public class DockerService extends DockerServiceUtils {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());

    protected static final String NETWORK_NAME = "karavan";

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerEventListener dockerEventListener;

    @Inject
    Vertx vertx;

    private DockerClient dockerClient;

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

    public List<ContainerStatus> collectContainersStatuses() {
        List<ContainerStatus> result = new ArrayList<>();
        getDockerClient().listContainersCmd().withShowAll(true).exec().forEach(container -> {
            ContainerStatus containerStatus = getContainerStatus(container);
            Statistics stats = getContainerStats(container.getId());
            updateStatistics(containerStatus, container, stats);
            result.add(containerStatus);
        });
        return result;
    }

    private ContainerStatus getContainerStatus(Container container) {
        String name = container.getNames()[0].replace("/", "");
        List<Integer> ports = Arrays.stream(container.getPorts()).map(ContainerPort::getPrivatePort).filter(Objects::nonNull).collect(Collectors.toList());
        List<ContainerStatus.Command> commands = getContainerCommand(container.getState());
        ContainerStatus.ContainerType type = getContainerType(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        return ContainerStatus.createWithId(name, environment, container.getId(), container.getImage(), ports, type, commands, container.getState(), created);
    }

    public void startListeners() {
        getDockerClient().eventsCmd().exec(dockerEventListener);
    }

    public void stopListeners() throws IOException {
        dockerEventListener.close();
    }
    public void createNetwork() {
        if (!getDockerClient().listNetworksCmd().exec().stream()
                .filter(n -> n.getName().equals(NETWORK_NAME))
                .findFirst().isPresent()) {
            CreateNetworkResponse res = getDockerClient().createNetworkCmd()
                    .withName(NETWORK_NAME)
                    .withDriver("bridge")
                    .withInternal(false)
                    .withAttachable(true).exec();
            LOGGER.info("Network created: " + NETWORK_NAME);
        } else {
            LOGGER.info("Network already exists with name: " + NETWORK_NAME);
        }
    }

    public Container getContainer(String id) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(List.of(id)).exec();
        return containers.get(0);
    }

    public Container getContainerByName(String name) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        return containers.size() > 0 ? containers.get(0) : null;
    }

    public Statistics getContainerStats(String containerId) {
        InvocationBuilder.AsyncResultCallback<Statistics> callback = new InvocationBuilder.AsyncResultCallback<>();
        getDockerClient().statsCmd(containerId).withContainerId(containerId).withNoStream(true).exec(callback);
        Statistics stats = null;
        try {
            stats = callback.awaitResult();
            callback.close();
        } catch (RuntimeException | IOException e) {
            // you may want to throw an exception here
        }
        return stats;
    }

    public Container createContainerFromCompose(DockerComposeService compose, ContainerStatus.ContainerType type) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(compose.getContainer_name())).exec();
        if (containers.isEmpty()) {
            LOGGER.infof("Compose Service starting for %s", compose.getContainer_name());

            HealthCheck healthCheck = getHealthCheck(compose.getHealthcheck());
            List<String> env = compose.getEnvironment() != null ? compose.getEnvironmentList() : List.of();
            String ports = String.join(",", compose.getPorts());

            LOGGER.infof("Compose Service started for %s", compose.getContainer_name());

            return createContainer(compose.getContainer_name(), compose.getImage(),
                    env, ports, false, compose.getExpose(), healthCheck,
                    Map.of(LABEL_TYPE, type.name()),
                    Map.of());

        } else {
            LOGGER.info("Compose Service already exists: " + containers.get(0).getId());
            return containers.get(0);
        }
    }

    public Container createContainerFromCompose(String yaml, String name, ContainerStatus.ContainerType type) throws Exception {
        var compose = convertToDockerComposeService(yaml, name);
        if (compose != null) {
            return createContainerFromCompose(compose, type);
        } else {
            throw new Exception("Service not found in compose YAML!");
        }
    }

    public Container createContainer(String name, String image, List<String> env, String ports, boolean inRange,
                                     List<String> exposed, HealthCheck healthCheck, Map<String, String> labels,
                                     Map<String, String> volumes) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 0) {
            pullImage(image);

            CreateContainerCmd createContainerCmd = getDockerClient().createContainerCmd(image)
                    .withName(name).withLabels(labels).withEnv(env).withHostName(name).withHealthcheck(healthCheck);

            Ports portBindings;
            List<ExposedPort> exposedPorts = new ArrayList<>();
            if (exposed != null) {
                exposedPorts.addAll(exposed.stream().map(i -> ExposedPort.tcp(Integer.parseInt(i))).toList());
                portBindings = getPortBindings(ports,exposedPorts, inRange);
            } else {
                portBindings = getPortBindings(ports,exposedPorts, inRange);
            }

            List<Mount> mounts = new ArrayList<>();
            if (volumes != null && !volumes.isEmpty()) {
                volumes.forEach((hostPath, containerPath) -> {
                    mounts.add(new Mount().withType(MountType.BIND).withSource(hostPath).withTarget(containerPath));
                });
            }

            createContainerCmd.withExposedPorts(exposedPorts);
            createContainerCmd.withHostConfig(new HostConfig()
                    .withPortBindings(portBindings)
                            .withMounts(mounts)
                    .withNetworkMode(NETWORK_NAME));


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
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (container.getState().equals("paused")) {
                getDockerClient().unpauseContainerCmd(container.getId()).exec();
            } else if (!container.getState().equals("running")) {
                getDockerClient().startContainerCmd(container.getId()).exec();
            }
        }
    }

    public List<Container> listContainers(Boolean showAll) {
        return getDockerClient().listContainersCmd().withShowAll(showAll).exec();
    }

    public List<InspectVolumeResponse> listVolumes() {
        return getDockerClient().listVolumesCmd().exec().getVolumes();
    }

    public InspectVolumeResponse getVolume(String name) {
        return getDockerClient().inspectVolumeCmd(name).exec();
    }

    public CreateVolumeResponse createVolume(String name) {
        return getDockerClient().createVolumeCmd().withName(name).exec();
    }

    public InspectContainerResponse inspectContainer(String id) {
        return getDockerClient().inspectContainerCmd(id).exec();
    }

    public ExecCreateCmdResponse execCreate(String id, String... cmd) {
        return getDockerClient().execCreateCmd(id)
                .withAttachStdout(true).withAttachStderr(true)
                .withCmd(cmd)
                .exec();
    }

    public void execStart(String id) throws InterruptedException {
        getDockerClient().execStartCmd(id).start().awaitCompletion();
    }

    public void execStart(String id, ResultCallback.Adapter<Frame> callBack) throws InterruptedException {
        getDockerClient().execStartCmd(id).exec(callBack).awaitCompletion();
    }

    public void copyFile(String id, String containerPath, String filename, String text) throws IOException {
//        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
//                TarArchiveOutputStream tarArchive = new TarArchiveOutputStream(byteArrayOutputStream)) {
//            tarArchive.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
//            tarArchive.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_POSIX);
//
//            String temp = vertx.fileSystem().createTempDirectoryBlocking("x");
//            String path = temp + File.separator + filename;
//            vertx.fileSystem().writeFileBlocking(path, Buffer.buffer(text));
//
//            ArchiveEntry archive = tarArchive.createArchiveEntry(Paths.get(path), "app.ini");
//            tarArchive.putArchiveEntry(archive);;
//            tarArchive.finish();
            getDockerClient().copyArchiveToContainerCmd(id).withRemotePath("/data")
                    .withHostResource("/Users/marat/projects/camel-karavan/karavan-web/karavan-app/src/main/resources/gitea").exec();
//        }
    }

    public void logContainer(String containerName, LogCallback callback) {
        try {
            Container container = getContainerByName(containerName);
            if (container != null) {
                getDockerClient().logContainerCmd(container.getId())
                        .withStdOut(true)
                        .withStdErr(true)
                        .withTimestamps(true)
                        .withFollowStream(true)
                        .withTailAll()
                        .exec(callback);
                callback.awaitCompletion();
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void pauseContainer(String name) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (container.getState().equals("running")) {
                getDockerClient().pauseContainerCmd(container.getId()).exec();
            }
        }
    }

    public void stopContainer(String name) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (container.getState().equals("running")) {
                getDockerClient().stopContainerCmd(container.getId()).exec();
            }
        }
    }

    public void deleteContainer(String name) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 1) {
            Container container = containers.get(0);
            getDockerClient().removeContainerCmd(container.getId()).withForce(true).exec();
        }
    }

    public void pullImage(String image) throws InterruptedException {
        List<Image> images = getDockerClient().listImagesCmd().withShowAll(true).exec();
        List<String> tags = images.stream()
                .map(i -> Arrays.stream(i.getRepoTags()).collect(Collectors.toList()))
                .flatMap(Collection::stream)
                .collect(Collectors.toList());

        if (!images.stream().filter(i -> tags.contains(image)).findFirst().isPresent()) {
            ResultCallback.Adapter<PullResponseItem> pull = getDockerClient().pullImageCmd(image).start().awaitCompletion();
        }
    }

    private DockerClientConfig getDockerClientConfig() {
        return DefaultDockerClientConfig.createDefaultConfigBuilder().build();
    }

    private DockerHttpClient getDockerHttpClient() {
        DockerClientConfig config = getDockerClientConfig();

        return new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(100)
                .build();
    }

    public DockerClient getDockerClient() {
        if (dockerClient == null) {
            dockerClient = DockerClientImpl.getInstance(getDockerClientConfig(), getDockerHttpClient());
        }
        return dockerClient;
    }
}
