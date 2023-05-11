package org.apache.camel.karavan.handler;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import java.util.Optional;

import static org.apache.camel.karavan.service.KubernetesService.RUNNER_SUFFIX;
import static org.apache.camel.karavan.service.ServiceUtil.DEFAULT_CONTAINER_RESOURCES;

public class PodEventHandler implements ResourceEventHandler<Pod> {

    private static final Logger LOGGER = Logger.getLogger(PodEventHandler.class.getName());
    private final InfinispanService infinispanService;
    private final KubernetesService kubernetesService;

    public PodEventHandler(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Pod pod) {
        try {
            LOGGER.info("onAdd " + pod.getMetadata().getName());
            PodStatus ps = getPodStatus(pod);
            infinispanService.savePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onUpdate(Pod oldPod, Pod newPod) {
        try {
            LOGGER.info("onUpdate " + newPod.getMetadata().getName());
            PodStatus ps = getPodStatus(newPod);
            infinispanService.savePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onDelete(Pod pod, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + pod.getMetadata().getName());
            String deployment = pod.getMetadata().getLabels().get("app");
            String project = deployment != null ? deployment : pod.getMetadata().getLabels().get("karavan/projectId");
            PodStatus ps = new PodStatus(
                    pod.getMetadata().getName(),
                    project,
                    kubernetesService.environment);
            infinispanService.deletePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }


    public PodStatus getPodStatus(Pod pod) {
        String deployment = pod.getMetadata().getLabels().get("app");
        String project = deployment != null ? deployment : pod.getMetadata().getLabels().get("karavan/projectId");
        try {
            boolean initialized = pod.getStatus().getConditions().stream().anyMatch(c -> c.getType().equals("Initialized"));
            boolean ready = pod.getStatus().getConditions().stream().anyMatch(c -> c.getType().equals("Ready"));
            boolean terminating = pod.getMetadata().getDeletionTimestamp() != null;
            String creationTimestamp = pod.getMetadata().getCreationTimestamp();

            ResourceRequirements defaultRR = kubernetesService.getResourceRequirements(DEFAULT_CONTAINER_RESOURCES);
            ResourceRequirements resourceRequirements = pod.getSpec().getContainers().stream().findFirst()
                    .orElse(new ContainerBuilder().withResources(defaultRR).build()).getResources();

            String requestMemory = resourceRequirements.getRequests().getOrDefault("memory", new Quantity()).toString();
            String requestCpu = resourceRequirements.getRequests().getOrDefault("cpu", new Quantity()).toString();
            String limitMemory = resourceRequirements.getLimits().getOrDefault("memory", new Quantity()).toString();
            String limitCpu = resourceRequirements.getLimits().getOrDefault("cpu", new Quantity()).toString();
            return new PodStatus(
                    pod.getMetadata().getName(),
                    pod.getStatus().getPhase(),
                    initialized,
                    ready,
                    terminating,
                    pod.getStatus().getReason(),
                    deployment,
                    project,
                    kubernetesService.environment,
                    deployment == null || pod.getMetadata().getName().endsWith(RUNNER_SUFFIX),
                    requestMemory,
                    requestCpu,
                    limitMemory,
                    limitCpu,
                    creationTimestamp
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage(), ex.getCause());
            return new PodStatus(
                    pod.getMetadata().getName(),
                    project,
                    kubernetesService.environment);
        }
    }
}