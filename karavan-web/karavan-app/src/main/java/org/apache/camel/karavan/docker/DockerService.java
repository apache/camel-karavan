package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.CreateNetworkResponse;
import com.github.dockerjava.api.command.HealthState;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.InvocationBuilder;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.infinispan.model.Project;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;
import java.text.DecimalFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.EventType.*;

@ApplicationScoped
public class DockerService {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());

    public static final String INFINISPAN_CONTAINER_NAME = "infinispan";
    public static final String KARAVAN_CONTAINER_NAME = "karavan-headless";

    public static final String NETWORK_NAME = "karavan";
    public static final String LABEL_TYPE = "org.apache.camel.karavan.type";
    public static final String LABEL_PROJECT_ID = "org.apache.camel.karavan.projectId";
    private static final DecimalFormat formatCpu = new DecimalFormat("0.00");
    private static final DecimalFormat formatMiB = new DecimalFormat("0.0");
    private static final DecimalFormat formatGiB = new DecimalFormat("0.00");
    private static final Map<String, Tuple2<Long, Long>> previousStats = new ConcurrentHashMap<>();
    private static final List<String> infinispanHealthCheckCMD = List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status");

    @ConfigProperty(name = "karavan.devmode.image")
    String devmodeImage;

    @ConfigProperty(name = "karavan.headless.image")
    String headlessImage;

    @ConfigProperty(name = "infinispan.image")
    String infinispanImage;
    @ConfigProperty(name = "infinispan.hosts")
    String infinispanHosts;
    @ConfigProperty(name = "infinispan.port")
    String infinispanPort;
    @ConfigProperty(name = "infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name = "infinispan.password")
    String infinispanPassword;

    @Inject
    DockerEventListener dockerEventListener;

    @Inject
    EventBus eventBus;

    public void runDevmodeContainer(Project project, String jBangOptions) throws InterruptedException {
        String projectId = project.getProjectId();
        LOGGER.infof("DevMode starting for %s", projectId);
        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);
        createContainer(projectId, devmodeImage,
                List.of(), null, false, false, healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.CType.devmode.name(), LABEL_PROJECT_ID, projectId));
        startContainer(projectId);
        LOGGER.infof("DevMode started for %s", projectId);
    }

    public void startInfinispan() {
        try {
            LOGGER.info("Infinispan is starting...");

            HealthCheck healthCheck = new HealthCheck().withTest(infinispanHealthCheckCMD)
                    .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

            createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                    List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                    infinispanPort, false, true, healthCheck, Map.of()
            );
            startContainer(INFINISPAN_CONTAINER_NAME);
            LOGGER.info("Infinispan is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void startKaravanHeadlessContainer() {
        try {
            LOGGER.info("Karavan headless is starting...");

            createContainer(KARAVAN_CONTAINER_NAME, headlessImage,
                    List.of(
                            "INFINISPAN_HOSTS=infinispan:11222",
                            "INFINISPAN_USERNAME=" + infinispanUsername,
                            "INFINISPAN_PASSWORD=" + infinispanPassword
                    ),
                    null, false, false, new HealthCheck(), Map.of());
            startContainer(KARAVAN_CONTAINER_NAME);
            LOGGER.info("Karavan headless is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void deleteKaravanHeadlessContainer() {
        try {
            deleteContainer(KARAVAN_CONTAINER_NAME);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void collectContainersStats() {
        getDockerClient().listContainersCmd().exec().forEach(container -> {
            Statistics stats = getContainerStats(container.getId());

            String name = container.getNames()[0].replace("/", "");
            String memoryUsage = formatMemory(stats.getMemoryStats().getUsage());
            String memoryLimit = formatMemory(stats.getMemoryStats().getLimit());
            JsonObject data = JsonObject.of(
                    "projectId", name,
                    "memory", memoryUsage + " / " + memoryLimit,
                    "cpu", formatCpu(name, stats)
            );
            eventBus.publish(CONTAINER_STATISTICS, data);
        });
    }

    public void collectContainersStatuses() {
        getDockerClient().listContainersCmd().exec().forEach(container -> {
            String name = container.getNames()[0].replace("/", "");
            if (!Objects.equals(name, INFINISPAN_CONTAINER_NAME)) {
                dockerEventListener.onCreateContainer(container, new Event(container.getStatus(), container.getId(), container.getImage(), container.getCreated()));
            }
            if (Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerStatus.CType.devmode.name())) {
                dockerEventListener.onCreateContainer(container, new Event(container.getStatus(), container.getId(), container.getImage(), container.getCreated()));
            }
        });
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

    public void checkInfinispanHealth() {
        getDockerClient().listContainersCmd().exec().stream()
                .filter(c -> c.getState().equals("running"))
                .forEach(c -> {
                    HealthState hs = getDockerClient().inspectContainerCmd(c.getId()).exec().getState().getHealth();
                    if (c.getNames()[0].equals("/" + INFINISPAN_CONTAINER_NAME)) {
                        eventBus.publish(INFINISPAN_STARTED, hs.getStatus());
                    }
                });
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

    public Container createContainer(String name, String image, List<String> env, String ports, boolean inRange,
                                     boolean exposedPort, HealthCheck healthCheck, Map<String, String> labels) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 0) {
            pullImage(image);

            List<ExposedPort> exposedPorts = getPortsFromString(ports).values().stream().map(i -> ExposedPort.tcp(i)).collect(Collectors.toList());

            CreateContainerResponse response = getDockerClient().createContainerCmd(image)
                    .withName(name)
                    .withLabels(labels)
                    .withEnv(env)
                    .withExposedPorts(exposedPorts)
                    .withHostName(name)
                    .withHostConfig(getHostConfig(ports, exposedPort, inRange))
                    .withHealthcheck(healthCheck)
                    .exec();
            LOGGER.info("Container created: " + response.getId());
            return getDockerClient().listContainersCmd().withShowAll(true)
                    .withIdFilter(Collections.singleton(response.getId())).exec().get(0);
        } else {
            LOGGER.info("Container already exists: " + containers.get(0).getId());
            return containers.get(0);
        }
    }

    public void startContainer(String name) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (!container.getState().equals("running")) {
                getDockerClient().startContainerCmd(container.getId()).exec();
            }
        }
    }

    public void restartContainer(String name) throws InterruptedException {
        stopContainer(name);
        startContainer(name);
    }

    public LogCallback logContainer(String containerName) {
        try {
            Container container = getContainerByName(containerName);
            if (container != null) {
                LogCallback callback = new LogCallback(eventBus);
                getDockerClient().logContainerCmd(container.getId())
                        .withStdOut(true)
                        .withStdErr(true)
                        .withTimestamps(true)
                        .withFollowStream(true)
                        .withTailAll()
                        .exec(callback);
                callback.awaitCompletion();
                return callback;
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
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
            getDockerClient().removeContainerCmd(container.getId()).exec();
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

    private HostConfig getHostConfig(String ports, boolean exposedPort, boolean inRange) {
        Ports portBindings = new Ports();

        getPortsFromString(ports).forEach((hostPort, containerPort) -> {
            Ports.Binding binding = exposedPort
                    ? (inRange ? Ports.Binding.bindPortRange(hostPort, hostPort + 1000) : Ports.Binding.bindPort(hostPort))
                    : Ports.Binding.bindPort(hostPort);
            portBindings.bind(ExposedPort.tcp(containerPort), binding);
        });
        return new HostConfig()
                .withPortBindings(portBindings)
                .withNetworkMode(NETWORK_NAME);
    }

    private Map<Integer, Integer> getPortsFromString(String ports) {
        Map<Integer, Integer> p = new HashMap<>();
        if (ports != null && !ports.isEmpty()) {
            Arrays.stream(ports.split(",")).forEach(s -> {
                String[] values = s.split(":");
                p.put(Integer.parseInt(values[0]), Integer.parseInt(values[1]));
            });
        }
        return p;
    }

    private DockerClientConfig getDockerClientConfig() {
        return DefaultDockerClientConfig.createDefaultConfigBuilder().build();
    }

    private DockerHttpClient getDockerHttpClient() {
        DockerClientConfig config = getDockerClientConfig();

        return new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(100)
                .build();
    }

    private DockerClient getDockerClient() {
        return DockerClientImpl.getInstance(getDockerClientConfig(), getDockerHttpClient());
    }

    private String formatMemory(Long memory) {
        try {
            if (memory < (1073741824)) {
                return formatMiB.format(memory.doubleValue() / 1048576) + "MiB";
            } else {
                return formatGiB.format(memory.doubleValue() / 1073741824) + "GiB";
            }
        } catch (Exception e) {
            return "";
        }
    }

    private String formatCpu(String containerName, Statistics stats) {
        try {
            double cpuUsage = 0;
            long previousCpu = previousStats.containsKey(containerName) ? previousStats.get(containerName).getItem1() : -1;
            long previousSystem = previousStats.containsKey(containerName) ? previousStats.get(containerName).getItem2() : -1;

            CpuStatsConfig cpuStats = stats.getCpuStats();
            if (cpuStats != null) {
                CpuUsageConfig cpuUsageConfig = cpuStats.getCpuUsage();
                long systemUsage = cpuStats.getSystemCpuUsage();
                long totalUsage = cpuUsageConfig.getTotalUsage();

                if (previousCpu != -1 && previousSystem != -1) {
                    float cpuDelta = totalUsage - previousCpu;
                    float systemDelta = systemUsage - previousSystem;

                    if (cpuDelta > 0 && systemDelta > 0) {
                        cpuUsage = cpuDelta / systemDelta * cpuStats.getOnlineCpus() * 100;
                    }
                }
                previousStats.put(containerName, Tuple2.of(totalUsage, systemUsage));
            }
            return formatCpu.format(cpuUsage) + "%";
        } catch (Exception e) {
            return "";
        }
    }
}
