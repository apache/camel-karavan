package org.apache.camel.karavan.watcher;

import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.WatcherException;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import java.util.List;

public class DeploymentWatcher implements Watcher<Deployment> {

    private static final Logger LOGGER = Logger.getLogger(DeploymentWatcher.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public DeploymentWatcher(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void eventReceived(Watcher.Action action, Deployment deployment) {
        LOGGER.info(action.name() + " " + deployment.getMetadata().getName());
        DeploymentStatus ds = getDeploymentStatus(deployment);
        switch (action.name()) {
            case "ADDED":
                infinispanService.saveDeploymentStatus(ds);
                break;
            case "MODIFIED":
                infinispanService.saveDeploymentStatus(ds);
                break;
            case "DELETED":
                infinispanService.deleteDeploymentStatus(ds);
                break;
        }
    }

    public DeploymentStatus getDeploymentStatus(Deployment deployment) {
        try {
            String dsImage = deployment.getSpec().getTemplate().getSpec().getContainers().get(0).getImage();
            String imageName = dsImage.startsWith("image-registry.openshift-image-registry.svc")
                    ? dsImage.replace("image-registry.openshift-image-registry.svc:5000/", "")
                    : dsImage;

            return new DeploymentStatus(
                    deployment.getMetadata().getName(),
                    deployment.getMetadata().getNamespace(),
                    kubernetesService.environment,
                    imageName,
                    deployment.getSpec().getReplicas(),
                    deployment.getStatus().getReadyReplicas(),
                    deployment.getStatus().getUnavailableReplicas()
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new DeploymentStatus(
                    deployment.getMetadata().getName(),
                    deployment.getMetadata().getNamespace(),
                    kubernetesService.environment);
        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}