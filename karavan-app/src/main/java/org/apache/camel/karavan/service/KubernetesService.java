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

import io.fabric8.knative.internal.pkg.apis.Condition;
import io.fabric8.kubernetes.api.model.ObjectMeta;
import io.fabric8.kubernetes.api.model.ObjectMetaBuilder;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.Secret;
import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import io.fabric8.kubernetes.client.informers.SharedIndexInformer;
import io.fabric8.openshift.api.model.ImageStream;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.client.DefaultTektonClient;
import io.fabric8.tekton.pipeline.v1beta1.ParamBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRef;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRefBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRun;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunBuilder;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunSpec;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunSpecBuilder;
import io.fabric8.tekton.pipeline.v1beta1.TaskRun;
import io.fabric8.tekton.pipeline.v1beta1.WorkspaceBindingBuilder;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.mutiny.core.eventbus.EventBus;
import org.apache.camel.karavan.informer.ServiceEventHandler;
import org.apache.camel.karavan.model.PipelineRunLog;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.informer.DeploymentEventHandler;
import org.apache.camel.karavan.informer.PipelineRunEventHandler;
import org.apache.camel.karavan.informer.PodEventHandler;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Default;
import javax.enterprise.inject.Produces;
import javax.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


@Default
@Readiness
@ApplicationScoped
public class KubernetesService implements HealthCheck{

    private static final Logger LOGGER = Logger.getLogger(KubernetesService.class.getName());
    public static final String START_INFORMERS = "start-informers";
    public static final String STOP_INFORMERS = "stop-informers";

    @Inject
    EventBus eventBus;

    @Inject
    InfinispanService infinispanService;

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

    @ConfigProperty(name = "kubernetes.namespace", defaultValue = "localhost")
    String currentNamespace;

    @ConfigProperty(name = "karavan.environment")
    public String environment;


    List<SharedIndexInformer> informers = new ArrayList<>(3);

    @ConsumeEvent(value = START_INFORMERS, blocking = true)
    void startInformers(String data) {
        try {
            stopInformers(null);
            LOGGER.info("Starting Kubernetes Informers");
            String runtimeLabel = getRuntimeLabel();

            SharedIndexInformer<Deployment> deploymentInformer = kubernetesClient().apps().deployments().inNamespace(getNamespace()).withLabel(runtimeLabel, "camel").inform();
            deploymentInformer.addEventHandlerWithResyncPeriod(new DeploymentEventHandler(infinispanService, this),30 * 1000L);
            informers.add(deploymentInformer);

            SharedIndexInformer<Service> serviceInformer = kubernetesClient().services().inNamespace(getNamespace()).withLabel(runtimeLabel, "camel").inform();
            serviceInformer.addEventHandlerWithResyncPeriod(new ServiceEventHandler(infinispanService, this),30 * 1000L);
            informers.add(serviceInformer);

            SharedIndexInformer<PipelineRun> pipelineRunInformer = tektonClient().v1beta1().pipelineRuns().inNamespace(getNamespace()).withLabel(runtimeLabel, "camel").inform();
            pipelineRunInformer.addEventHandlerWithResyncPeriod(new PipelineRunEventHandler(infinispanService, this),30 * 1000L);
            informers.add(pipelineRunInformer);

            SharedIndexInformer<Pod> podRunInformer = kubernetesClient().pods().inNamespace(getNamespace()).withLabel(runtimeLabel, "camel").inform();
            podRunInformer.addEventHandlerWithResyncPeriod(new PodEventHandler(infinispanService, this),30 * 1000L);
            informers.add(podRunInformer);
            LOGGER.info("Started Kubernetes Informers");
        } catch (Exception e) {
            LOGGER.error("Error starting informers: " + e.getMessage());
        }
    }

    
    @Override
    public HealthCheckResponse call() {
        if(informers.size() == 4) {
            return HealthCheckResponse.up("All Kubernetes informers are running.");
        }
        else {
            return HealthCheckResponse.down("kubernetes Informers are not running.");
        }
    }

    @ConsumeEvent(value = STOP_INFORMERS, blocking = true)
    void stopInformers(String data) {
        LOGGER.info("Stop Kubernetes Informers");
        informers.forEach(informer -> informer.close());
        informers.clear();
    }

    private String getPipelineName(Project project) {
        return "karavan-pipeline-" + environment + "-" + project.getRuntime();
    }

    public String createPipelineRun(Project project) {
        String pipeline = getPipelineName(project);
        LOGGER.info("Pipeline " + pipeline + " is creating for " + project.getProjectId());

        Map<String, String> labels = Map.of(
                "karavan-project-id", project.getProjectId(),
                "tekton.dev/pipeline", pipeline,
                getRuntimeLabel(), "camel"
        );

        ObjectMeta meta = new ObjectMetaBuilder()
                .withGenerateName("karavan-" + project.getProjectId() + "-")
                .withLabels(labels)
                .withNamespace(getNamespace())
                .build();

        PipelineRef ref = new PipelineRefBuilder().withName(pipeline).build();

        PipelineRunSpec spec = new PipelineRunSpecBuilder()
                .withPipelineRef(ref)
                .withServiceAccountName("pipeline")
                .withParams(new ParamBuilder().withName("PROJECT_ID").withNewValue(project.getProjectId()).build())
                .withWorkspaces(
                        new WorkspaceBindingBuilder().withName("karavan-m2-cache").withNewPersistentVolumeClaim("karavan-m2-cache", false).build(),
                        new WorkspaceBindingBuilder().withName("karavan-jbang-cache").withNewPersistentVolumeClaim("karavan-jbang-cache", false).build())
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

    public List<TaskRun> getTaskRuns(String pipelineRuneName, String namespace) {
        return tektonClient().v1beta1().taskRuns().inNamespace(namespace).withLabel("tekton.dev/pipelineRun", pipelineRuneName).list().getItems();
    }

    public String getContainerLog(String podName, String namespace) {
        String logText = kubernetesClient().pods().inNamespace(namespace).withName(podName).getLog(true);
        return logText;
    }


    // TODO: implement log watch
    public void startContainerLogWatch(String podName, String namespace) {
        LogWatch logWatch = kubernetesClient().pods().inNamespace(namespace).withName(podName).watchLog();
        InputStream is = logWatch.getOutput();
        Integer i;
        try {
            while ((i = is.available()) != null) {
                eventBus.publish(podName + "-" + namespace, new String(is.readNBytes(i)));
            }
        } catch (IOException e) {
            LOGGER.error(e);
        }
    }

    public List<PipelineRunLog> getPipelineRunLog(String pipelineRuneName, String namespace) {
        List<PipelineRunLog> result = new ArrayList<>(1);
        getTaskRuns(pipelineRuneName, namespace).forEach(taskRun -> {
            String podName = taskRun.getStatus().getPodName();
            StringBuilder log = new StringBuilder();
            taskRun.getStatus().getSteps().forEach(stepState -> {
                String logText = kubernetesClient().pods().inNamespace(namespace).withName(podName).inContainer(stepState.getContainer()).getLog(true);
                log.append(stepState.getContainer()).append(System.lineSeparator());
                log.append(logText).append(System.lineSeparator());
            });
            result.add(new PipelineRunLog(taskRun.getMetadata().getName(), log.toString()));
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

    public void stopPipelineRun(String pipelineRunName, String namespace) {
        try {
            LOGGER.info("Stop PipelineRun: " + pipelineRunName + " in the namespace: " + namespace);

            getTaskRuns(pipelineRunName, namespace).forEach(taskRun -> {
                taskRun.getStatus().setConditions(getCancelConditions("TaskRunCancelled"));
                tektonClient().v1beta1().taskRuns().inNamespace(namespace).resource(taskRun).replaceStatus();
            });

            PipelineRun run = tektonClient().v1beta1().pipelineRuns().inNamespace(namespace).withName(pipelineRunName).get();
            run.getStatus().setConditions(getCancelConditions("CancelledRunFinally"));
            tektonClient().v1beta1().pipelineRuns().inNamespace(namespace).resource(run).replaceStatus();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    private List<Condition> getCancelConditions(String reason){
        List<Condition> cancelConditions = new ArrayList<>();
        Condition taskRunCancelCondition = new Condition();
        taskRunCancelCondition.setType("Succeeded");
        taskRunCancelCondition.setStatus("False");
        taskRunCancelCondition.setReason(reason);
        taskRunCancelCondition.setMessage("Cancelled successfully.");
        cancelConditions.add(taskRunCancelCondition);
        return cancelConditions;
    }
    
    public void rolloutDeployment(String name, String namespace) {
        try {
            kubernetesClient().apps().deployments().inNamespace(namespace).withName(name).rolling().restart();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deleteDeployment(String name, String namespace) {
        try {
            LOGGER.info("Delete deployment: " + name + " in the namespace: " + namespace);
            kubernetesClient().apps().deployments().inNamespace(namespace).withName(name).delete();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deletePod(String name, String namespace) {
        try {
            LOGGER.info("Delete pod: " + name + " in the namespace: " + namespace);
            kubernetesClient().pods().inNamespace(namespace).withName(name).delete();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public Deployment getDeployment(String name, String namespace) {
        try {
            return kubernetesClient().apps().deployments().inNamespace(namespace).withName(name).get();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public boolean hasDeployment(String name, String namespace) {
        try {
            Deployment deployment = kubernetesClient().apps().deployments().inNamespace(namespace).withName(name).get();
            return deployment != null;
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return false;
        }
    }

    public List<String> getCamelDeployments(String namespace) {
        try {
            String labelName = getRuntimeLabel();
            return kubernetesClient().apps().deployments().inNamespace(namespace).withLabel(labelName, "camel").list().getItems()
                    .stream().map(deployment -> deployment.getMetadata().getName()).collect(Collectors.toList());
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return List.of();
        }
    }

    private String getPodReason(Pod pod) {
        try {
            return pod.getStatus().getContainerStatuses().get(0).getState().getWaiting().getReason();
        } catch (Exception e) {
            return "";
        }
    }

    public List<String> getConfigMaps(String namespace) {
        List<String> result = new ArrayList<>();
        try {
        kubernetesClient().configMaps().inNamespace(namespace).list().getItems().forEach(configMap -> {
            String name = configMap.getMetadata().getName();
            if (configMap.getData() != null) {
                configMap.getData().keySet().forEach(data -> result.add(name + "/" + data));
            }
        });
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return result;
    }

    public List<String> getSecrets(String namespace) {
        List<String> result = new ArrayList<>();
        try {
            kubernetesClient().secrets().inNamespace(namespace).list().getItems().forEach(secret -> {
                String name = secret.getMetadata().getName();
                if (secret.getData() != null) {
                    secret.getData().keySet().forEach(data -> result.add(name + "/" + data));
                }
            });
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return result;
    }

    public List<String> getServices(String namespace) {
        List<String> result = new ArrayList<>();
        try {
        kubernetesClient().services().inNamespace(namespace).list().getItems().forEach(service -> {
            String name = service.getMetadata().getName();
            String host = name + "." + namespace + ".svc.cluster.local";
            service.getSpec().getPorts().forEach(port -> result.add(name + "|" + host + ":" + port.getPort()));
        });
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return result;
    }

    public List<String> getProjectImageTags(String projectId, String namespace) {
        List<String> result = new ArrayList<>();
        try {
            if (isOpenshift()) {
                ImageStream is = openshiftClient().imageStreams().inNamespace(namespace).withName(projectId).get();
                if (is != null) {
                    result.addAll(is.getSpec().getTags().stream().map(t -> t.getName()).sorted(Comparator.reverseOrder()).collect(Collectors.toList()));
                }
            } else {
                // TODO: Implement for Kubernetes/Minikube
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
        return result;
    }

    public Secret getKaravanSecret() {
        return kubernetesClient().secrets().inNamespace(getNamespace()).withName("karavan").get();
    }

    public String getRuntimeLabel() {
        return isOpenshift() ? "app.openshift.io/runtime" : "app.kubernetes.io/runtime";
    }

    public boolean isOpenshift() {
        return inKubernetes() ? kubernetesClient().isAdaptable(OpenShiftClient.class) : false;
    }

    public String getCluster() {
        return kubernetesClient().getMasterUrl().getHost();
    }
    public String getNamespace() {
        return currentNamespace;
    }

    public boolean inKubernetes() {
        return !Objects.equals(getNamespace(), "localhost");
    }

}
