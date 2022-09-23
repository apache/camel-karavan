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
        Project project = infinispanService.getProject(deployment.getMetadata().getName());
        if (project != null) {
            switch (action.name()) {
                case "ADDED":
                    project.setDeployed(true);
                    infinispanService.saveProject(project);
                    DeploymentStatus s = kubernetesService.getDeploymentStatus(project.getProjectId(), deployment);
                    infinispanService.saveDeploymentStatus(s);
                    break;
                case "MODIFIED":
                    if (!project.getDeployed()) {
                        project.setDeployed(true);
                        infinispanService.saveProject(project);
                    }
                    DeploymentStatus ds = kubernetesService.getDeploymentStatus(project.getProjectId(), deployment);
                    infinispanService.saveDeploymentStatus(ds);
                    break;
                case "DELETED":
                    project.setDeployed(false);
                    infinispanService.saveProject(project);
                    infinispanService.saveDeploymentStatus(new DeploymentStatus(project.getProjectId()));
                    break;
            }
        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}