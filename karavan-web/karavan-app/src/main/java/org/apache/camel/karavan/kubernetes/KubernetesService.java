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
package org.apache.camel.karavan.kubernetes;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import io.fabric8.kubernetes.client.informers.SharedIndexInformer;
import io.fabric8.openshift.api.model.ImageStream;
import io.fabric8.openshift.client.OpenShiftClient;
import io.quarkus.runtime.configuration.ProfileManager;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.Constants.*;

@Default
@Readiness
@ApplicationScoped
public class KubernetesService implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(KubernetesService.class.getName());
    protected static final int INFORMERS = 3;

    @Inject
    EventBus eventBus;

    @Inject
    InfinispanService infinispanService;

    private String namespace;

    @Produces
    public KubernetesClient kubernetesClient() {
        return new DefaultKubernetesClient();
    }

    @Produces
    public OpenShiftClient openshiftClient() {
        return kubernetesClient().adapt(OpenShiftClient.class);
    }

    @ConfigProperty(name = "karavan.environment")
    public String environment;

    @ConfigProperty(name = "karavan.version")
    String version;

    List<SharedIndexInformer> informers = new ArrayList<>(INFORMERS);

    public void startInformers(String data) {
        try {
            stopInformers();
            LOGGER.info("Starting Kubernetes Informers");

            Map<String, String> labels = getRuntimeLabels();
            KubernetesClient client = kubernetesClient();

            SharedIndexInformer<Deployment> deploymentInformer = client.apps().deployments().inNamespace(getNamespace())
                    .withLabels(labels).inform();
            deploymentInformer.addEventHandlerWithResyncPeriod(new DeploymentEventHandler(infinispanService, this), 30 * 1000L);
            informers.add(deploymentInformer);

            SharedIndexInformer<Service> serviceInformer = client.services().inNamespace(getNamespace())
                    .withLabels(labels).inform();
            serviceInformer.addEventHandlerWithResyncPeriod(new ServiceEventHandler(infinispanService, this), 30 * 1000L);
            informers.add(serviceInformer);

            SharedIndexInformer<Pod> podRunInformer = client.pods().inNamespace(getNamespace())
                    .withLabels(labels).inform();
            podRunInformer.addEventHandlerWithResyncPeriod(new PodEventHandler(infinispanService, this, eventBus), 30 * 1000L);
            informers.add(podRunInformer);

            LOGGER.info("Started Kubernetes Informers");
        } catch (Exception e) {
            LOGGER.error("Error starting informers: " + e.getMessage());
        }
    }


    @Override
    public HealthCheckResponse call() {
        if (ConfigService.inKubernetes()) {
            if (informers.size() == INFORMERS) {
                return HealthCheckResponse.named("Kubernetes").up().build();
            } else {
                return HealthCheckResponse.named("Kubernetes").down().build();
            }
        } else {
            return HealthCheckResponse.named("Kubernetesless").up().build();
        }
    }

    public void stopInformers() {
        LOGGER.info("Stop Kubernetes Informers");
        informers.forEach(SharedIndexInformer::close);
        informers.clear();
    }

    public void runBuildProject(Project project, String script, List<String> env, String tag) {
        try (KubernetesClient client = kubernetesClient()) {
            String containerName = project.getProjectId() + BUILDER_SUFFIX;
            Map<String, String> labels = getLabels(containerName, project, ContainerStatus.ContainerType.build);
//        createPVC(containerName, labels);

            // create script configMap
            ConfigMap configMap = client.configMaps().inNamespace(getNamespace()).withName(containerName).get();
            if (configMap == null) {
                configMap = getConfigMapForBuilder(containerName, labels);
            }
            configMap.setData(Map.of("build.sh", script));
            client.resource(configMap).serverSideApply();

//        Delete old build pod
            Pod old = client.pods().inNamespace(getNamespace()).withName(containerName).get();
            if (old != null) {
                client.resource(old).delete();
            }
            Pod pod = getBuilderPod(containerName, env, labels);
            Pod result = client.resource(pod).serverSideApply();

            LOGGER.info("Created pod " + result.getMetadata().getName());
        }
    }

    private Map<String, String> getLabels(String name, Project project, ContainerStatus.ContainerType type) {
        Map<String, String> labels = new HashMap<>();
        labels.putAll(getRuntimeLabels());
        labels.putAll(getPartOfLabels());
        labels.put("app.kubernetes.io/name", name);
        labels.put(LABEL_PROJECT_ID, project.getProjectId());
        if (type != null) {
            labels.put(LABEL_TYPE, type.name());
        }
        return labels;
    }

    private Map<String, String> getRuntimeLabels() {
        Map<String, String> labels = new HashMap<>();
        labels.put(isOpenshift() ? "app.openshift.io/runtime" : "app.kubernetes.io/runtime", CAMEL_PREFIX);
        return labels;
    }

    private Map<String, String> getPartOfLabels() {
        Map<String, String> labels = new HashMap<>();
        labels.put(LABEL_PART_OF, KARAVAN_PREFIX);
        return labels;
    }

    private ConfigMap getConfigMapForBuilder(String name, Map<String, String> labels) {
        return new ConfigMapBuilder()
                .withMetadata(new ObjectMetaBuilder()
                        .withName(name)
                        .withLabels(labels)
                        .withNamespace(getNamespace())
                        .build())
                .build();
    }

    private Pod getBuilderPod(String name, List<String> env, Map<String, String> labels) {
        List<EnvVar> envVars = new ArrayList<>();
        env.stream().map(s -> s.split("=")).filter(s -> s.length > 0).forEach(parts -> {
            String varName = parts[0];
            String varValue = parts[1];
            envVars.add(new EnvVarBuilder().withName(varName).withValue(varValue).build());
        });

        envVars.add(
                new EnvVar("IMAGE_REGISTRY", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("image-registry", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("IMAGE_REGISTRY_USERNAME", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("image-registry-username", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("IMAGE_REGISTRY_PASSWORD", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("image-registry-password", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("IMAGE_GROUP", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("image-group", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("GIT_REPOSITORY", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("git-repository", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("GIT_USERNAME", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("git-username", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("GIT_PASSWORD", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("git-password", KARAVAN_SECRET_NAME, false)).build())
        );
        envVars.add(
                new EnvVar("GIT_BRANCH", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("git-branch", KARAVAN_SECRET_NAME, false)).build())
        );

        ObjectMeta meta = new ObjectMetaBuilder()
                .withName(name)
                .withLabels(labels)
                .withNamespace(getNamespace())
                .build();

        ContainerPort port = new ContainerPortBuilder()
                .withContainerPort(8080)
                .withName("http")
                .withProtocol("TCP")
                .build();

        Container container = new ContainerBuilder()
                .withName(name)
                .withImage("ghcr.io/apache/camel-karavan-devmode:" + version)
                .withPorts(port)
                .withImagePullPolicy("Always")
                .withEnv(envVars)
                .withCommand("/bin/sh", "-c", "/karavan/builder/build.sh")
                .withVolumeMounts(
                        new VolumeMountBuilder().withName("builder").withMountPath("/karavan/builder").withReadOnly(true).build()
                )
                .build();

        PodSpec spec = new PodSpecBuilder()
                .withTerminationGracePeriodSeconds(0L)
                .withContainers(container)
                .withRestartPolicy("Never")
                .withServiceAccount(KARAVAN_SERVICE_ACCOUNT)
                .withVolumes(
                        new VolumeBuilder().withName("builder")
                                .withConfigMap(new ConfigMapVolumeSourceBuilder().withName(name).withItems(
                                        new KeyToPathBuilder().withKey("build.sh").withPath("build.sh").build()
                                ).withDefaultMode(511).build()).build()
//                        new VolumeBuilder().withName("maven-settings")
//                                .withConfigMap(new ConfigMapVolumeSourceBuilder()
//                                        .withName("karavan").build()).build()
                ).build();

        return new PodBuilder()
                .withMetadata(meta)
                .withSpec(spec)
                .build();
    }

    public Tuple2<LogWatch, KubernetesClient> getContainerLogWatch(String podName) {
        KubernetesClient client = kubernetesClient();
        LogWatch logWatch = client.pods().inNamespace(getNamespace()).withName(podName).tailingLines(100).watchLog();
        return Tuple2.of(logWatch, client);
    }

    public void rolloutDeployment(String name, String namespace) {
        try (KubernetesClient client = kubernetesClient()) {
            client.apps().deployments().inNamespace(namespace).withName(name).rolling().restart();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deleteDeployment(String name, String namespace) {
        try (KubernetesClient client = kubernetesClient()) {
            LOGGER.info("Delete deployment: " + name + " in the namespace: " + namespace);
            client.apps().deployments().inNamespace(namespace).withName(name).delete();
            client.services().inNamespace(namespace).withName(name).delete();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deletePod(String name) {
        try (KubernetesClient client = kubernetesClient()) {
            LOGGER.info("Delete pod: " + name);
            client.pods().inNamespace(getNamespace()).withName(name).delete();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public List<String> getConfigMaps(String namespace) {
        List<String> result = new ArrayList<>();
        try (KubernetesClient client = kubernetesClient()) {
            client.configMaps().inNamespace(namespace).list().getItems().forEach(configMap -> {
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
        try (KubernetesClient client = kubernetesClient()) {
            client.secrets().inNamespace(namespace).list().getItems().forEach(secret -> {
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
        try (KubernetesClient client = kubernetesClient()) {
            client.services().inNamespace(namespace).list().getItems().forEach(service -> {
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

    public void runDevModeContainer(Project project, String jBangOptions) {
        String name = project.getProjectId();
        Map<String, String> labels = getLabels(name, project, ContainerStatus.ContainerType.devmode);
        try (KubernetesClient client = kubernetesClient()) {
            createPVC(name, labels);
            Pod old = client.pods().inNamespace(getNamespace()).withName(name).get();
            if (old == null) {
                Map<String, String> containerResources = CodeService.DEFAULT_CONTAINER_RESOURCES;
                Pod pod = getDevModePod(name, jBangOptions, containerResources, labels);
                Pod result = client.resource(pod).createOrReplace();
                LOGGER.info("Created pod " + result.getMetadata().getName());
            }
        }
        createService(name, labels);
    }

    public void deleteDevModePod(String name, boolean deletePVC) {
        try (KubernetesClient client = kubernetesClient()) {
            LOGGER.info("Delete devmode pod: " + name + " in the namespace: " + getNamespace());
            client.pods().inNamespace(getNamespace()).withName(name).delete();
            client.services().inNamespace(getNamespace()).withName(name).delete();
            if (deletePVC) {
                client.persistentVolumeClaims().inNamespace(getNamespace()).withName(name).delete();
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public ResourceRequirements getResourceRequirements(Map<String, String> containerResources) {
        return new ResourceRequirementsBuilder()
                .addToRequests("cpu", new Quantity(containerResources.get("requests.cpu")))
                .addToRequests("memory", new Quantity(containerResources.get("requests.memory")))
                .addToLimits("cpu", new Quantity(containerResources.get("limits.cpu")))
                .addToLimits("memory", new Quantity(containerResources.get("limits.memory")))
                .build();
    }

    private Pod getDevModePod(String name, String jbangOptions, Map<String, String> containerResources, Map<String, String> labels) {
        ResourceRequirements resources = getResourceRequirements(containerResources);

        ObjectMeta meta = new ObjectMetaBuilder()
                .withName(name)
                .withLabels(labels)
                .withNamespace(getNamespace())
                .build();

        ContainerPort port = new ContainerPortBuilder()
                .withContainerPort(8080)
                .withName("http")
                .withProtocol("TCP")
                .build();

        Container container = new ContainerBuilder()
                .withName(name)
                .withImage("ghcr.io/apache/camel-karavan-devmode:" + version)
                .withPorts(port)
                .withResources(resources)
                .withImagePullPolicy("Always")
                .withEnv(new EnvVarBuilder().withName(ENV_VAR_JBANG_OPTIONS).withValue(jbangOptions).build())
//                .withVolumeMounts(
//                        new VolumeMountBuilder().withName("maven-settings").withSubPath("maven-settings.xml")
//                                .withMountPath("/karavan-config-map/maven-settings.xml").build()
//                )
                .build();

        PodSpec spec = new PodSpecBuilder()
                .withTerminationGracePeriodSeconds(0L)
                .withContainers(container)
                .withRestartPolicy("Never")
                .withVolumes(
                        new VolumeBuilder().withName(name)
                                .withNewPersistentVolumeClaim(name, false).build(),
                        new VolumeBuilder().withName("maven-settings")
                                .withConfigMap(new ConfigMapVolumeSourceBuilder()
                                        .withName("karavan").build()).build())
                .build();

        return new PodBuilder()
                .withMetadata(meta)
                .withSpec(spec)
                .build();
    }

    private void createPVC(String podName, Map<String, String> labels) {
        try (KubernetesClient client = kubernetesClient()) {
            PersistentVolumeClaim old = client.persistentVolumeClaims().inNamespace(getNamespace()).withName(podName).get();
            if (old == null) {
                PersistentVolumeClaim pvc = new PersistentVolumeClaimBuilder()
                        .withNewMetadata()
                        .withName(podName)
                        .withNamespace(getNamespace())
                        .withLabels(labels)
                        .endMetadata()
                        .withNewSpec()
                        .withResources(new ResourceRequirementsBuilder().withRequests(Map.of("storage", new Quantity("2Gi"))).build())
                        .withVolumeMode("Filesystem")
                        .withAccessModes("ReadWriteOnce")
                        .endSpec()
                        .build();
                client.resource(pvc).createOrReplace();
            }
        }
    }

    private void createService(String name, Map<String, String> labels) {
        try (KubernetesClient client = kubernetesClient()) {
            ServicePortBuilder portBuilder = new ServicePortBuilder()
                    .withName("http").withPort(80).withProtocol("TCP").withTargetPort(new IntOrString(8080));

            Service service = new ServiceBuilder()
                    .withNewMetadata()
                    .withName(name)
                    .withNamespace(getNamespace())
                    .withLabels(labels)
                    .endMetadata()
                    .withNewSpec()
                    .withType("ClusterIP")
                    .withPorts(portBuilder.build())
                    .withSelector(labels)
                    .endSpec()
                    .build();
            client.resource(service).createOrReplace();
        }
    }

    public Secret getKaravanSecret() {
        try (KubernetesClient client = kubernetesClient()) {
            return client.secrets().inNamespace(getNamespace()).withName("karavan").get();
        }
    }

    public String getKaravanSecret(String key) {
        try (KubernetesClient client = kubernetesClient()) {
            Secret secret = client.secrets().inNamespace(getNamespace()).withName("karavan").get();
            Map<String, String> data = secret.getData();
            return decodeSecret(data.get(key));
        }
    }

    private String decodeSecret(String data) {
        if (data != null) {
            return new String(Base64.getDecoder().decode(data.getBytes(StandardCharsets.UTF_8)));
        }
        return null;
    }

    public boolean isOpenshift() {
        try (KubernetesClient client = kubernetesClient()) {
            return ConfigService.inKubernetes() ? client.isAdaptable(OpenShiftClient.class) : false;
        }
    }

    public String getCluster() {
        try (KubernetesClient client = kubernetesClient()) {
            return client.getMasterUrl().getHost();
        }
    }

    public String getNamespace() {
        if (namespace == null) {
            try (KubernetesClient client = kubernetesClient()) {
                namespace = ProfileManager.getLaunchMode().isDevOrTest() ? "karavan" : client.getNamespace();
            }
        }
        return namespace;
    }
}
