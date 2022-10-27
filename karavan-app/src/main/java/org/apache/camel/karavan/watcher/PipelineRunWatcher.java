package org.apache.camel.karavan.watcher;

import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRun;
import org.apache.camel.karavan.model.PipelineStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.List;

public class PipelineRunWatcher implements Watcher<PipelineRun> {

    private static final Logger LOGGER = Logger.getLogger(PipelineRunWatcher.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public PipelineRunWatcher(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void eventReceived(Action action, PipelineRun pipelineRun) {
        LOGGER.info(action.name() + " " + pipelineRun.getMetadata().getName());
        String projectId = pipelineRun.getMetadata().getLabels().get("karavan-project-id");
        if (projectId != null) {
            Project project = infinispanService.getProject(projectId);
            if (project != null && List.of("MODIFIED", "ADDED").contains(action.name())) {
                PipelineStatus pipelineStatus = infinispanService.getPipelineStatus(projectId);
                if (pipelineStatus == null) pipelineStatus = new PipelineStatus(project.getProjectId(), kubernetesService.environment);

                if (pipelineRun.getStatus() != null) {
                    LOGGER.info(action.name()+ " " + pipelineRun.getMetadata().getName() + " " + pipelineRun.getStatus().getConditions().get(0).getReason());
                    Instant runStartTime = Instant.parse(pipelineRun.getStatus().getStartTime());
                    Instant savedStartTime = pipelineStatus.getStartTime() != null
                            ? Instant.parse(pipelineStatus.getStartTime())
                            : Instant.MIN;

                    if (runStartTime.isAfter(savedStartTime) || pipelineRun.getMetadata().getName().equals(pipelineStatus.getPipelineName())) {
                        pipelineStatus.setPipelineName(pipelineRun.getMetadata().getName());
                        pipelineStatus.setResult(pipelineRun.getStatus().getConditions().get(0).getReason());
                        pipelineStatus.setStartTime(pipelineRun.getStatus().getStartTime());
                        pipelineStatus.setCompletionTime(pipelineRun.getStatus().getCompletionTime());
                    }
                } else {
                    pipelineStatus.setPipelineName(pipelineRun.getMetadata().getName());
                    pipelineStatus.setResult(null);
                    pipelineStatus.setStartTime(null);
                    pipelineStatus.setCompletionTime(null);
                }
                infinispanService.savePipelineStatus(pipelineStatus);
            }
        }
    }

    private Long getPipelineRunDuration(PipelineRun pipelineRun) {
        try {
            Instant create = Instant.parse(pipelineRun.getMetadata().getCreationTimestamp());
            Instant completion = pipelineRun.getStatus().getCompletionTime() != null
                    ? Instant.parse(pipelineRun.getStatus().getCompletionTime())
                    : Instant.now();
            return completion.getEpochSecond() - create.getEpochSecond();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return 0L;
        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}