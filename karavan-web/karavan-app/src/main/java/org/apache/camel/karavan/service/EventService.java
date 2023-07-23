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
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;

import static org.apache.camel.karavan.shared.EventType.*;

@ApplicationScoped
public class EventService {

    private static final Logger LOGGER = Logger.getLogger(EventService.class.getName());

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
    ConfigService configService;

    @Inject
    EventBus bus;

    @ConsumeEvent(value = INFINISPAN_STARTED, blocking = true, ordered = true)
    void startServices(String infinispanHealth) {
        if (infinispanHealth.equals(InfinispanService.HEALTHY_STATUS)) {
            infinispanService.start(false);
            infinispanService.clearAllStatuses();
            if (!ConfigService.inKubernetes()) {
                dockerService.deleteKaravanHeadlessContainer();
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
    void receiveCommand(JsonObject message) {
        LOGGER.info("received Status " + message);
        ContainerStatus status = message.mapTo(ContainerStatus.class);
        if (!status.getCodeLoaded() && status.getContainerId() != null && status.getLifeCycle().equals(ContainerStatus.Lifecycle.ready)) {
            if (ConfigService.inKubernetes()) {
                camelService.reloadProjectCode(status.getProjectId());
            } else {
                infinispanService.sendCodeReloadCommand(status.getProjectId());
            }
        }
    }

    @ConsumeEvent(value = CONTAINER_STATISTICS, blocking = true, ordered = true)
    public void saveStats(JsonObject data) {
        String projectId = data.getString("projectId");
        String memory = data.getString("memory");
        String cpu = data.getString("cpu");
        if (infinispanService.isReady()) {
            ContainerStatus containerStatus = infinispanService.getDevModeContainerStatus(projectId, configService.getConfiguration().getEnvironment());
            if (containerStatus != null) {
                containerStatus.setCpuInfo(cpu);
                containerStatus.setMemoryInfo(memory);
                infinispanService.saveContainerStatus(containerStatus);
            }
        }
    }
}