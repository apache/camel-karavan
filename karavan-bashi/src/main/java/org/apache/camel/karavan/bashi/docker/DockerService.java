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
import io.vertx.core.eventbus.EventBus;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.bashi.ConductorService.ADDRESS_INFINISPAN_HEALTH;
import static org.apache.camel.karavan.bashi.Constants.NETWORK_NAME;

@ApplicationScoped
public class DockerService {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());

    @Inject
    DockerEventListener dockerEventListener;

    @Inject
    EventBus eventBus;

    public void startListeners() {
        getDockerClient().eventsCmd().exec(dockerEventListener);
    }

    public void createNetwork() {
        if (!getDockerClient().listNetworksCmd().exec().stream()
                .filter(n -> n.getName().equals(NETWORK_NAME))
                .findFirst().isPresent()) {
            CreateNetworkResponse res = getDockerClient().createNetworkCmd().withName(NETWORK_NAME).withAttachable(true).exec();
            LOGGER.info("Network created: {}" + res);
        } else {
            LOGGER.info("Network already exists with name: " + NETWORK_NAME);
        }
    }

    public void checkContainersStatus() {
        getDockerClient().listContainersCmd().withShowAll(true).exec().stream()
                .filter(c -> c.getState().equals("running"))
                .forEach(c -> {
                    HealthState hs = getDockerClient().inspectContainerCmd(c.getId()).exec().getState().getHealth();
                    if (c.getNames()[0].equals("/infinispan")) {
                        eventBus.publish(ADDRESS_INFINISPAN_HEALTH, hs.getStatus());
                    }
                });
    }

    public Container getContainer(String id) {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withIdFilter(List.of(id)).exec();
        return containers.get(0);
    }

    public List<Container> getRunnerContainer() {
        return getDockerClient().listContainersCmd()
                .withShowAll(true).withLabelFilter(Map.of("type", "runner")).exec();
    }

    public Statistics getContainerStats(String id) {
        InvocationBuilder.AsyncResultCallback<Statistics> callback = new InvocationBuilder.AsyncResultCallback<>();
        getDockerClient().statsCmd(id).withContainerId(id).exec(callback);
        Statistics stats = null;
        try {
            stats = callback.awaitResult();
            callback.close();
        } catch (RuntimeException | IOException e) {
            // you may want to throw an exception here
        }
        return stats;
    }

    public void createContainer(String name, String image, List<String> env, String ports,
                                boolean exposedPort, HealthCheck healthCheck, Map<String, String> labels) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 0) {
            pullImage(image);

            List<ExposedPort> exposedPorts = getPortsFromString(ports).values().stream().map(i -> ExposedPort.tcp(i)).collect(Collectors.toList());

            CreateContainerResponse container = getDockerClient().createContainerCmd(image)
                    .withName(name)
                    .withLabels(labels)
                    .withEnv(env)
                    .withExposedPorts(exposedPorts)
                    .withHostName(name)
                    .withHostConfig(getHostConfig(ports, exposedPort))
                    .withHealthcheck(healthCheck)
                    .exec();
            LOGGER.info("Container created: " + container.getId());
        } else {
            LOGGER.info("Container already exists: " + containers.get(0).getId());
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
