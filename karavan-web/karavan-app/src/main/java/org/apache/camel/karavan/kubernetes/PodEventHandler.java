package org.apache.camel.karavan.kubernetes;

import io.fabric8.kubernetes.api.model.ContainerBuilder;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirements;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.service.CodeService.DEFAULT_CONTAINER_RESOURCES;
import static org.apache.camel.karavan.shared.ConfigService.DEVMODE_SUFFIX;

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
            ContainerStatus ps = getPodStatus(pod);
            infinispanService.saveContainerStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onUpdate(Pod oldPod, Pod newPod) {
        try {
            LOGGER.info("onUpdate " + newPod.getMetadata().getName());
            ContainerStatus ps = getPodStatus(newPod);
            infinispanService.saveContainerStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onDelete(Pod pod, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + pod.getMetadata().getName());
            String deployment = pod.getMetadata().getLabels().get("app");
            String projectId = deployment != null ? deployment : pod.getMetadata().getLabels().get("karavan/projectId");
            infinispanService.deleteContainerStatus(projectId, kubernetesService.environment, pod.getMetadata().getName());
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }


    public ContainerStatus getPodStatus(Pod pod) {
        String deployment = pod.getMetadata().getLabels().get("app");
        String project = deployment != null ? deployment : pod.getMetadata().getLabels().get("karavan/projectId");
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
            return new ContainerStatus(
                    pod.getMetadata().getName(),
                    ready,
                    project,
                    kubernetesService.environment,
                    pod.getMetadata().getName().endsWith(DEVMODE_SUFFIX) ? ContainerStatus.CType.devmode : ContainerStatus.CType.pod,
                    requestMemory + " : " + limitMemory,
                    requestCpu + " : " + limitCpu,
                    creationTimestamp

            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage(), ex.getCause());
            return new ContainerStatus(
                    pod.getMetadata().getName(),
                    false,
                    project,
                    kubernetesService.environment,
                    ContainerStatus.CType.pod,
                    "");
        }
    }
}