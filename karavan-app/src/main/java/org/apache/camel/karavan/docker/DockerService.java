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
import com.github.dockerjava.api.command.*;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.ContainerType;
import org.apache.camel.karavan.model.ContainerImage;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.DockerVolumeDefinition;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.*;

@Default
@Readiness
@ApplicationScoped
public class DockerService implements org.eclipse.microprofile.health.HealthCheck {

    public enum PULL_IMAGE {
        always, ifNotExists, never
    }

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

    private DockerClient dockerClientConnectedToRegistry;

    private static Boolean IN_SWARM_MODE = null;

    public boolean isInSwarmMode() {
        if (IN_SWARM_MODE == null) {
            IN_SWARM_MODE = checkDockerSwarm();
        }
        return IN_SWARM_MODE;
    }

    void onStart(@Observes StartupEvent ev) {
        if (!ConfigService.inKubernetes()) {
            try (EventsCmd cmd = getDockerClient().eventsCmd()) {
                cmd.exec(dockerEventHandler);
            }
        }
    }

    void onStop(@Observes ShutdownEvent ev) throws IOException {
        if (!ConfigService.inKubernetes()) {
            dockerEventHandler.close();
        }
    }

    public boolean checkDocker() {
        try {
            try (InfoCmd cmd = getDockerClient().infoCmd()) {
                Info info = cmd.exec();
                ClusterInfo clusterInfo = info.getSwarm().getClusterInfo();
            }
            return true;
        } catch (Exception e) {
            LOGGER.error("Error connecting Docker: " + e.getMessage());
            return false;
        }
    }

    public boolean checkDockerSwarm() {
        try {
            try (InfoCmd cmd = getDockerClient().infoCmd()) {
                Info info = cmd.exec();
                var swarmInfo = info.getSwarm();
                var nodes = (swarmInfo != null && swarmInfo.getNodes() != null) ? swarmInfo.getNodes() : 0;
                return swarmInfo != null && nodes > 0;
            }
        } catch (Exception e) {
            LOGGER.error("Error connecting Docker: " + e.getMessage());
            return false;
        }
    }

    public JsonObject getInfo() {
        try (InfoCmd cmd = getDockerClient().infoCmd()) {
            var info = cmd.exec();
            var swarm = info.getSwarm();
            if (swarm != null) {
                return JsonObject.of(
                        "Nodes", swarm.getNodes(),
                        "NodeId", swarm.getNodeID(),
                        "Managers", swarm.getManagers(),
                        "Error", swarm.getError(),
                        "MemTotal", info.getMemTotal()
                );
            } else {
                return JsonObject.of(
                        "Nodes", 0,
                        "NodeId", null,
                        "Managers", null,
                        "Error", "Swarm is Null",
                        "MemTotal", 0
                );
            }
        }
    }

    public Container getContainer(String id) {
        try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(List.of(id))) {
            List<Container> containers = cmd.exec();
            return containers.isEmpty() ? null : containers.getFirst();
        }
    }

    public Container getContainerByName(String name) {
        List<Container> containers = findContainers(name);
        return !containers.isEmpty() ? containers.getFirst() : null;
    }

    public List<Container> getAllContainers() {
        try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withShowAll(true)) {
            return cmd.exec();
        }
    }

    public List<Service> getAllServices() {
        try (ListServicesCmd cmd = getDockerClient().listServicesCmd()) {
            return cmd.exec();
        }
    }

    public Secret getSecret(String secretName) {
        try (ListSecretsCmd cmd = getDockerClient().listSecretsCmd().withNameFilter(List.of(secretName))) {
            return cmd.exec().getFirst();
        }
    }

    public CreateSecretResponse createSecret(String secretName, String secretValue) {
        var spec = new SecretSpec().withData(secretValue).withName(secretName);
        try (CreateSecretCmd cmd = getDockerClient().createSecretCmd(spec)) {
            return cmd.exec();
        }
    }

    public Container createContainerFromCompose(DockerComposeService compose, Map<String, String> labels, PULL_IMAGE pullImage) throws InterruptedException {
        List<Container> containers = findContainers(compose.getContainer_name());
        if (containers.isEmpty()) {
            HealthCheck healthCheck = DockerUtils.getHealthCheck(compose.getHealthcheck());

            List<String> env = compose.getEnvironmentList();

            LOGGER.infof("Compose Service started for %s in network:%s", compose.getContainer_name(), networkName);

            RestartPolicy restartPolicy = RestartPolicy.noRestart();
            if (Objects.equals(compose.getRestart(), RestartPolicy.onFailureRestart(10).getName())) {
                restartPolicy = RestartPolicy.onFailureRestart(10);
            } else if (Objects.equals(compose.getRestart(), RestartPolicy.alwaysRestart().getName())) {
                restartPolicy = RestartPolicy.alwaysRestart();
            }

            return createContainer(compose.getContainer_name(), compose.getImage(),
                    env, compose.getPortsMap(), healthCheck, labels, compose.getVolumes(), networkName, restartPolicy, pullImage,
                    compose.getCpus(), compose.getCpu_percent(), compose.getMem_limit(), compose.getMem_reservation(), compose.getCommand());

        } else {
            LOGGER.info("Compose Service already exists: " + containers.getFirst().getId());
            return containers.getFirst();
        }
    }

    public List<Container> findContainersByProjectId(String projectId) {
        try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withLabelFilter(Map.of(LABEL_INTEGRATION_NAME, projectId))) {
            return cmd.exec();
        }
    }

    public List<Container> findContainersByServiceId(String serviceId) {
        try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withLabelFilter(Map.of(LABEL_SWARM_SERVICE_ID, serviceId))) {
            return cmd.exec();
        }
    }

    public List<Container> findContainers(String containerName) {
        var isSwarm = isInSwarmMode();
        try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(containerName))) {
            var list = cmd.exec();
            return list.stream().filter(c -> {
                var contName = c.getNames()[0].replace("/", "");
                if (Objects.equals(contName, containerName)) {
                    return true;
                } else if (isSwarm) {
                    var stack = c.getLabels().get(LABEL_DOCKER_STACK_NAMESPACE);
                    var fullName = stack + "_" + containerName;
                    return contName.startsWith(fullName);
                } else {
                    return false;
                }
            }).toList();
        }
    }

    public List<Service> findServices(String serviceName) {
        try (ListServicesCmd cmd = getDockerClient().listServicesCmd().withNameFilter(List.of(serviceName))) {
            var list = cmd.exec();
            return list.stream().filter(c -> c.getId() != null && c.getId().startsWith(serviceName)).toList();
        }
    }

    public List<Service> findServicesByProjectId(String projectId) {
        try (ListServicesCmd cmd = getDockerClient().listServicesCmd().withLabelFilter(Map.of(LABEL_INTEGRATION_NAME, projectId))) {
            return cmd.exec();
        }
    }

    public Container createContainer(String name, String image, List<String> env, Map<Integer, Integer> ports,
                                     HealthCheck healthCheck, Map<String, String> labels,
                                     List<DockerVolumeDefinition> volumes, String network, RestartPolicy restartPolicy,
                                     PULL_IMAGE pullImage, String cpus, String cpu_percent, String mem_limit, String mem_reservation,
                                     String dockerCommand) throws InterruptedException {
        List<Container> containers = findContainers(name);
        if (containers.isEmpty()) {
            if (Objects.equals(labels.get(LABEL_TYPE), ContainerType.devmode.name())
                    || Objects.equals(labels.get(LABEL_TYPE), ContainerType.build.name())
                    || Objects.equals(labels.get(LABEL_TYPE), ContainerType.devservice.name())) {
                LOGGER.info("Pulling DevMode image from DockerHub: " + image);
                pullImageFromDockerHub(image, Objects.equals(pullImage, PULL_IMAGE.always));
            }
            if (Objects.equals(labels.get(LABEL_TYPE), ContainerType.packaged.name())) {
                LOGGER.info("Pulling Project image from Registry: " + image);
                pullImage(image, Objects.equals(pullImage, PULL_IMAGE.always));
            }

            Ports portBindings = DockerUtils.getPortBindings(ports);
            List<ExposedPort> exposePorts = DockerUtils.getExposedPorts(ports);
            try (CreateContainerCmd createContainerCmd = getDockerClient().createContainerCmd(image)
                    .withName(name).withLabels(labels).withEnv(env).withHostName(name).withExposedPorts(exposePorts).withHealthcheck(healthCheck)) {

                List<Mount> mounts = new ArrayList<>();
                if (volumes != null && !volumes.isEmpty()) {
                    volumes.forEach(volume -> {
                        var mount = new Mount().withType(MountType.valueOf(volume.getType().toUpperCase())).withTarget(volume.getTarget());
                        if (volume.getSource() != null) {
                            mount = mount.withSource(volume.getSource());
                        }
                        mounts.add(mount);
                    });
                }
                if (dockerCommand != null) {
                    createContainerCmd.withCmd("/bin/sh", "-c", dockerCommand);
                }
//                if (Objects.equals(labels.get(LABEL_PROJECT_ID), ContainerType.build.name())) {
//                    mounts.add(new Mount().withType(MountType.BIND).withSource("/var/run/docker.sock").withTarget("/var/run/docker.sock"));
//                }

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

                try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(Collections.singleton(response.getId()))) {
                    return cmd.exec().getFirst();
                }
            }
        } else {
            LOGGER.info("Container already exists: " + containers.getFirst().getId());
            return containers.getFirst();
        }
    }

    public Service createService(String name, ServiceSpec serviceSpec) {
        List<Service> services = findServices(name);
        if (services.isEmpty()) {
            try (CreateServiceCmd createServiceCmd = getDockerClient().createServiceCmd(serviceSpec)) {
                CreateServiceResponse response = createServiceCmd.exec();
                LOGGER.info("Service created: " + response.getId());

                try (ListServicesCmd cmd = getDockerClient().listServicesCmd().withIdFilter(List.of(response.getId()))) {
                    return cmd.exec().getFirst();
                }
            }
        } else {
            LOGGER.info("Service already exists: " + services.getFirst().getId());
            return services.getFirst();
        }
    }

    public void runContainer(String name) {
        List<Container> containers = findContainers(name);
        if (containers.size() == 1) {
            runContainer(containers.getFirst());
        }
    }

    public void runContainer(Container container) {
        if (container.getState().equals("paused")) {
            try (UnpauseContainerCmd cmd = getDockerClient().unpauseContainerCmd(container.getId())) {
                cmd.exec();
            }
        } else if (!container.getState().equals("running")) {
            try (StartContainerCmd cmd = getDockerClient().startContainerCmd(container.getId())) {
                cmd.exec();
            }
        }
    }

    public void copyFiles(String containerId, String containerPath, Map<String, String> files, boolean dirChildrenOnly) throws IOException {
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
                try (LogContainerCmd cmd = getDockerClient().logContainerCmd(container.getId())
                        .withStdOut(true)
                        .withStdErr(true)
                        .withTimestamps(false)
                        .withFollowStream(true)
                        .withTail(100)) {
                    cmd.exec(callback);
                    callback.awaitCompletion();
                }
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void pauseContainer(String name) {
        List<Container> containers = findContainers(name);
        if (containers.size() == 1) {
            Container container = containers.getFirst();
            if (container.getState().equals("running")) {
                try (PauseContainerCmd cmd = getDockerClient().pauseContainerCmd(container.getId())) {
                    cmd.exec();
                }
            }
        }
    }

    public void stopContainer(String name) {
        List<Container> containers = findContainers(name);
        if (containers.size() == 1) {
            Container container = containers.getFirst();
            if (container.getState().equals("running") || container.getState().equals("paused")) {
                try (StopContainerCmd cmd = getDockerClient().stopContainerCmd(container.getId()).withTimeout(1)) {
                    cmd.exec();
                }
            }
        }
    }

    public void deleteContainer(String name) {
        List<Container> containers = findContainers(name);
        if (containers.size() == 1) {
            Container container = containers.getFirst();
            try (RemoveContainerCmd cmd = getDockerClient().removeContainerCmd(container.getId()).withForce(true)) {
                cmd.exec();
            }
        }
    }

    public void deleteService(String projectId) {
        List<Service> services = findServicesByProjectId(projectId);
        if (services.size() == 1) {
            Service service = services.getFirst();
            try (RemoveServiceCmd cmd = getDockerClient().removeServiceCmd(service.getId())) {
                cmd.exec();
            }
        }
    }

    public void execCommandInContainer(String containerName, String cmd) throws InterruptedException {
        List<Container> containers = findContainers(containerName);
        Quarkus.asyncExit();
        if (containers.size() == 1) {
            Container container = containers.getFirst();
            if (container.getState().equals("running")) {
                try (ExecCreateCmd execCreateCmd = getDockerClient().execCreateCmd(container.getId()).withAttachStdout(true).withAttachStderr(true).withCmd(cmd.split("\\s+"))) {
                    var execCreateCmdResponse = execCreateCmd.exec();
                    try (ExecStartCmd execStartCmd = getDockerClient().execStartCmd(execCreateCmdResponse.getId())) {
                        execStartCmd.exec(new ExecStartResultCallback(System.out, System.err)).awaitCompletion();
                    }


                }
            }
        }
    }

    public void pullImage(String image, boolean pullAlways) throws InterruptedException {
        try (ListImagesCmd cmd = getDockerClient().listImagesCmd().withShowAll(true)) {
            List<Image> images = cmd.exec();
            List<String> tags = images.stream()
                    .map(i -> Arrays.stream(i.getRepoTags()).collect(Collectors.toList()))
                    .flatMap(Collection::stream)
                    .toList();

            if (pullAlways || images.stream().noneMatch(i -> tags.contains(image))) {
                var callback = new DockerPullCallback(LOGGER::info);
                try (PullImageCmd pullImageCmd = getDockerClient().pullImageCmd(image)) {
                    pullImageCmd.exec(callback);
                    callback.awaitCompletion();
                }
            }
        }
    }

    public void pullImageFromDockerHub(String image, boolean pullAlways) throws InterruptedException {
        try (ListImagesCmd cmd = getDockerClientNotConnectedToRegistry().listImagesCmd().withShowAll(true)) {
            List<Image> images = cmd.exec();
            List<String> tags = images.stream()
                    .map(i -> Arrays.stream(i.getRepoTags()).collect(Collectors.toList()))
                    .flatMap(Collection::stream)
                    .toList();

            if (pullAlways || images.stream().noneMatch(i -> tags.contains(image))) {
                var callback = new DockerPullCallback(LOGGER::info);
                try (PullImageCmd pullImageCmd = getDockerClientNotConnectedToRegistry().pullImageCmd(image)) {
                    pullImageCmd.exec(callback);
                    callback.awaitCompletion();
                }
            }
        }
    }

    public void pullImagesForProject(String projectId) throws InterruptedException {
        if (!Objects.equals(registry, "registry:5000") && username.isPresent() && password.isPresent()) {
            var repository = registry + "/" + group + "/" + projectId;
            try (PullImageCmd cmd = getDockerClient().pullImageCmd(repository)) {
                var callback = new DockerPullCallback(LOGGER::info);
                cmd.exec(callback);
                callback.awaitCompletion().onError(new Throwable("Error pulling images"));
            }
        }
    }

    private DockerClientConfig getDockerClientConfig(boolean connectedToRegistry) {
        LOGGER.info("Docker Client Configuring " + (connectedToRegistry ? "( connectedToRegistry)" : ""));
        DefaultDockerClientConfig.Builder builder = DefaultDockerClientConfig.createDefaultConfigBuilder();
        if (connectedToRegistry) {
            LOGGER.info("Docker Client Registry " + registry);
            LOGGER.info("Docker Client Username " + (username.isPresent() ? "is not empty " : "is empty"));
            LOGGER.info("Docker Client Password " + (password.isPresent() ? "is not empty " : "is empty"));
            if (!Objects.equals(registry, "registry:5000") && username.isPresent() && password.isPresent()) {
                builder.withRegistryUrl(registry);
                builder.withRegistryUsername(username.get());
                builder.withRegistryPassword(password.get());
            }
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
            DockerClientConfig config = getDockerClientConfig(true);
            DockerHttpClient httpClient = getDockerHttpClient(config);
            dockerClient = DockerClientImpl.getInstance(config, httpClient);
        }
        return dockerClient;
    }

    public DockerClient getDockerClientNotConnectedToRegistry() {
        if (dockerClientConnectedToRegistry == null) {
            DockerClientConfig config = getDockerClientConfig(false);
            DockerHttpClient httpClient = getDockerHttpClient(config);
            dockerClientConnectedToRegistry = DockerClientImpl.getInstance(config, httpClient);
        }
        return dockerClientConnectedToRegistry;
    }

    public int getMaxPortMapped(int port) {
        try (ListContainersCmd cmd = getDockerClient().listContainersCmd().withShowAll(true)) {
            return cmd.exec().stream()
                    .map(c -> List.of(c.ports))
                    .flatMap(List::stream)
                    .filter(p -> Objects.equals(p.getPrivatePort(), port))
                    .map(ContainerPort::getPublicPort).filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .max().orElse(port);
        }
    }

    public List<ContainerImage> getImages() {
        try (ListImagesCmd cmd = getDockerClient().listImagesCmd().withShowAll(true)) {
            return cmd.exec().stream()
                    .filter(image -> image != null && image.getRepoTags() != null && image.getRepoTags().length > 0)
                    .map(image -> new ContainerImage(image.getId(), image.getRepoTags()[0], image.getCreated(), image.getSize()))
                    .toList();
        }
    }

    public void deleteImage(String imageName) {
        try (ListImagesCmd listImagesCmd = getDockerClient().listImagesCmd().withShowAll(true)) {
            Optional<Image> image = listImagesCmd.exec().stream()
                    .filter(i -> Arrays.asList(i.getRepoTags()).contains(imageName)).findFirst();
            if (image.isPresent()) {
                try (RemoveImageCmd removeImageCmd = getDockerClient().removeImageCmd(image.get().getId())) {
                    removeImageCmd.exec();
                }
            }
        }
    }

    public void createConfig(String name, String config) {
        try (CreateConfigCmd cmd = getDockerClient().createConfigCmd()) {
            cmd.withName(name);
            cmd.withData(config.getBytes());
            cmd.exec();
        }
    }

    @Override
    public HealthCheckResponse call() {
        if (!ConfigService.inKubernetes()) {
            if (checkDockerSwarm()) {
                return HealthCheckResponse.named("Docker Swarm Mode").up().build();
            } else if (checkDocker()) {
                return HealthCheckResponse.named("Docker").up().build();
            }
        }
        return HealthCheckResponse.named("Docker").up().build();
    }
}
