package org.apache.camel.karavan.informer;

import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRun;
import org.apache.camel.karavan.model.PipelineStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import java.time.Instant;

public class PipelineRunEventHandler implements ResourceEventHandler<PipelineRun> {

    private static final Logger LOGGER = Logger.getLogger(PipelineRunEventHandler.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public PipelineRunEventHandler(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(PipelineRun pipelineRun) {
        try {
            LOGGER.info("onAdd " + pipelineRun.getMetadata().getName());
            PipelineStatus ps = getPipelineStatus(pipelineRun);
            if (ps != null) infinispanService.savePipelineStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(PipelineRun oldPipelineRun, PipelineRun newPipelineRun) {
        try {
            LOGGER.info("onUpdate " + newPipelineRun.getMetadata().getName());
            PipelineStatus ps = getPipelineStatus(newPipelineRun);
            if (ps != null) infinispanService.savePipelineStatus(ps);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onDelete(PipelineRun pipelineRun, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + pipelineRun.getMetadata().getName());
            String projectId = pipelineRun.getMetadata().getLabels().get("karavan-project-id");
            if (projectId != null) {
                Project project = infinispanService.getProject(projectId);
                if (project != null) {
                    PipelineStatus ps = new PipelineStatus(project.getProjectId(), kubernetesService.environment);
                    infinispanService.deletePipelineStatus(ps);
                }
            }
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    public PipelineStatus getPipelineStatus( PipelineRun pipelineRun) {
        String projectId = pipelineRun.getMetadata().getLabels().get("karavan-project-id");
        if (projectId != null) {
            Project project = infinispanService.getProject(projectId);
            if (project != null) {
                PipelineStatus pipelineStatus = new PipelineStatus(project.getProjectId(), kubernetesService.environment);

                if (pipelineRun.getStatus() != null) {
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
                return pipelineStatus;
            }
        }
        return null;
    }
}