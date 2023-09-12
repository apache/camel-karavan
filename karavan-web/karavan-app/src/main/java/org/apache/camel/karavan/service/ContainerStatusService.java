package org.apache.camel.karavan.service;

import io.quarkus.scheduler.Scheduled;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import static org.apache.camel.karavan.service.CamelService.RELOAD_PROJECT_CODE;

@ApplicationScoped
public class ContainerStatusService {

    public static final String CONTAINER_STATUS = "CONTAINER_STATUS";
    private static final Logger LOGGER = Logger.getLogger(ContainerStatusService.class.getName());
    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    InfinispanService infinispanService;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container.statistics.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatistics() {
        if (infinispanService.isReady() && !ConfigService.inKubernetes()) {
            List<ContainerStatus> statusesInDocker = dockerService.collectContainersStatistics();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.send(ContainerStatusService.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
            });
        }
    }

    @Scheduled(every = "{karavan.container.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatuses() {
        if (infinispanService.isReady() && !ConfigService.inKubernetes()) {
            if (!ConfigService.inKubernetes()) {
                List<ContainerStatus> statusesInDocker = dockerService.collectContainersStatuses();
                statusesInDocker.forEach(containerStatus -> {
                    eventBus.send(ContainerStatusService.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
                });
                cleanContainersStatuses(statusesInDocker);
            }
        }
    }

    void cleanContainersStatuses(List<ContainerStatus> statusesInDocker) {
        if (infinispanService.isReady() && !ConfigService.inKubernetes()) {
            List<String> namesInDocker = statusesInDocker.stream().map(ContainerStatus::getContainerName).toList();
            List<ContainerStatus> statusesInInfinispan = infinispanService.getContainerStatuses(environment);
            // clean deleted
            statusesInInfinispan.stream()
                    .filter(cs -> !checkTransit(cs))
                    .filter(cs -> !namesInDocker.contains(cs.getContainerName()))
                    .forEach(containerStatus -> {
                        infinispanService.deleteContainerStatus(containerStatus);
                        infinispanService.deleteCamelStatuses(containerStatus.getProjectId(), containerStatus.getEnv());
                    });
        }
    }

    private boolean checkTransit(ContainerStatus cs) {
        if (cs.getContainerId() == null && cs.getInTransit()) {
            return Instant.parse(cs.getInitDate()).until(Instant.now(), ChronoUnit.SECONDS) < 10;
        }
        return false;
    }

    @ConsumeEvent(value = CONTAINER_STATUS, blocking = true, ordered = true)
    public void saveContainerStatus(JsonObject data) {
        if (infinispanService.isReady()) {
            ContainerStatus newStatus = data.mapTo(ContainerStatus.class);
            ContainerStatus oldStatus = infinispanService.getContainerStatus(newStatus.getProjectId(), newStatus.getEnv(), newStatus.getContainerName());
            if (oldStatus == null) {
                infinispanService.saveContainerStatus(newStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
                saveContainerStatus(newStatus, oldStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)) {
                if (!Objects.equals(oldStatus.getState(), newStatus.getState()) || newStatus.getCpuInfo().isEmpty()) {
                    saveContainerStatus(newStatus, oldStatus);
                }
            }
        }
    }

    private void saveContainerStatus(ContainerStatus newStatus, ContainerStatus oldStatus) {
        if (Objects.equals("exited", newStatus.getState()) || Objects.equals("dead", newStatus.getState())) {
            if (Objects.isNull(oldStatus.getFinished())) {
                newStatus.setFinished(Instant.now().toString());
            } else if (Objects.nonNull(oldStatus.getFinished())) {
                return;
            }
        }
        if (newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isEmpty()) {
            newStatus.setCpuInfo(oldStatus.getCpuInfo());
            newStatus.setMemoryInfo(oldStatus.getMemoryInfo());
        }
        infinispanService.saveContainerStatus(newStatus);
    }
}