package org.apache.camel.karavan.handler;

import io.fabric8.kubernetes.api.model.ContainerBuilder;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirements;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.PodStatus;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.service.CodeService.DEFAULT_CONTAINER_RESOURCES;
import static org.apache.camel.karavan.service.CamelStatusService.DEVMODE_SUFFIX;

public class PodEventHandler implements ResourceEventHandler<Pod> {

    private static final Logger LOGGER = Logger.getLogger(PodEventHandler.class.getName());
    private final DatagridService datagridService;
    private final KubernetesService kubernetesService;

    public PodEventHandler(DatagridService datagridService, KubernetesService kubernetesService) {
        this.datagridService = datagridService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Pod pod) {
        try {
            LOGGER.info("onAdd " + pod.getMetadata().getName());
            PodStatus ps = getPodStatus(pod);
            datagridService.savePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onUpdate(Pod oldPod, Pod newPod) {
        try {
            LOGGER.info("onUpdate " + newPod.getMetadata().getName());
            PodStatus ps = getPodStatus(newPod);
            datagridService.savePodStatus(ps);
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
            datagridService.deletePodStatus(projectId, kubernetesService.environment, pod.getMetadata().getName());
        } catch (Exception e){
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }


    public PodStatus getPodStatus(Pod pod) {
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
            return new PodStatus(
                    pod.getMetadata().getName(),
                    ready,
                    deployment,
                    project,
                    kubernetesService.environment,
                    deployment == null || pod.getMetadata().getName().endsWith(DEVMODE_SUFFIX),
                    requestMemory + " : " + limitMemory,
                    requestCpu + " : " + limitCpu,
                    creationTimestamp

            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage(), ex.getCause());
            return new PodStatus(
                    pod.getMetadata().getName(),
                    false,
                    null,
                    project,
                    kubernetesService.environment,
                    false,
                    "");
        }
    }
}