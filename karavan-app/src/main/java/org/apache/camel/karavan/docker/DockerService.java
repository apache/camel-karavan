package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.*;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
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

    private volatile DockerClient dockerClient;
    private volatile DockerClient dockerClientConnectedToRegistry;

    private static Boolean IN_SWARM_MODE = null;

    public boolean isInSwarmMode() {
        if (IN_SWARM_MODE == null) {
            IN_SWARM_MODE = checkDockerSwarm();
        }
        return IN_SWARM_MODE;
    }

    void onStart(@Observes StartupEvent ev) {
        if (!ConfigService.inKubernetes()) {
//            getDockerClient().eventsCmd().withEventFilter("pull", "create", "attach", "start", "stop", "kill").exec(dockerEventHandler);
            try (EventsCmd cmd = getDockerClient().eventsCmd()) {
                cmd.exec(dockerEventHandler);
            }
        }
    }

    void onStop(@Observes ShutdownEvent ev) {
        if (!ConfigService.inKubernetes()) {
            try {
                dockerEventHandler.close();
            } catch (Exception e) {
                LOGGER.warn("Error closing DockerEventHandler", e);
            }
            shutdownClients();
        }
    }

    private synchronized void shutdownClients() {
        LOGGER.info("Shutting down DockerClient");
        if (dockerClient != null) {
            try {
                dockerClient.close();
            } catch (IOException e) {
                LOGGER.warn("Error closing DockerClient", e);
            } finally {
                dockerClient = null;
            }
        }
        if (dockerClientConnectedToRegistry != null) {
            try {
                dockerClientConnectedToRegistry.close();
            } catch (IOException e) {
                LOGGER.warn("Error closing DockerClientConnectedToRegistry", e);
            } finally {
                dockerClientConnectedToRegistry = null;
            }
        }
    }

    public boolean checkDocker() {
        LOGGER.info("Checking Docker");
        try {
            getDockerClient().infoCmd().exec();
            return true;
        } catch (Exception e) {
            LOGGER.error("Error connecting Docker: " + e.getMessage());
            return false;
        }
    }

    public boolean checkDockerSwarm() {
        try {
            Info info = getDockerClient().infoCmd().exec();
            var swarmInfo = info.getSwarm();
            var nodes = (swarmInfo != null && swarmInfo.getNodes() != null) ? swarmInfo.getNodes() : 0;
            return swarmInfo != null && nodes > 0;
        } catch (Exception e) {
            LOGGER.error("Error connecting Docker: " + e.getMessage());
            return false;
        }
    }

    public JsonObject getInfo() {
        try {
            var info = getDockerClient().infoCmd().exec();
            var swarm = info.getSwarm();
            if (swarm != null) {
                return JsonObject.of(
                        "Nodes", swarm.getNodes(),
                        "NodeId", swarm.getNodeID(),
                        "Managers", swarm.getManagers(),
                        "Error", swarm.getError(),
                        "MemTotal", info.getMemTotal()
                );
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return JsonObject.of("Nodes", 0, "Error", "Swarm or Info is unavailable");
    }

    public Container getContainer(String id) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(List.of(id)).exec();
        return containers.isEmpty() ? null : containers.getFirst();
    }

    public Container getContainerByName(String name) {
        List<Container> containers = findContainers(name);
        return !containers.isEmpty() ? containers.getFirst() : null;
    }

    public List<Container> getAllContainers() {
        return getDockerClient().listContainersCmd().withShowAll(true).exec();
    }

    public List<Service> getAllServices() {
        return getDockerClient().listServicesCmd().exec();
    }

    public Secret getSecret(String secretName) {
        return getDockerClient().listSecretsCmd().withNameFilter(List.of(secretName)).exec().getFirst();
    }

    public CreateSecretResponse createSecret(String secretName, String secretValue) {
        var spec = new SecretSpec().withData(secretValue).withName(secretName);
        return getDockerClient().createSecretCmd(spec).exec();
    }

    public Container createContainerFromCompose(DockerComposeService compose, Map<String, String> labels, PULL_IMAGE pullImage) throws InterruptedException {
        List<Container> containers = findContainers(compose.getContainer_name());
        if (containers.isEmpty()) {
            HealthCheck healthCheck = DockerUtils.getHealthCheck(compose.getHealthcheck());
            List<String> env = compose.getEnvironmentList();
            RestartPolicy restartPolicy = RestartPolicy.noRestart();
            if (Objects.equals(compose.getRestart(), "on-failure")) {
                restartPolicy = RestartPolicy.onFailureRestart(10);
            } else if (Objects.equals(compose.getRestart(), "always")) {
                restartPolicy = RestartPolicy.alwaysRestart();
            }

            return createContainer(compose.getContainer_name(), compose.getImage(),
                    env, compose.getPortsMap(), healthCheck, labels, compose.getVolumes(), networkName, restartPolicy, pullImage,
                    compose.getCpus(), compose.getCpu_percent(), compose.getMem_limit(), compose.getMem_reservation(), compose.getCommand());
        } else {
            return containers.getFirst();
        }
    }

    public List<Container> findContainersByProjectId(String projectId) {
        return getDockerClient().listContainersCmd().withLabelFilter(Map.of(LABEL_PROJECT_ID, projectId)).exec();
    }

    public List<Container> findContainersByServiceId(String serviceId) {
        return getDockerClient().listContainersCmd().withLabelFilter(Map.of(LABEL_SWARM_SERVICE_ID, serviceId)).exec();
    }

    public List<Container> findContainers(String containerName) {
        var isSwarm = isInSwarmMode();
        var list = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(containerName)).exec();
        return list.stream().filter(c -> {
            var contName = c.getNames()[0].replace("/", "");
            if (Objects.equals(contName, containerName)) return true;
            if (isSwarm) {
                var stack = c.getLabels().get(LABEL_DOCKER_STACK_NAMESPACE);
                return contName.startsWith(stack + "_" + containerName);
            }
            return false;
        }).toList();
    }

    public List<Service> findServices(String serviceName) {
        var list = getDockerClient().listServicesCmd().withNameFilter(List.of(serviceName)).exec();
        return list.stream().filter(c -> c.getId() != null && c.getId().startsWith(serviceName)).toList();
    }

    public List<Service> findServicesByProjectId(String projectId) {
        return getDockerClient().listServicesCmd().withLabelFilter(Map.of(LABEL_PROJECT_ID, projectId)).exec();
    }

    public Container createContainer(String name, String image, List<String> env, Map<Integer, Integer> ports,
                                     HealthCheck healthCheck, Map<String, String> labels,
                                     List<DockerVolumeDefinition> volumes, String network, RestartPolicy restartPolicy,
                                     PULL_IMAGE pullImage, String cpus, String cpu_percent, String mem_limit, String mem_reservation,
                                     String dockerCommand) throws InterruptedException {

        if (Objects.equals(labels.get(LABEL_TYPE), ContainerType.devmode.name()) || Objects.equals(labels.get(LABEL_TYPE), ContainerType.build.name())) {
            pullImageFromDockerHub(image, Objects.equals(pullImage, PULL_IMAGE.always));
        } else if (Objects.equals(labels.get(LABEL_TYPE), ContainerType.packaged.name())) {
            pullImage(image, Objects.equals(pullImage, PULL_IMAGE.always));
        }

        Ports portBindings = DockerUtils.getPortBindings(ports);
        List<ExposedPort> exposePorts = DockerUtils.getExposedPorts(ports);

        CreateContainerCmd createContainerCmd = getDockerClient().createContainerCmd(image)
                .withName(name).withLabels(labels).withEnv(env).withHostName(name)
                .withExposedPorts(exposePorts).withHealthcheck(healthCheck);

        List<Mount> mounts = new ArrayList<>();
        if (volumes != null) {
            volumes.forEach(v -> mounts.add(new Mount().withType(MountType.valueOf(v.getType().toUpperCase())).withTarget(v.getTarget()).withSource(v.getSource())));
        }
        if (dockerCommand != null) createContainerCmd.withCmd("/bin/sh", "-c", dockerCommand);

        createContainerCmd.withHostConfig(new HostConfig()
                .withRestartPolicy(restartPolicy).withPortBindings(portBindings).withMounts(mounts)
                .withMemory(DockerUtils.parseMemory(mem_limit)).withMemoryReservation(DockerUtils.parseMemory(mem_reservation))
                .withCpuPercent(NumberUtils.toLong(cpu_percent)).withNanoCPUs(NumberUtils.toLong(cpus))
                .withNetworkMode(network != null ? network : networkName));

        CreateContainerResponse response = createContainerCmd.exec();
        return getContainer(response.getId());
    }

    public Service createService(String name, ServiceSpec serviceSpec) {
        CreateServiceResponse response = getDockerClient().createServiceCmd(serviceSpec).exec();
        return getDockerClient().listServicesCmd().withIdFilter(List.of(response.getId())).exec().getFirst();
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

    public void runContainer(Container container) {
        if (container != null) {
            if (container.getState().equals("paused")) {
                getDockerClient().unpauseContainerCmd(container.getId()).exec();
            } else if (!container.getState().equals("running")) {
                getDockerClient().startContainerCmd(container.getId()).exec();
            }
        }
    }


    public void runContainer(String name) {
        Container container = getContainerByName(name);
        runContainer(container);
    }

    public void logContainer(String containerName, DockerLogCallback callback) {
        try {
            Container container = getContainerByName(containerName);
            if (container != null) {
                getDockerClient().logContainerCmd(container.getId())
                        .withStdOut(true).withStdErr(true).withFollowStream(true).withTail(100)
                        .exec(callback);
                callback.awaitCompletion();
            }
        } catch (Exception e) {
            LOGGER.error("Logging error: " + e.getMessage());
        }
    }

    public void pauseContainer(String name) {
        List<Container> containers = findContainers(name);
        if (containers.size() == 1) {
            Container container = containers.getFirst();
            if (container.getState().equals("running")) {
                getDockerClient().pauseContainerCmd(container.getId()).exec();
            }
        }
    }

    public void stopContainer(String name) {
        Container container = getContainerByName(name);
        if (container != null && (container.getState().equals("running") || container.getState().equals("paused"))) {
            getDockerClient().stopContainerCmd(container.getId()).withTimeout(1).exec();
        }
    }

    public void deleteContainer(String name) {
        Container container = getContainerByName(name);
        if (container != null) {
            getDockerClient().removeContainerCmd(container.getId()).withForce(true).exec();
        }
    }

    public void deleteService(String projectId) {
        List<Service> services = findServicesByProjectId(projectId);
        if (services.size() == 1) {
            Service service = services.getFirst();
            getDockerClient().removeServiceCmd(service.getId()).exec();
        }
    }

    public void execCommandInContainer(String containerName, String cmd) throws InterruptedException {
        List<Container> containers = findContainers(containerName);
        if (containers.size() == 1) {
            Container container = containers.getFirst();
            if (container.getState().equals("running")) {
                var execCreateCmdResponse = getDockerClient().execCreateCmd(container.getId()).withAttachStdout(true).withAttachStderr(true).withCmd(cmd.split("\\s+")).exec();
                getDockerClient().execStartCmd(execCreateCmdResponse.getId()).exec(new ExecStartResultCallback(System.out, System.err)).awaitCompletion();
            }
        }
    }


    public void pullImage(String image, boolean pullAlways) throws InterruptedException {
        List<Image> images = getDockerClient().listImagesCmd().withShowAll(true).exec();
        if (pullAlways || images.stream().noneMatch(i -> Arrays.asList(i.getRepoTags()).contains(image))) {
            var callback = new DockerPullCallback(LOGGER::info);
            getDockerClient().pullImageCmd(image).exec(callback);
            callback.awaitCompletion();
        }
    }

    public void pullImageFromDockerHub(String image, boolean pullAlways) throws InterruptedException {
        List<Image> images = getDockerClientNotConnectedToRegistry().listImagesCmd().withShowAll(true).exec();
        if (pullAlways || images.stream().noneMatch(i -> Arrays.asList(i.getRepoTags()).contains(image))) {
            var callback = new DockerPullCallback(LOGGER::info);
            getDockerClientNotConnectedToRegistry().pullImageCmd(image).exec(callback);
            callback.awaitCompletion();
        }
    }

    public void pullImagesForProject(String projectId) throws InterruptedException {
        if (!Objects.equals(registry, "registry:5000") && username.isPresent() && password.isPresent()) {
            var repository = registry + "/" + group + "/" + projectId;
            var callback = new DockerPullCallback(LOGGER::info);
            getDockerClient().pullImageCmd(repository).exec(callback);
            callback.awaitCompletion().onError(new Throwable("Error pulling images"));
        }
    }

    private DockerClientConfig getDockerClientConfig(boolean connectedToRegistry) {
        DefaultDockerClientConfig.Builder builder = DefaultDockerClientConfig.createDefaultConfigBuilder();
        if (connectedToRegistry && !Objects.equals(registry, "registry:5000") && username.isPresent() && password.isPresent()) {
            builder.withRegistryUrl(registry).withRegistryUsername(username.get()).withRegistryPassword(password.get());
        }
        return builder.build();
    }

    private DockerHttpClient getDockerHttpClient(DockerClientConfig config) {
        return new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(100)
                .connectionTimeout(java.time.Duration.ofSeconds(10))
                .responseTimeout(java.time.Duration.ofSeconds(45))
                .build();
    }

    public synchronized DockerClient getDockerClient() {
        try {
            if (dockerClient != null) {
                dockerClient.pingCmd().exec();
            }
        } catch (Exception e) {
            LOGGER.error("Primary Docker client dead, resetting connection pool: " + e.getMessage());
            shutdownClients(); // Close the broken pool
        }

        if (dockerClient == null) {
            DockerClientConfig config = getDockerClientConfig(true);
            dockerClient = DockerClientImpl.getInstance(config, getDockerHttpClient(config));
        }
        return dockerClient;
    }

    public synchronized DockerClient getDockerClientNotConnectedToRegistry() {
        if (dockerClientConnectedToRegistry == null) {
            DockerClientConfig config = getDockerClientConfig(false);
            dockerClientConnectedToRegistry = DockerClientImpl.getInstance(config, getDockerHttpClient(config));
        }
        return dockerClientConnectedToRegistry;
    }

    public List<ContainerImage> getImages() {
        return getDockerClient().listImagesCmd().withShowAll(true).exec().stream()
                .filter(i -> i.getRepoTags() != null && i.getRepoTags().length > 0)
                .map(i -> new ContainerImage(i.getId(), i.getRepoTags()[0], i.getCreated(), i.getSize()))
                .toList();
    }

    public void deleteImage(String imageName) {
        Optional<Image> image = getDockerClient().listImagesCmd().withShowAll(true).exec().stream()
                .filter(i -> Arrays.asList(i.getRepoTags()).contains(imageName)).findFirst();
        if (image.isPresent()) {
            getDockerClient().removeImageCmd(image.get().getId()).exec();
        }
    }

    public void createConfig(String name, String config) {
        getDockerClient().createConfigCmd().withName(name).withData(config.getBytes()).exec();
    }

    @Override
    public HealthCheckResponse call() {
        if (!ConfigService.inKubernetes()) {
            return checkDocker() ? HealthCheckResponse.named("Docker").up().build() : HealthCheckResponse.named("Docker").down().build();
        }
        return HealthCheckResponse.named("Docker").up().build();
    }
}