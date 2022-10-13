package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.EnvVarBuilder;
import io.fabric8.kubernetes.api.model.EnvVarSourceBuilder;
import io.fabric8.tekton.pipeline.v1beta1.Param;
import io.fabric8.tekton.pipeline.v1beta1.ParamBuilder;
import io.fabric8.tekton.pipeline.v1beta1.ParamSpecBuilder;
import io.fabric8.tekton.pipeline.v1beta1.Pipeline;
import io.fabric8.tekton.pipeline.v1beta1.PipelineBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineTask;
import io.fabric8.tekton.pipeline.v1beta1.PipelineTaskBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineWorkspaceDeclaration;
import io.fabric8.tekton.pipeline.v1beta1.StepBuilder;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import io.fabric8.tekton.pipeline.v1beta1.TaskBuilder;
import io.fabric8.tekton.pipeline.v1beta1.TaskRef;
import io.fabric8.tekton.pipeline.v1beta1.TaskRefBuilder;
import io.fabric8.tekton.pipeline.v1beta1.WorkspaceDeclaration;
import io.fabric8.tekton.pipeline.v1beta1.WorkspacePipelineTaskBinding;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.stream.Collectors;


public class KaravanTektonPipeline extends CRUDKubernetesDependentResource<Pipeline, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.quarkus-build-image")
    String image;

    public KaravanTektonPipeline() {
        super(Pipeline.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Pipeline desired(Karavan karavan, Context<Karavan> context) {
        return new PipelineBuilder()
                .withNewMetadata()
                .withName(Constants.PIPELINE_BUILD_QUARKUS)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.PIPELINE_BUILD_QUARKUS, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withParams(new ParamSpecBuilder().withName("PROJECT_ID").withType("string").withDescription("ProjectId").build())
                .withTasks(
                        new PipelineTaskBuilder().withName(Constants.TASK_BUILD_QUARKUS)
                                .withParams(new ParamBuilder().withName("project").withNewValue("$(params.PROJECT_ID)").build())
                                .withTaskRef(new TaskRefBuilder().withKind("Task").withName(Constants.TASK_BUILD_QUARKUS).build())
                                .withWorkspaces(
                                        new WorkspacePipelineTaskBinding("m2-cache", "", "m2-cache"),
                                        new WorkspacePipelineTaskBinding("jbang-cache", "", "jbang-cache")
                                )
                                .build()
                )
                .withWorkspaces(
                        new PipelineWorkspaceDeclaration("Maven Cache", "m2-cache", false),
                        new PipelineWorkspaceDeclaration("JBang Cache", "jbang-cache", false)
                )
                .endSpec()
                .build();
    }
}
