package org.apache.camel.karavan.watcher;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

public class PodWatcher implements Watcher<Pod> {

    private static final Logger LOGGER = Logger.getLogger(PodWatcher.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public PodWatcher(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void eventReceived(Action action, Pod pod) {
        LOGGER.info(action.name() + " " + pod.getMetadata().getName());
        String name = pod.getMetadata().getLabels().get("app.kubernetes.io/name");
//        Project project = infinispanService.getProject(name);
//        Deployment deployment = kubernetesService.getDeployment(name, pod.getMetadata().getNamespace());
//        if (project != null && deployment != null) {
//            DeploymentStatus s = kubernetesService.getDeploymentStatus(project.getProjectId(), deployment);
//            infinispanService.saveDeploymentStatus(s);
//        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}