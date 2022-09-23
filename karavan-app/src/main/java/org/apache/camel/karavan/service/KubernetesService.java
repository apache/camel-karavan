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
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.dsl.LogWatch;
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
import io.fabric8.tekton.pipeline.v1beta1.WorkspaceBindingBuilder;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.mutiny.core.eventbus.EventBus;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.PipelineRunLog;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.watcher.DeploymentWatcher;
import org.apache.camel.karavan.watcher.PipelineRunWatcher;
import org.apache.camel.karavan.watcher.PodWatcher;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.enterprise.inject.Produces;
import javax.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.nio.channels.Pipe;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
public class KubernetesService {

    @Inject
    EventBus eventBus;

    @ConfigProperty(name = "kubernetes.namespace", defaultValue = "localhost")
    String currentNamespace;

    @Inject
    KaravanConfiguration config;

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

    private static final Logger LOGGER = Logger.getLogger(KubernetesService.class.getName());

    private List<Watch> watches = new ArrayList<>();

    void start() {
        LOGGER.info("Start KubernetesService");
        Optional<KaravanConfiguration.Environment> env = config.environments().stream()
                .filter(environment -> environment.name().equals("dev")).findFirst();
        if (env.isPresent()) {
            watches.add(kubernetesClient().apps().deployments().inNamespace(env.get().namespace())
                    .watch(new DeploymentWatcher(infinispanService, this)));

            watches.add(kubernetesClient().pods().inNamespace(env.get().namespace()).withLabel("app.openshift.io/runtime", "camel")
                    .watch(new PodWatcher(infinispanService, this)));

            watches.add(tektonClient().v1beta1().pipelineRuns().inNamespace(env.get().namespace())
                    .watch(new PipelineRunWatcher(infinispanService)));
        }
    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("Stop KubernetesService");
        watches.forEach(watch -> watch.close());
    }

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
                .withWorkspaces(
                        new WorkspaceBindingBuilder().withName("m2-cache").withNewPersistentVolumeClaim("karavan-m2-cache", false).build(),
                        new WorkspaceBindingBuilder().withName("jbang-cache").withNewPersistentVolumeClaim("karavan-jbang-cache", false).build())
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

    public DeploymentStatus getDeploymentStatus(String name, Deployment deployment) {
        try {
            String dsImage = deployment.getSpec().getTemplate().getSpec().getContainers().get(0).getImage();
            String imageName = dsImage.startsWith("image-registry.openshift-image-registry.svc")
                    ? dsImage.replace("image-registry.openshift-image-registry.svc:5000/", "")
                    : dsImage;

            List<PodStatus> podStatuses = getDeploymentPodsStatuses(name, deployment.getMetadata().getNamespace());

            return new DeploymentStatus(
                    name,
                    imageName,
                    deployment.getSpec().getReplicas(),
                    deployment.getStatus().getReadyReplicas(),
                    deployment.getStatus().getUnavailableReplicas(),
                    podStatuses
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new DeploymentStatus(name);
        }
    }

    public List<PodStatus> getDeploymentPodsStatuses(String name, String namespace) {
        try {
            List<Pod> pods = kubernetesClient().pods().inNamespace(namespace)
                    .withLabel("app.kubernetes.io/name", name)
                    .withLabel("app.openshift.io/runtime", "camel")
                    .list().getItems();

            return pods.stream().map(pod -> new PodStatus(
                    pod.getMetadata().getName(),
                    pod.getStatus().getContainerStatuses().get(0).getStarted(),
                    pod.getStatus().getContainerStatuses().get(0).getReady(),
                    getPodReason(pod),
                    pod.getMetadata().getLabels().get("app.kubernetes.io/name")
            )).collect(Collectors.toList());
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return List.of();
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
            return kubernetesClient().apps().deployments().inNamespace(namespace).withLabel("app.openshift.io/runtime", "camel").list().getItems()
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
        kubernetesClient().configMaps().inNamespace(namespace).list().getItems().forEach(configMap -> {
            String name = configMap.getMetadata().getName();
            configMap.getData().keySet().forEach(data -> result.add(name + "/" + data));
        });
        return result;
    }

    public List<String> getSecrets(String namespace) {
        List<String> result = new ArrayList<>();
        kubernetesClient().secrets().inNamespace(namespace).list().getItems().forEach(secret -> {
            String name = secret.getMetadata().getName();
            secret.getData().keySet().forEach(data -> result.add(name + "/" + data));
        });
        return result;
    }

    public List<String> getServices(String namespace) {
        List<String> result = new ArrayList<>();
        kubernetesClient().services().inNamespace(namespace).list().getItems().forEach(service -> {
            String name = service.getMetadata().getName();
            String host = name + "." + namespace + ".svc.cluster.local";
            service.getSpec().getPorts().forEach(port -> result.add(name + "|" + host + ":" + port.getPort()));
        });
        return result;
    }

    public List<String> getProjectImageTags(String projectId, String namespace) {
        List<String> result = new ArrayList<>();
        try {
            if (kubernetesClient().isAdaptable(OpenShiftClient.class)) {
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
        return kubernetesClient().secrets().inNamespace(currentNamespace).withName("karavan").get();
    }

    public boolean inKubernetes() {
        return !Objects.equals(currentNamespace, "localhost");
    }
}
