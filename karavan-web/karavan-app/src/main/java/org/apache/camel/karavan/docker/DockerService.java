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
import com.github.dockerjava.api.command.CreateContainerCmd;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.CreateNetworkResponse;
import com.github.dockerjava.api.command.HealthState;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.InvocationBuilder;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import io.vertx.core.eventbus.EventBus;
import org.apache.camel.karavan.docker.model.DevService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.Constants.*;
import static org.apache.camel.karavan.shared.EventType.INFINISPAN_STARTED;

@ApplicationScoped
public class DockerService extends DockerServiceUtils {

    private static final Logger LOGGER = Logger.getLogger(DockerService.class.getName());

    protected static final String INFINISPAN_CONTAINER_NAME = "infinispan";
    protected static final String KARAVAN_CONTAINER_NAME = "karavan-headless";

    protected static final String NETWORK_NAME = "karavan";

    private static final List<String> infinispanHealthCheckCMD = List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status");

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @ConfigProperty(name = "karavan.devmode.image")
    String devmodeImage;

    @ConfigProperty(name = "karavan.headless.image")
    String headlessImage;

    @ConfigProperty(name = "infinispan.image")
    String infinispanImage;
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

    public void createDevmodeContainer(String projectId, String jBangOptions) throws InterruptedException {
        LOGGER.infof("DevMode starting for %s with JBANG_OPTIONS=%s", projectId, jBangOptions);

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        List<String> env = jBangOptions != null && !jBangOptions.trim().isEmpty()
                ? List.of(ENV_VAR_JBANG_OPTIONS + "=" + jBangOptions)
                : List.of();

        createContainer(projectId, devmodeImage,
                env, null, false, List.of(), healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devmode.name(), LABEL_PROJECT_ID, projectId));

        LOGGER.infof("DevMode started for %s", projectId);
    }

    public void createDevserviceContainer(DevService devService) throws InterruptedException {
        LOGGER.infof("DevService starting for ", devService.getContainer_name());

        HealthCheck healthCheck = getHealthCheck(devService.getHealthcheck());
        List<String> env = devService.getEnvironment() != null ? devService.getEnvironmentList() : List.of();
        String ports = String.join(",", devService.getPorts());

        createContainer(devService.getContainer_name(), devService.getImage(),
                env, ports, false, devService.getExpose(), healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devservice.name()));

        LOGGER.infof("DevService started for %s", devService.getContainer_name());
    }

    public void startInfinispan() {
        try {
            LOGGER.info("Infinispan is starting...");

            HealthCheck healthCheck = new HealthCheck().withTest(infinispanHealthCheckCMD)
                    .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

            List<String> exposedPorts = List.of(infinispanPort.split(":")[0]);

            createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                    List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                    infinispanPort, false, exposedPorts, healthCheck,
                    Map.of(LABEL_TYPE, ContainerStatus.ContainerType.internal.name()));

            runContainer(INFINISPAN_CONTAINER_NAME);
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
                    null, false, List.of(), new HealthCheck(),
                    Map.of(LABEL_TYPE, ContainerStatus.ContainerType.internal.name()));

            runContainer(KARAVAN_CONTAINER_NAME);
            LOGGER.info("Karavan headless is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void deleteKaravanHeadlessContainer() {
        try {
            stopContainer(KARAVAN_CONTAINER_NAME);
            deleteContainer(KARAVAN_CONTAINER_NAME);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
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
                                     List<String> exposed, HealthCheck healthCheck, Map<String, String> labels) throws InterruptedException {
        List<Container> containers = getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(name)).exec();
        if (containers.size() == 0) {
            pullImage(image);

            CreateContainerCmd createContainerCmd = getDockerClient().createContainerCmd(image)
                    .withName(name).withLabels(labels).withEnv(env).withHostName(name).withHealthcheck(healthCheck);

            if (exposed != null) {
                List<ExposedPort> exposedPorts = exposed.stream().map(i -> ExposedPort.tcp(Integer.parseInt(i))).collect(Collectors.toList());
                createContainerCmd.withExposedPorts(exposedPorts);
                createContainerCmd.withHostConfig(getHostConfig(ports, exposedPorts, inRange, NETWORK_NAME));
            } else {
                createContainerCmd.withHostConfig(getHostConfig(ports, List.of(), inRange, NETWORK_NAME));
            }

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

    private DockerClient getDockerClient() {
        if (dockerClient == null) {
            dockerClient = DockerClientImpl.getInstance(getDockerClientConfig(), getDockerHttpClient());
        }
        return dockerClient;
    }
}
