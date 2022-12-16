package org.apache.camel.karavan.informer;

import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.Environment;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

public class DeploymentEventHandler implements ResourceEventHandler<Deployment> {

    private static final Logger LOGGER = Logger.getLogger(DeploymentEventHandler.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public DeploymentEventHandler(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Deployment deployment) {
        try {
            LOGGER.info("onAdd " + deployment.getMetadata().getName());
            DeploymentStatus ds = getDeploymentStatus(deployment);
            infinispanService.saveDeploymentStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Deployment oldDeployment, Deployment newDeployment) {
        try {
            LOGGER.info("onUpdate " + newDeployment.getMetadata().getName());
            DeploymentStatus ds = getDeploymentStatus(newDeployment);
            infinispanService.saveDeploymentStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onDelete(Deployment deployment, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + deployment.getMetadata().getName());
            DeploymentStatus ds = new DeploymentStatus(
                    deployment.getMetadata().getName(),
                    deployment.getMetadata().getNamespace(),
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
            infinispanService.deleteDeploymentStatus(ds);
            infinispanService.deleteCamelStatus(ds.getName(), ds.getEnv());
        } catch (Exception e){
            LOGGER.error(e.getMessage());
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
                    kubernetesService.getCluster(),
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
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
        }
    }
}