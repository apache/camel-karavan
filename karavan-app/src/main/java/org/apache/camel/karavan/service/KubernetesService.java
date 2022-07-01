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
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.Secret;
import io.fabric8.kubernetes.client.Config;
import io.fabric8.kubernetes.client.ConfigBuilder;
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
import io.quarkus.kubernetes.client.runtime.KubernetesClientBuildConfig;
import io.smallrye.mutiny.tuples.Tuple2;
import io.smallrye.mutiny.tuples.Tuple3;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.PipelineRunLog;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Produces;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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

    public String createPipelineRun(Project project, String pipelineName, String namespace) throws Exception {
        LOGGER.info("Pipeline is creating for " + project.getProjectId());

        Map<String, String> labels = Map.of(
                "karavan-project-id", project.getProjectId(),
                "tekton.dev/pipeline", pipelineName
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

    public PipelineRun getPipelineRun(String pipelineRuneName, String namespace) {
        return tektonClient().v1beta1().pipelineRuns().inNamespace(namespace).withName(pipelineRuneName).get();
    }

    public String getContainerLog(String podName, String namespace) {
        String logText = kubernetesClient().pods().inNamespace(namespace).withName(podName).getLog(true);
        return logText;
    }

    public List<PipelineRunLog> getPipelineRunLog(String pipelineRuneName, String namespace) {
        List<PipelineRunLog> result = new ArrayList<>(1);
        PipelineRun pipelineRun = getPipelineRun(pipelineRuneName, namespace);
        pipelineRun.getStatus().getTaskRuns().forEach((s, pipelineRunTaskRunStatus) -> {
            String podName = pipelineRunTaskRunStatus.getStatus().getPodName();
            StringBuilder log = new StringBuilder();
            pipelineRunTaskRunStatus.getStatus().getSteps().forEach(stepState -> {
                String logText = kubernetesClient().pods().inNamespace(namespace).withName(podName).inContainer(stepState.getContainer()).getLog(true);
                log.append(stepState.getContainer()).append(System.lineSeparator());
                log.append(logText).append(System.lineSeparator());
            });
            result.add(new PipelineRunLog(s, log.toString()));
        });
        return result;
    }

    public PipelineRun getLastPipelineRun(String projectId, String pipelineName, String namespace) {
        return tektonClient().v1beta1().pipelineRuns().inNamespace(namespace)
                .withLabel("karavan-project-id", projectId)
                .withLabel("tekton.dev/pipeline", pipelineName)
                .list().getItems().stream().sorted((o1, o2) -> o2.getMetadata().getCreationTimestamp().compareTo(o1.getMetadata().getCreationTimestamp()))
                .findFirst().get();
    }

    public void rolloutDeployment(String name, String namespace) {
        try {
            if (kubernetesClient().isAdaptable(OpenShiftClient.class)) {
                openshiftClient().deploymentConfigs().inNamespace(namespace).withName(name).deployLatest();
            } else {
                // TODO: Implement Deployment for Kubernetes/Minikube
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deleteDeployment(String name, String namespace) {
        try {
            if (kubernetesClient().isAdaptable(OpenShiftClient.class)) {
                openshiftClient().deploymentConfigs().inNamespace(namespace).withName(name).delete();
            } else {
                // TODO: Implement Deployment for Kubernetes/Minikube
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deletePod(String name, String namespace) {
        try {
            kubernetesClient().pods().inNamespace(namespace).withName(name).delete();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public DeploymentStatus getDeploymentStatus(String name, String namespace) {
        try {
            if (kubernetesClient().isAdaptable(OpenShiftClient.class)) {
                DeploymentConfig dc = openshiftClient().deploymentConfigs().inNamespace(namespace).withName(name).get();
                String dsImage = dc.getSpec().getTemplate().getSpec().getContainers().get(0).getImage();
                String imageName = dsImage.startsWith("image-registry.openshift-image-registry.svc")
                        ? dsImage.replace("image-registry.openshift-image-registry.svc:5000/", "")
                        : dsImage;

                List<Pod> pods = openshiftClient().pods().inNamespace(namespace)
                        .withLabel("app.kubernetes.io/name", name)
                        .withLabel("deploymentconfig", name)
                        .list().getItems();

                List<PodStatus> podStatuses = pods.stream().map(pod -> new PodStatus(
                        pod.getMetadata().getName(),
                        pod.getStatus().getContainerStatuses().get(0).getStarted(),
                        pod.getStatus().getContainerStatuses().get(0).getReady(),
                        getPodReason(pod),
                        pod.getMetadata().getLabels().get("deployment")
                        )).collect(Collectors.toList());

                return new DeploymentStatus(
                        imageName,
                        dc.getSpec().getReplicas(),
                        dc.getStatus().getReadyReplicas(),
                        dc.getStatus().getUnavailableReplicas(),
                        podStatuses
                );
            } else {
                // TODO: Implement Deployment for Kubernetes/Minikube
                return new DeploymentStatus();
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new DeploymentStatus();
        }
    }

    private String getPodReason (Pod pod){
        try {
            return pod.getStatus().getContainerStatuses().get(0).getState().getWaiting().getReason();
        } catch (Exception e){
            return "";
        }
    }

    public Secret getKaravanSecret() {
        return kubernetesClient().secrets().inNamespace(namespace).withName("karavan").get();
    }

    public boolean inKubernetes() {
        return !Objects.equals(namespace, "localhost");
    }
}
