package org.apache.camel.karavan.service;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.Objects;

import static org.apache.camel.karavan.shared.EventType.CONTAINER_STATUS;
import static org.apache.camel.karavan.shared.EventType.DEVMODE_CONTAINER_READY;

@ApplicationScoped
public class EventService {

    private static final Logger LOGGER = Logger.getLogger(EventService.class.getName());

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    InfinispanService infinispanService;

    @Inject
    CamelService camelService;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = DEVMODE_CONTAINER_READY, blocking = true, ordered = true)
    void receiveCommand(JsonObject json) {
//        String projectId = json.getString(LABEL_PROJECT_ID);
//        Integer reloadCount = json.getInteger(RELOAD_TRY_COUNT);
//        LOGGER.info("DEVMODE_CONTAINER_READY " + projectId + " : " + reloadCount);
//        ContainerStatus status = infinispanService.getContainerStatus(projectId, environment, projectId);
//        CamelStatus cs = infinispanService.getCamelStatus(projectId, environment, CamelStatus.Name.context.name());
//        if (status != null
//                && !Objects.equals(status.getCodeLoaded(), Boolean.TRUE)
//                && status.getContainerId() != null
//                && status.getState().equals(ContainerStatus.State.running.name())
//                && camelIsStarted(cs)) {
//            LOGGER.info("CAMEL STARTED -> SEND RELOAD");
//            if (ConfigService.inKubernetes()) {
//                camelService.reloadProjectCode(projectId);
//            } else {
//                infinispanService.sendCodeReloadCommand(projectId);
//            }
//        } else if (reloadCount < 30) {
//            LOGGER.info("CAMEL NOT STARTED -> SEND DEVMODE_CONTAINER_READY");
//            // retry again
//            Map<String, Object> message = Map.of(
//                    LABEL_PROJECT_ID, projectId,
//                    RELOAD_TRY_COUNT, ++reloadCount
//            );
//            eventBus.publish(DEVMODE_DELAY_MESSAGE, JsonObject.mapFrom(message));
//        }
    }

    private boolean camelIsStarted(CamelStatus camelStatus) {
        try {
            String status = camelStatus.getStatus();
            JsonObject obj = new JsonObject(status);
            return Objects.equals("Started", obj.getJsonObject("context").getString("state"));
        } catch (Exception e) {
            return false;
        }
    }



    @ConsumeEvent(value = CONTAINER_STATUS, blocking = true, ordered = true)
    public void saveContainerStatus(JsonObject data) {
        if (infinispanService.isReady()) {
            ContainerStatus newStatus = data.mapTo(ContainerStatus.class);
            ContainerStatus oldStatus = infinispanService.getContainerStatus(newStatus.getProjectId(), newStatus.getEnv(), newStatus.getContainerName());
            if (oldStatus == null) {
                infinispanService.saveContainerStatus(newStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
                if ("exited".equalsIgnoreCase(newStatus.getState()) && oldStatus.getFinished() == null) {
                    newStatus.setFinished(Instant.now().toString());
                }
                if (newStatus.getCpuInfo() == null) {
                    newStatus.setCpuInfo(oldStatus.getCpuInfo());
                    newStatus.setMemoryInfo(oldStatus.getMemoryInfo());
                }
                infinispanService.saveContainerStatus(newStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)) {
                if (!Objects.equals(oldStatus.getState(), newStatus.getState())) {
                    if (newStatus.getCpuInfo() == null) {
                        newStatus.setCpuInfo(oldStatus.getCpuInfo());
                        newStatus.setMemoryInfo(oldStatus.getMemoryInfo());
                    }
                    infinispanService.saveContainerStatus(newStatus);
                }
            }
        }
    }
}