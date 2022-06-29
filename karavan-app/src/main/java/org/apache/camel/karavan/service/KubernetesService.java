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
package org.apache.camel.karavan.service;

import io.fabric8.kubernetes.api.model.ObjectMeta;
import io.fabric8.kubernetes.api.model.ObjectMetaBuilder;
import io.fabric8.kubernetes.api.model.Secret;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.api.model.DeploymentConfig;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.client.DefaultTektonClient;
import io.fabric8.tekton.pipeline.v1beta1.ParamBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRef;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRefBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRun;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunSpec;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunSpecBuilder;
import org.apache.camel.karavan.model.Project;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Produces;
import java.util.Map;
import java.util.Objects;

@ApplicationScoped
public class KubernetesService {

    @ConfigProperty(name = "kubernetes.namespace", defaultValue = "localhost")
    String namespace;

    @Produces
    public KubernetesClient kubernetesClient() {
        return new DefaultKubernetesClient();
    }

    @Produces
    public DefaultTektonClient tektonClient() {
        return new DefaultTektonClient(kubernetesClient());
    }

    @Produces
    public OpenShiftClient openshiftClient() {
        return kubernetesClient().adapt(OpenShiftClient.class);
    }

    private static final Logger LOGGER = Logger.getLogger(KubernetesService.class.getName());

    public String createPipelineRun(Project project, String namespace) throws Exception {
        LOGGER.info("Pipeline is creating for " + project.getProjectId());

        Map<String, String> labels = Map.of(
                "karavan-project-id", project.getProjectId(),
                "tekton.dev/pipeline", "karavan-quarkus"
        );

        ObjectMeta meta = new ObjectMetaBuilder()
                .withGenerateName("karavan-" + project.getProjectId() + "-")
                .withLabels(labels)
                .withNamespace(namespace)
                .build();

        PipelineRef ref = new PipelineRefBuilder().withName("karavan-quarkus").build();

        PipelineRunSpec spec = new PipelineRunSpecBuilder()
                .withPipelineRef(ref)
                .withServiceAccountName("pipeline")
                .withParams(new ParamBuilder().withName("PROJECT_NAME").withNewValue(project.getProjectId()).build())
                .build();

        PipelineRunBuilder pipelineRunBuilder = new PipelineRunBuilder()
                .withMetadata(meta)
                .withSpec(spec);

        PipelineRun pipelineRun = tektonClient().v1beta1().pipelineRuns().create(pipelineRunBuilder.build());
        LOGGER.info("Pipeline run started " + pipelineRun.getMetadata().getName());
        return pipelineRun.getMetadata().getName();
    }

    public PipelineRun getPipelineRun(String name, String namespace)  {
        return tektonClient().v1beta1().pipelineRuns().inNamespace(namespace).withName(name).get();
    }

    public String getReplicas(String name, String namespace)  {
        if (kubernetesClient().isAdaptable(OpenShiftClient.class)) {
            DeploymentConfig dc = openshiftClient().deploymentConfigs().inNamespace(namespace).withName(name).get();
            dc.getSpec().getReplicas();
            dc.getStatus().getReadyReplicas();
        } else {
//            throw new Exception("Adapting to OpenShiftClient not support. Check if adapter is present, and that env provides /oapi root path.");
        }
        return "";
    }

    public Secret getKaravanSecret() {
        return kubernetesClient().secrets().inNamespace(namespace).withName("karavan").get();
    }

    public boolean inKubernetes(){
        return !Objects.equals(namespace, "localhost");
    }
}
