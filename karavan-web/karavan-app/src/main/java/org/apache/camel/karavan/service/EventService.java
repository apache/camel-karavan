package org.apache.camel.karavan.service;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.shared.ConfigService;
import org.apache.camel.karavan.shared.EventType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;
import java.util.Objects;

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
    CamelService camelService;

    @Inject
    ProjectService projectService;

    @Inject
    EventBus bus;

    @ConsumeEvent(value = INFINISPAN_STARTED, blocking = true, ordered = true)
    void startServices(String infinispanHealth) {
        if (infinispanHealth.equals(InfinispanService.HEALTHY_STATUS)) {
            infinispanService.start(false);
            infinispanService.clearAllStatuses();
            if (!ConfigService.inKubernetes()) {
                dockerService.startKaravanHeadlessContainer();
                dockerService.collectContainersStatuses();
            }
            bus.publish(EventType.IMPORT_PROJECTS, "");
            bus.publish(EventType.START_INFRASTRUCTURE_LISTENERS, "");
        }
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
    void receiveCommand(String projectId) {
        LOGGER.info("DEVMODE_CONTAINER_READY " + projectId);
        ContainerStatus status = infinispanService.getContainerStatus(projectId, environment, projectId);
        System.out.println(status);
        if (status != null && !status.getCodeLoaded() && status.getContainerId() != null && status.getState().equals(ContainerStatus.State.running.name())) {
            if (ConfigService.inKubernetes()) {
                camelService.reloadProjectCode(projectId);
            } else {
                infinispanService.sendCodeReloadCommand(projectId);
            }
        }
    }

    @ConsumeEvent(value = CONTAINER_STATUS, blocking = true, ordered = true)
    public void saveContainerStatus(JsonObject data) {
        if (infinispanService.isReady()) {
            ContainerStatus newStatus = data.mapTo(ContainerStatus.class);
            ContainerStatus oldStatus = infinispanService.getContainerStatus(newStatus.getProjectId(), newStatus.getEnv(), newStatus.getContainerName());
            if (oldStatus == null || Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
                infinispanService.saveContainerStatus(newStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)){
                if (!Objects.equals(oldStatus.getState(), newStatus.getState())) {
                    infinispanService.saveContainerStatus(newStatus);
                }
            }
        }
    }
}