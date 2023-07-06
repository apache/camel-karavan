package org.apache.camel.karavan.bashi.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.CreateNetworkResponse;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.apache.camel.karavan.bashi.KaravanConstants.NETWORK_NAME;

@ApplicationScoped
public class DockerService {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());

    @Inject
    DockerEventListener dockerEventListener;

    public void startListeners() {
        getDockerClient().eventsCmd().exec(dockerEventListener);
    }

    public void createNetwork() {
        if (!getDockerClient().listNetworksCmd().exec().stream().filter(n -> n.getName().equals(NETWORK_NAME))
                .findFirst().isPresent()) {
            CreateNetworkResponse res = getDockerClient().createNetworkCmd().withName(NETWORK_NAME).exec();
            LOGGER.info("Network created: {}" + res);
        } else {
            LOGGER.info("Network already exists with name: " + NETWORK_NAME);
        }
    }

    public void createContainer(String name, String image, List<String> env, String ports, boolean hostNet) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        System.out.println(containers);
        if (containers.size() == 0) {
            pullImage(image);

            CreateContainerResponse container = getDockerClient().createContainerCmd(image)
                    .withName(name)
                    .withEnv(env)
                    .withHostName(name)
                    .withHostConfig(getHostConfig(ports, hostNet))
                    .exec();
            LOGGER.info("Container created: " + container.toString());
        } else {
            LOGGER.info("Container already exists: " + containers.get(0).toString());
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

    public void stopContainer(String name) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 1) {
            Container container = containers.get(0);
            if (container.getState().equals("running")) {
                getDockerClient().stopContainerCmd(container.getId()).exec();
            }
        }
    }

    public void pullImage(String image) throws InterruptedException {
        ResultCallback.Adapter<PullResponseItem>  pull = getDockerClient().pullImageCmd(image).start().awaitCompletion();
    }

    private HostConfig getHostConfig(String ports, boolean hostNet) {
        Ports portBindings = new Ports();
        getPortsFromString(ports).forEach((hostPort, containerPort) -> {
            portBindings.bind(ExposedPort.tcp(containerPort), Ports.Binding.bindPort(hostPort));
        });
        return new HostConfig()
                .withPortBindings(portBindings)
                .withNetworkMode(hostNet ? "host" : NETWORK_NAME);
    }

    private Map<Integer,Integer> getPortsFromString(String ports){
        Map<Integer,Integer> p = new HashMap<>();
        Arrays.stream(ports.split(",")).forEach(s -> {
            String[] values = s.split(":");
            p.put(Integer.parseInt(values[0]), Integer.parseInt(values[1]));
        });
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
