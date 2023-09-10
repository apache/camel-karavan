package org.apache.camel.karavan.kubernetes;

import io.fabric8.kubernetes.api.model.ContainerBuilder;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirements;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Objects;

import static org.apache.camel.karavan.code.CodeService.DEFAULT_CONTAINER_RESOURCES;
import static org.apache.camel.karavan.service.CamelService.RELOAD_PROJECT_CODE;
import static org.apache.camel.karavan.shared.Constants.LABEL_PROJECT_ID;
import static org.apache.camel.karavan.service.ContainerStatusService.CONTAINER_STATUS;
import static org.apache.camel.karavan.shared.Constants.LABEL_TYPE;

public class PodEventHandler implements ResourceEventHandler<Pod> {

    private static final Logger LOGGER = Logger.getLogger(PodEventHandler.class.getName());
    private final InfinispanService infinispanService;
    private final KubernetesService kubernetesService;
    private final EventBus eventBus;

    public PodEventHandler(InfinispanService infinispanService, KubernetesService kubernetesService, EventBus eventBus) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
        this.eventBus = eventBus;
    }

    @Override
    public void onAdd(Pod pod) {
        try {
            LOGGER.info("onAdd " + pod.getMetadata().getName());
            ContainerStatus ps = getPodStatus(pod);
            if (ps != null) {
                eventBus.send(CONTAINER_STATUS, JsonObject.mapFrom(ps));
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onUpdate(Pod oldPod, Pod newPod) {
        try {
            LOGGER.info("onUpdate " + newPod.getMetadata().getName());
            if (!newPod.isMarkedForDeletion() && newPod.getMetadata().getDeletionTimestamp() == null) {
                ContainerStatus ps = getPodStatus(newPod);
                if (ps != null) {
                    eventBus.send(CONTAINER_STATUS, JsonObject.mapFrom(ps));
                }
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onDelete(Pod pod, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + pod.getMetadata().getName());
            String deployment = pod.getMetadata().getLabels().get("app");
            String projectId = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_PROJECT_ID);
            infinispanService.deleteContainerStatus(projectId, kubernetesService.environment, pod.getMetadata().getName());
            infinispanService.deleteCamelStatuses(projectId, kubernetesService.environment);
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }


    public ContainerStatus getPodStatus(Pod pod) {
        String deployment = pod.getMetadata().getLabels().get("app");
        String projectId = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_PROJECT_ID);
        String type = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_TYPE);
        ContainerStatus.ContainerType containerType = type != null ? ContainerStatus.ContainerType.valueOf(type) : ContainerStatus.ContainerType.unknown;
        try {
            boolean ready = pod.getStatus().getConditions().stream().anyMatch(c -> c.getType().equals("Ready"));
            String creationTimestamp = pod.getMetadata().getCreationTimestamp();

            ResourceRequirements defaultRR = kubernetesService.getResourceRequirements(DEFAULT_CONTAINER_RESOURCES);
            ResourceRequirements resourceRequirements = pod.getSpec().getContainers().stream().findFirst()
                    .orElse(new ContainerBuilder().withResources(defaultRR).build()).getResources();

            String requestMemory = resourceRequirements.getRequests().getOrDefault("memory", new Quantity()).toString();
            String requestCpu = resourceRequirements.getRequests().getOrDefault("cpu", new Quantity()).toString();
            String limitMemory = resourceRequirements.getLimits().getOrDefault("memory", new Quantity()).toString();
            String limitCpu = resourceRequirements.getLimits().getOrDefault("cpu", new Quantity()).toString();
            ContainerStatus status = new ContainerStatus(
                    pod.getMetadata().getName(),
                    List.of(ContainerStatus.Command.delete),
                    projectId,
                    kubernetesService.environment,
                    containerType,
                    requestMemory + " / " + limitMemory,
                    requestCpu + " / " + limitCpu,
                    creationTimestamp);
            status.setContainerId(pod.getMetadata().getName());
            if (ready) {
                status.setState(ContainerStatus.State.running.name());
            } else {
                status.setState(ContainerStatus.State.created.name());
            }
            return status;
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage(), ex.getCause());
            return null;
        }
    }
}