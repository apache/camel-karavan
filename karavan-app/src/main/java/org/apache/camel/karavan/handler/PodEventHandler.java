package org.apache.camel.karavan.handler;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodCondition;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import java.util.Optional;

import static org.apache.camel.karavan.service.KubernetesService.RUNNER_SUFFIX;

public class PodEventHandler implements ResourceEventHandler<Pod> {

    private static final Logger LOGGER = Logger.getLogger(PodEventHandler.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

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
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Pod oldPod, Pod newPod) {
        try {
            LOGGER.info("onUpdate " + newPod.getMetadata().getName());
            PodStatus ps = getPodStatus(newPod);
            infinispanService.savePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onDelete(Pod pod, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + pod.getMetadata().getName());
            String deployment = pod.getMetadata().getLabels().get("app");
            String project = deployment != null ? deployment : pod.getMetadata().getLabels().get("project");
            PodStatus ps = new PodStatus(
                    pod.getMetadata().getName(),
                    project,
                    kubernetesService.environment);
            infinispanService.deletePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }


    public PodStatus getPodStatus(Pod pod) {
        String deployment = pod.getMetadata().getLabels().get("app");
        String project = deployment != null ? deployment : pod.getMetadata().getLabels().get("project");
        try {
            boolean initialized = pod.getStatus().getConditions().stream().anyMatch(c -> c.getType().equals("Initialized"));
            boolean ready = pod.getStatus().getConditions().stream().anyMatch(c -> c.getType().equals("Ready"));
            boolean terminating = pod.getMetadata().getDeletionTimestamp() != null;
            return new PodStatus(
                    pod.getMetadata().getName(),
                    pod.getStatus().getPhase(),
                    initialized,
                    ready && !terminating,
                    pod.getStatus().getReason(),
                    project,
                    deployment,
                    kubernetesService.environment,
                    deployment == null || pod.getMetadata().getName().endsWith(RUNNER_SUFFIX)

            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new PodStatus(
                    pod.getMetadata().getName(),
                    project,
                    kubernetesService.environment);
        }
    }
}