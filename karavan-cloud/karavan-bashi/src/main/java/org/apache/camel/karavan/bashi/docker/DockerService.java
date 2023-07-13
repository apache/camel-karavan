package org.apache.camel.karavan.bashi.docker;

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
import io.quarkus.scheduler.Scheduled;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.bashi.Constants;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;
import java.text.DecimalFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.bashi.ConductorService.ADDRESS_CONTAINER_STATS;
import static org.apache.camel.karavan.bashi.ConductorService.ADDRESS_INFINISPAN_HEALTH;
import static org.apache.camel.karavan.bashi.Constants.DATAGRID_CONTAINER_NAME;
import static org.apache.camel.karavan.bashi.Constants.NETWORK_NAME;

@ApplicationScoped
public class DockerService {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());
    private static final DecimalFormat formatCpu = new DecimalFormat("0.00");
    private static final DecimalFormat formatMiB = new DecimalFormat("0.0");
    private static final DecimalFormat formatGiB = new DecimalFormat("0.00");
    private static final Map<String, Tuple2<Long, Long>> previousStats = new ConcurrentHashMap<>();

    @Inject
    DockerEventListener dockerEventListener;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container-stats-interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStats() {
        getDockerClient().listContainersCmd().exec().forEach(container -> {
            Statistics stats = getContainerStats(container.getId());

            String name = container.getNames()[0].replace("/", "");
            String projectId = name.replace("-" + Constants.DEVMODE_SUFFIX, "");
            String memoryUsage = formatMemory(stats.getMemoryStats().getUsage());
            String memoryLimit = formatMemory(stats.getMemoryStats().getLimit());
            JsonObject data = JsonObject.of(
                    "projectId", projectId,
                    "memory", memoryUsage + " / " + memoryLimit,
                    "cpu", formatCpu(name, stats)
            );
            eventBus.publish(ADDRESS_CONTAINER_STATS, data);
        });
    }

    private String formatMemory(Long memory) {
        if (memory < (1073741824)) {
            return formatMiB.format(memory.doubleValue() / 1048576) + "MiB";
        } else {
            return formatGiB.format(memory.doubleValue() / 1073741824) + "GiB";
        }
    }

    private String formatCpu(String containerName, Statistics stats) {
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
    }

    public void startListeners() {
        getDockerClient().eventsCmd().exec(dockerEventListener);
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
            LOGGER.info("Network created: {}" + res);
        } else {
            LOGGER.info("Network already exists with name: " + NETWORK_NAME);
        }
    }

    public void checkDataGridHealth() {
        getDockerClient().listContainersCmd().exec().stream()
                .filter(c -> c.getState().equals("running"))
                .forEach(c -> {
                    HealthState hs = getDockerClient().inspectContainerCmd(c.getId()).exec().getState().getHealth();
                    if (c.getNames()[0].equals("/" + DATAGRID_CONTAINER_NAME)) {
                        eventBus.publish(ADDRESS_INFINISPAN_HEALTH, hs.getStatus());
                    }
                });
    }

    public Container getContainer(String id) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(List.of(id)).exec();
        return containers.get(0);
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

    public Container createContainer(String name, String image, List<String> env, String ports,
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
                    .withHostConfig(getHostConfig(ports, exposedPort))
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
        if (!images.stream().filter(i -> Arrays.asList(i.getRepoTags()).contains(image)).findFirst().isPresent()) {
            ResultCallback.Adapter<PullResponseItem> pull = getDockerClient().pullImageCmd(image).start().awaitCompletion();
        }
    }

    private HostConfig getHostConfig(String ports, boolean exposedPort) {
        Ports portBindings = new Ports();
        getPortsFromString(ports).forEach((hostPort, containerPort) -> {
            portBindings.bind(
                    ExposedPort.tcp(containerPort),
                    exposedPort ? Ports.Binding.bindIp("0.0.0.0").bindPort(hostPort) : Ports.Binding.bindPort(hostPort)
            );
        });
        return new HostConfig()
                .withPortBindings(portBindings)
                .withNetworkMode(NETWORK_NAME);
    }

    private Map<Integer, Integer> getPortsFromString(String ports) {
        Map<Integer, Integer> p = new HashMap<>();
        if (!ports.isEmpty()) {
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
}
