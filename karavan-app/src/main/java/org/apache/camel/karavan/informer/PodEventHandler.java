package org.apache.camel.karavan.informer;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodCondition;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import java.util.Optional;

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
            PodStatus ps = new PodStatus(
                    pod.getMetadata().getName(),
                    deployment,
                    kubernetesService.environment);
            infinispanService.deletePodStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }


    public PodStatus getPodStatus(Pod pod) {
        String deployment = pod.getMetadata().getLabels().get("app");
        try {
            Optional<PodCondition> initialized = pod.getStatus().getConditions().stream().filter(c -> c.getType().equals("Initialized")).findFirst();
            Optional<PodCondition> ready = pod.getStatus().getConditions().stream().filter(c -> c.getType().equals("Initialized")).findFirst();
            return new PodStatus(
                    pod.getMetadata().getName(),
                    pod.getStatus().getPhase(),
                    initialized.isEmpty() ? false : initialized.get().getStatus().equals("True"),
                    ready.isEmpty() ? false : ready.get().getStatus().equals("True"),
                    pod.getStatus().getReason(),
                    deployment,
                    kubernetesService.environment
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new PodStatus(
                    pod.getMetadata().getName(),
                    deployment,
                    kubernetesService.environment);
        }
    }
}