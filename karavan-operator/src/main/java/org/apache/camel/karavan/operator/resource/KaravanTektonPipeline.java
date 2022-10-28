/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.operator.resource;

import io.fabric8.tekton.client.DefaultTektonClient;
import io.fabric8.tekton.pipeline.v1beta1.ParamBuilder;
import io.fabric8.tekton.pipeline.v1beta1.ParamSpecBuilder;
import io.fabric8.tekton.pipeline.v1beta1.Pipeline;
import io.fabric8.tekton.pipeline.v1beta1.PipelineBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineTaskBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineWorkspaceDeclaration;
import io.fabric8.tekton.pipeline.v1beta1.TaskRefBuilder;
import io.fabric8.tekton.pipeline.v1beta1.WorkspacePipelineTaskBinding;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import io.javaoperatorsdk.operator.processing.dependent.workflow.Condition;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanTektonPipeline extends CRUDKubernetesDependentResource<Pipeline, Karavan>  implements Condition<Pipeline, Karavan> {

    public KaravanTektonPipeline() {
        super(Pipeline.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Pipeline desired(Karavan karavan, Context<Karavan> context) {
        return new PipelineBuilder()
                .withNewMetadata()
                .withName(Constants.PIPELINE_DEV_QUARKUS)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(Constants.PIPELINE_DEV_QUARKUS, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withParams(new ParamSpecBuilder().withName("PROJECT_ID").withType("string").withDescription("ProjectId").build())
                .withTasks(
                        new PipelineTaskBuilder().withName(Constants.TASK_DEV_QUARKUS)
                                .withParams(new ParamBuilder().withName("project").withNewValue("$(params.PROJECT_ID)").build())
                                .withTaskRef(new TaskRefBuilder().withKind("Task").withName(Constants.TASK_DEV_QUARKUS).build())
                                .withWorkspaces(
                                        new WorkspacePipelineTaskBinding(Constants.PVC_M2_CACHE, "", Constants.PVC_M2_CACHE),
                                        new WorkspacePipelineTaskBinding(Constants.PVC_JBANG_CACHE, "", Constants.PVC_JBANG_CACHE)
                                )
                                .build()
                )
                .withWorkspaces(
                        new PipelineWorkspaceDeclaration("Maven Cache", Constants.PVC_M2_CACHE, false),
                        new PipelineWorkspaceDeclaration("JBang Cache", Constants.PVC_JBANG_CACHE, false)
                )
                .endSpec()
                .build();
    }

    @Override
    public ReconcileResult<Pipeline> reconcile(Karavan karavan, Context<Karavan> context) {
        Pipeline pipeline = new DefaultTektonClient(getKubernetesClient()).v1beta1().pipelines().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.PIPELINE_DEV_QUARKUS).get();
        if (pipeline == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(pipeline);
        }
    }

    @Override
    public boolean isMet(Karavan karavan, Pipeline pipeline, Context<Karavan> context) {
        return false;
    }
}
