package org.apache.camel.karavan.service;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.docker.DockerForGitea;
import org.apache.camel.karavan.docker.DockerForInfinispan;
import org.apache.camel.karavan.docker.DockerForKaravan;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.shared.ConfigService;
import org.apache.camel.karavan.shared.Constants;
import org.apache.camel.karavan.shared.EventType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import java.util.Objects;

import static org.apache.camel.karavan.shared.Constants.LABEL_PROJECT_ID;
import static org.apache.camel.karavan.shared.Constants.RELOAD_TRY_COUNT;
import static org.apache.camel.karavan.shared.EventType.*;

@ApplicationScoped
public class EventService {

    private static final Logger LOGGER = Logger.getLogger(EventService.class.getName());

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    DockerForInfinispan dockerForInfinispan;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    DockerForGitea dockerForGitea;

    @Inject
    CamelService camelService;

    @Inject
    ProjectService projectService;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = START_INFINISPAN_IN_DOCKER, blocking = true, ordered = true)
    void startInfinispan1(String data) {
        dockerForInfinispan.startInfinispan();
        dockerForInfinispan.checkInfinispanHealth();
    }

    @ConsumeEvent(value = INFINISPAN_STARTED, blocking = true, ordered = true)
    void startServices1(String infinispanHealth) {
        if (infinispanHealth.equals(Constants.HEALTHY_STATUS)) {
            infinispanService.start(false);
            infinispanService.clearAllStatuses();
            if (!ConfigService.inKubernetes()) {
                dockerForKaravan.startKaravanHeadlessContainer();
                dockerService.collectContainersStatuses();
            }
            eventBus.publish(EventType.IMPORT_PROJECTS, "");
            eventBus.publish(EventType.START_INFRASTRUCTURE_LISTENERS, "");
        }
    }

    @ConsumeEvent(value = GITEA_STARTED, blocking = true, ordered = true)
    void startInfinispanAfterGitea(String giteaHealth) {
        eventBus.publish(EventType.START_INFINISPAN_IN_DOCKER, null);
    }

    @ConsumeEvent(value = GITEA_CONTAINER_STARTED, blocking = true, ordered = true)
    void installGiteaInGiteaContainer(String giteaHealth) {
        dockerForGitea.installGitea();
    }

    void startServices(String infinispanHealth) {
        eventBus.publish(EventType.IMPORT_PROJECTS, "");
        eventBus.publish(EventType.START_INFRASTRUCTURE_LISTENERS, "");
    }

    @ConsumeEvent(value = START_INFRASTRUCTURE_LISTENERS, blocking = true, ordered = true)
    void startInfrastructureListeners(String data) {
        LOGGER.info("Start Infrastructure Listeners");
        if (ConfigService.inKubernetes()) {
            kubernetesService.startInformers(data);
        } else {
//            Docker listener is already started
        }
    }

    @ConsumeEvent(value = IMPORT_PROJECTS, blocking = true)
    public void importProjects(String data) {
        projectService.importProjects(data);
    }

    @ConsumeEvent(value = DEVMODE_CONTAINER_READY, blocking = true, ordered = true)
    void receiveCommand(JsonObject json) {
        String projectId = json.getString(LABEL_PROJECT_ID);
        Integer reloadCount = json.getInteger(RELOAD_TRY_COUNT);
        LOGGER.info("DEVMODE_CONTAINER_READY " + projectId + " : " + reloadCount);
        ContainerStatus status = infinispanService.getContainerStatus(projectId, environment, projectId);
        CamelStatus cs = infinispanService.getCamelStatus(projectId, environment, CamelStatus.Name.context.name());
        if (status != null
                && !Objects.equals(status.getCodeLoaded(), Boolean.TRUE)
                && status.getContainerId() != null
                && status.getState().equals(ContainerStatus.State.running.name())
                && camelIsStarted(cs)) {
            LOGGER.info("CAMEL STARTED -> SEND RELOAD");
            if (ConfigService.inKubernetes()) {
                camelService.reloadProjectCode(projectId);
            } else {
                infinispanService.sendCodeReloadCommand(projectId);
            }
        } else if (reloadCount < 30) {
            LOGGER.info("CAMEL NOT STARTED -> SEND DEVMODE_CONTAINER_READY");
            // retry again
            Map<String, Object> message = Map.of(
                    LABEL_PROJECT_ID, projectId,
                    RELOAD_TRY_COUNT, ++reloadCount
            );
            eventBus.publish(DELAY_MESSAGE, JsonObject.mapFrom(message));
        }
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
            if (oldStatus == null || Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
                infinispanService.saveContainerStatus(newStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)) {
                if (!Objects.equals(oldStatus.getState(), newStatus.getState())) {
                    infinispanService.saveContainerStatus(newStatus);
                }
            }
        }
    }
}