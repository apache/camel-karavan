package org.apache.camel.karavan.listener;

import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;

import static org.apache.camel.karavan.service.RunnerService.RUNNER_SUFFIX;

public class RunnerListener {

    protected final InfinispanService infinispanService;

    protected final KubernetesService kubernetesService;

    public RunnerListener(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    protected void startRunner(String projectId) {
        String runnerName = projectId + "-" + RUNNER_SUFFIX;
        if (kubernetesService.inKubernetes()) {
            Project p = infinispanService.getProject(projectId);
            kubernetesService.tryCreateRunner(p, runnerName, "");
        }
    }

    protected void stopRunner(String projectId) {
        String runnerName = projectId + "-" + RUNNER_SUFFIX;
        if (kubernetesService.inKubernetes()) {
            kubernetesService.deleteRunner(runnerName, false);
            infinispanService.deleteRunnerStatuses(runnerName);
        }
    }
}