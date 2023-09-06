package org.apache.camel.karavan.service;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.Objects;

import static org.apache.camel.karavan.shared.EventType.CONTAINER_STATUS;

@ApplicationScoped
public class EventService {

    private static final Logger LOGGER = Logger.getLogger(EventService.class.getName());

    @Inject
    InfinispanService infinispanService;


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
        if (newStatus.getProjectId().equals("demo")) {
            System.out.println(("oldStatus.getFinished = " + Objects.isNull(oldStatus.getFinished())));
        }
        if ("exited".equalsIgnoreCase(newStatus.getState()) && Objects.isNull(oldStatus.getFinished())) {
            newStatus.setFinished(Instant.now().toString());
        } else if ("exited".equalsIgnoreCase(newStatus.getState()) && Objects.nonNull(oldStatus.getFinished())) {
            return;
        }
        if (newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isEmpty()) {
            newStatus.setCpuInfo(oldStatus.getCpuInfo());
            newStatus.setMemoryInfo(oldStatus.getMemoryInfo());
        }
        infinispanService.saveContainerStatus(newStatus);
    }
}