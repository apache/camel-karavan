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
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import io.fabric8.kubernetes.client.utils.Serialization;
import io.quarkus.runtime.LaunchMode;
import io.smallrye.mutiny.tuples.Tuple2;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.model.ContainerType;
import org.apache.camel.karavan.model.KubernetesConfigMap;
import org.apache.camel.karavan.model.KubernetesSecret;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.service.CodeService.BUILD_SCRIPT_FILENAME;

@Default
@ApplicationScoped
public class KubernetesService {

    private static final Logger LOGGER = Logger.getLogger(KubernetesService.class.getName());

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    private String environment;

    @Inject
    CodeService codeService;

    private String namespace;

    @Produces
    public KubernetesClient kubernetesClient() {
        return new KubernetesClientBuilder().build();
    }

    @ConfigProperty(name = DEVMODE_IMAGE)
    String devmodeImage;

    @ConfigProperty(name = DEVMODE_IMAGE_PULL_POLICY, defaultValue = "IfNotPresent")
    Optional<String> devmodeImagePullPolicy;

    @ConfigProperty(name = "karavan.devmode.service.account")
    String devModeServiceAccount;

    @ConfigProperty(name = "karavan.devmode.createm2", defaultValue = "false")
    Optional<Boolean> devmodePVC;

    @ConfigProperty(name = "karavan.builder.service.account")
    String builderServiceAccount;

    @ConfigProperty(name = "karavan.secret.name", defaultValue = "karavan")
    String secretName;

    @ConfigProperty(name = "karavan.private-key-path")
    Optional<String> privateKeyPath;

    @ConfigProperty(name = "karavan.openshift")
    Optional<Boolean> isOpenShift;

    public void createConfigmap(String name, Map<String, String> data) {
        LOGGER.info("Creating configmap " + name);
        if (ConfigService.inKubernetes()) {
            try (KubernetesClient client = kubernetesClient()) {
                ConfigMap configMap = client.configMaps().inNamespace(getNamespace()).withName(name).get();
                if (configMap == null) {
                    configMap = new ConfigMapBuilder()
                            .withMetadata(new ObjectMetaBuilder()
                                    .withName(name)
                                    .withLabels(getPartOfLabels())
                                    .withNamespace(getNamespace())
                                    .build())
                            .build();
                    configMap.setData(data);
                    client.resource(configMap).create();
                } else {
                    configMap.setData(data);
                    client.resource(configMap).update();
                }

            } catch (Exception e) {
                LOGGER.error("Error create Configmap: " + e.getMessage());
            }
        }
    }

    public void runBuildProject(String projectId, String podFragment) {
        try (KubernetesClient client = kubernetesClient()) {
            String containerName = projectId + BUILDER_SUFFIX;
            Map<String, String> labels = getLabels(containerName, projectId, ContainerType.build);

//        Delete old build pod
            Pod old = client.pods().inNamespace(getNamespace()).withName(containerName).get();
            if (old != null) {
                client.resource(old).delete();
            }
            boolean hasDockerConfigSecret = hasDockerConfigSecret();
            Pod pod = getBuilderPod(containerName, labels, podFragment, hasDockerConfigSecret);
            Pod result = client.resource(pod).create();

            LOGGER.info("Created pod " + result.getMetadata().getName());
        } catch (Exception e) {
            LOGGER.error("Error creating build container: " + e.getMessage());
        }
    }

    private Map<String, String> getLabels(String name, String projectId, ContainerType type) {
        Map<String, String> labels = new HashMap<>();
        labels.putAll(getPartOfLabels());
        labels.put("app.kubernetes.io/name", name);
        labels.put(LABEL_PROJECT_ID, projectId);
        if (type != null) {
            labels.put(LABEL_TYPE, type.name());
        }
        if (Objects.equals(type, ContainerType.devmode)) {
            labels.put(LABEL_CAMEL_RUNTIME, CamelRuntime.CAMEL_MAIN.getValue());
            labels.putAll(getRuntimeLabels());
        }
        return labels;
    }

    private Map<String, String> getRuntimeLabels() {
        Map<String, String> labels = new HashMap<>();
        labels.put(isOpenshift() ? "app.openshift.io/runtime" : "app.kubernetes.io/runtime", CAMEL_PREFIX);
        return labels;
    }

    public Map<String, String> getPartOfLabels() {
        Map<String, String> labels = new HashMap<>();
        labels.put(LABEL_PART_OF, ConfigService.getAppName());
        return labels;
    }

    // TODO: Move all possible stuff to pod fragment
    private Pod getBuilderPod(String name, Map<String, String> labels, String configFragment, boolean hasDockerConfigSecret) {
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

        List<VolumeMount> volumeMounts = new ArrayList<>();
        volumeMounts.add(new VolumeMountBuilder().withName(BUILD_SCRIPT_VOLUME_NAME).withMountPath("/karavan/builder").withReadOnly(true).build());
        if (hasDockerConfigSecret) {
            volumeMounts.add(new VolumeMountBuilder().withName(BUILD_DOCKER_CONFIG_SECRET).withMountPath("/karavan/.docker").withReadOnly(true).build());
        }
        if (privateKeyPath.isPresent()) {
            volumeMounts.add(new VolumeMountBuilder().withName(PRIVATE_KEY_SECRET_KEY).withMountPath("/karavan/.ssh/id_rsa").withSubPath("id_rsa").withReadOnly(true).build());
            volumeMounts.add(new VolumeMountBuilder().withName(KNOWN_HOSTS_SECRET_KEY).withMountPath("/karavan/.ssh/known_hosts").withSubPath("known_hosts").withReadOnly(true).build());
        }

        Pod pod = Serialization.unmarshal(configFragment, Pod.class);

        pod.getSpec().getContainers().get(0).getEnv().add(new EnvVarBuilder().withName(RUN_IN_BUILD_MODE).withValue("true").build());

        Container container = new ContainerBuilder()
                .withName(name)
                .withImage(devmodeImage)
                .withPorts(port)
                .withImagePullPolicy(devmodeImagePullPolicy.orElse("IfNotPresent"))
                .withEnv(pod.getSpec().getContainers().get(0).getEnv())
                .withCommand("/bin/sh", "-c", "/karavan/builder/build.sh")
                .withVolumeMounts(volumeMounts)
                .build();

        List<Volume> volumes = new ArrayList<>();
        volumes.add(new VolumeBuilder().withName(BUILD_SCRIPT_VOLUME_NAME)
                .withConfigMap(new ConfigMapVolumeSourceBuilder().withName(BUILD_SCRIPT_CONFIG_MAP).withItems(
                        new KeyToPathBuilder().withKey(BUILD_SCRIPT_FILENAME).withPath(BUILD_SCRIPT_FILENAME).build()
                ).withDefaultMode(511).build()).build());
        if (hasDockerConfigSecret) {
            volumes.add(new VolumeBuilder().withName(BUILD_DOCKER_CONFIG_SECRET)
                    .withSecret(new SecretVolumeSourceBuilder().withSecretName(BUILD_DOCKER_CONFIG_SECRET).withItems(
                            new KeyToPathBuilder().withKey(".dockerconfigjson").withPath("config.json").build()
                    ).withDefaultMode(511).build()).build());
        }
        if (privateKeyPath.isPresent()) {
            volumes.add(new VolumeBuilder().withName(PRIVATE_KEY_SECRET_KEY)
                    .withSecret(new SecretVolumeSourceBuilder().withSecretName(secretName).withItems(
                            new KeyToPathBuilder().withKey(PRIVATE_KEY_SECRET_KEY).withPath("id_rsa").build()
                    ).withDefaultMode(511).build()).build());
            volumes.add(new VolumeBuilder().withName(KNOWN_HOSTS_SECRET_KEY)
                    .withSecret(new SecretVolumeSourceBuilder().withSecretName(secretName).withItems(
                            new KeyToPathBuilder().withKey(KNOWN_HOSTS_SECRET_KEY).withPath("known_hosts").build()
                    ).withDefaultMode(511).build()).build());
        }

        PodSpec spec = new PodSpecBuilder()
                .withTerminationGracePeriodSeconds(0L)
                .withContainers(container)
                .withRestartPolicy("Never")
                .withServiceAccount(builderServiceAccount)
                .withVolumes(volumes)
                .build();

        return new PodBuilder()
                .withMetadata(meta)
                .withSpec(spec)
                .build();
    }

    public boolean hasDockerConfigSecret() {
        try (KubernetesClient client = kubernetesClient()) {
            return client.secrets().inNamespace(getNamespace()).withName(BUILD_DOCKER_CONFIG_SECRET).get() != null;
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return false;
        }
    }

    public Tuple2<LogWatch, KubernetesClient> getContainerLogWatch(String podName) {
        KubernetesClient client = kubernetesClient();
        LogWatch logWatch = client.pods().inNamespace(getNamespace()).withName(podName).tailingLines(100).watchLog();
        return Tuple2.of(logWatch, client);
    }

    public void rolloutDeployment(String name) {
        try (KubernetesClient client = kubernetesClient()) {
            client.apps().deployments().inNamespace(getNamespace()).withName(name).rolling().restart();
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void startDeployment(String resources, Map<String, String> labels) {
        try (KubernetesClient client = kubernetesClient()) {
            KubernetesList list = Serialization.unmarshal(resources, KubernetesList.class);
            list.getItems().forEach(item -> {
                if (labels != null ) {
                    item.getMetadata().getLabels().putAll(labels);
                    if (item instanceof Deployment deployment) {
                        deployment.getSpec().getTemplate().getMetadata().getLabels().putAll(labels);
                    }
                }
                client.resource(item).inNamespace(getNamespace()).serverSideApply();
            });
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public void deleteDeployment(String name) {
        try (KubernetesClient client = kubernetesClient()) {
            LOGGER.info("Delete deployment: " + name + " in the namespace: " + getNamespace());
            client.apps().deployments().inNamespace(getNamespace()).withName(name).delete();
            client.services().inNamespace(getNamespace()).withName(name).delete();
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

    public void runDevModeContainer(String projectId, Boolean verbose, Boolean compile, Map<String, String> files, String projectDevmodeImage, String deploymentFragment, Map<String, String> labels, Map<String, String> envVars) {
        Map<String, String> podLabels = new HashMap<>(labels);
        podLabels.putAll(getLabels(projectId, projectId, ContainerType.devmode));

        try (KubernetesClient client = kubernetesClient()) {
            if (devmodePVC.orElse(false)) {
                createPVC(projectId, labels);
            }
            Pod old = client.pods().inNamespace(getNamespace()).withName(projectId).get();
            if (old == null) {
                Pod pod = getDevModePod(projectId, verbose, compile, podLabels, projectDevmodeImage, deploymentFragment, envVars);
                Pod result = client.resource(pod).serverSideApply(); // important
                result = client.pods().inNamespace(getNamespace()).withName(projectId).waitUntilReady(30, TimeUnit.SECONDS);
                LOGGER.info("Pod " + result.getMetadata().getName() + " status " + result.getStatus());
                var copyFiles = copyFilesToContainer(result, files, "/karavan/code");
                LOGGER.info("Pod files copy result is " + copyFiles);
                var copyDone = copyFilesToContainer(result, Map.of(".karavan.done", "done"), "/tmp");
                LOGGER.info("Pod files copy done is " + copyDone);
                LOGGER.info("Pod pod " + result.getMetadata().getName());
            }
        }
        createService(projectId, podLabels);
    }

    private boolean copyFilesToContainer(Pod pod, Map<String, String> files, String dirName) {
        try (KubernetesClient client = kubernetesClient()) {
            String temp = codeService.saveProjectFilesInTemp(files);
            return client.pods().inNamespace(getNamespace())
                    .withName(pod.getMetadata().getName())
                    .dir(dirName)
                    .upload(Paths.get(temp));
        } catch (Exception e) {
            LOGGER.info("Error copying filed to devmode pod: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
            return false;
        }
    }

    public void deletePodAndService(String name, boolean deletePVC) {
        try (KubernetesClient client = kubernetesClient()) {
            LOGGER.info("Delete pod/service: " + name + " in the namespace: " + getNamespace());
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

    private Pod getDevModePod(String name, Boolean verbose, Boolean compile, Map<String, String> labels, String projectDevmodeImage, String deploymentFragment, Map<String, String> envVars) {

        Deployment deployment = Serialization.unmarshal(deploymentFragment, Deployment.class);
        PodSpec podSpec = null;
        try {
            podSpec = deployment.getSpec().getTemplate().getSpec();
        } catch (Exception ignored) {
            podSpec = new PodSpec();
        }
        List<VolumeMount> volumeMounts = new ArrayList<>();
        try {
            volumeMounts = podSpec.getContainers().get(0).getVolumeMounts();
        } catch (Exception ignored) {}

        Map<String, String> containerResources = CodeService.DEFAULT_CONTAINER_RESOURCES;
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

        List<EnvVar> environmentVariables = new ArrayList<>();
        try {
            environmentVariables = new ArrayList<>(podSpec.getContainers().get(0).getEnv());
        } catch (Exception ignored) {}

        for (Map.Entry<String, String> entry : envVars.entrySet()) {
            String k = entry.getKey();
            String v = entry.getValue();
            environmentVariables.add(new EnvVarBuilder().withName(k).withValue(v).build());
        }
        if (verbose) {
            environmentVariables.add(new EnvVarBuilder().withName(ENV_VAR_VERBOSE_OPTION_NAME).withValue(ENV_VAR_VERBOSE_OPTION_VALUE).build());
        }
        if (compile) {
            environmentVariables.add(new EnvVarBuilder().withName(RUN_IN_COMPILE_MODE).withValue("true").build());
        }

        Container container = new ContainerBuilder()
                .withName(name)
                .withImage(projectDevmodeImage != null ? projectDevmodeImage : devmodeImage)
                .withPorts(port)
                .withResources(resources)
                .withImagePullPolicy(devmodeImagePullPolicy.orElse("IfNotPresent"))
                .withEnv(environmentVariables)
                .withVolumeMounts(volumeMounts)
                .build();

        podSpec.setTerminationGracePeriodSeconds(0L);
        podSpec.setContainers(List.of(container));
        podSpec.setRestartPolicy("Never");
        podSpec.setServiceAccount(devModeServiceAccount);
        if (devmodePVC.orElse(false)) {
            podSpec.getVolumes().add(new VolumeBuilder().withName(name).withNewPersistentVolumeClaim(name, false).build());
        }

        return new PodBuilder()
                .withMetadata(meta)
                .withSpec(podSpec)
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
                        .withResources(new VolumeResourceRequirementsBuilder().withRequests(Map.of("storage", new Quantity("2Gi"))).build())
                        .withVolumeMode("Filesystem")
                        .withAccessModes("ReadWriteOnce")
                        .endSpec()
                        .build();
                client.resource(pvc).serverSideApply();
            }
        }
    }

    private void createService(String name, Map<String, String> labels) {
        try (KubernetesClient client = kubernetesClient()) {
            ServicePort http = new ServicePortBuilder()
                    .withName("http").withPort(80).withProtocol("TCP").withTargetPort(new IntOrString(8080)).build();
            ServicePort https = new ServicePortBuilder()
                    .withName("https").withPort(443).withProtocol("TCP").withTargetPort(new IntOrString(8080)).build();

            Service service = new ServiceBuilder()
                    .withNewMetadata()
                    .withName(name)
                    .withNamespace(getNamespace())
                    .withLabels(labels)
                    .endMetadata()
                    .withNewSpec()
                    .withType("ClusterIP")
                    .withPorts(http, https)
                    .withSelector(labels)
                    .endSpec()
                    .build();
            client.resource(service).serverSideApply();
        }
    }

    public void createSecret(String name, Map<String, String> data, Map<String, String> labels) {
        try (KubernetesClient client = kubernetesClient()) {
            Secret secret = new SecretBuilder()
                    .withNewMetadata()
                    .withName(name)
                    .withNamespace(getNamespace())
                    .withLabels(labels)
                    .endMetadata()
                    .withStringData(data)
                    .build();
            client.resource(secret).serverSideApply();
        }
    }

    public void createConfigMap(String name, Map<String, String> data, Map<String, String> labels) {
        try (KubernetesClient client = kubernetesClient()) {
            ConfigMap configMap = new ConfigMapBuilder()
                    .withNewMetadata()
                    .withName(name)
                    .withNamespace(getNamespace())
                    .withLabels(labels)
                    .endMetadata()
                    .withData(data)
                    .build();
            client.resource(configMap).serverSideApply();
        }
    }

    public Secret getSecret(String name) {
        try (KubernetesClient client = kubernetesClient()) {
            return client.secrets().inNamespace(getNamespace()).withName(name).get();
        }
    }

    public Secret getKaravanSecret() {
        try (KubernetesClient client = kubernetesClient()) {
            return client.secrets().inNamespace(getNamespace()).withName(secretName).get();
        }
    }

    public String getKaravanSecret(String key) {
        try (KubernetesClient client = kubernetesClient()) {
            Secret secret = client.secrets().inNamespace(getNamespace()).withName(secretName).get();
            Map<String, String> data = secret.getData();
            return decodeSecret(data.get(key));
        }
    }

    public String getSecret(String name, String key) {
        try (KubernetesClient client = kubernetesClient()) {
            Secret secret = client.secrets().inNamespace(getNamespace()).withName(name).get();
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

    public ConfigMap getConfigMap(String name) {
        try (KubernetesClient client = kubernetesClient()) {
            return client.configMaps().inNamespace(getNamespace()).withName(name).get();
        }
    }

    public boolean isOpenshift() {
        return isOpenShift.isPresent() && isOpenShift.get();
    }

    public String getNamespace() {
        if (namespace == null) {
            try (KubernetesClient client = kubernetesClient()) {
                namespace = LaunchMode.current().getProfileKey().equalsIgnoreCase("dev") ? "karavan" : client.getNamespace();
            }
        }
        return namespace;
    }

    public void updateSecret(Secret secret) {
        try (KubernetesClient client = kubernetesClient()) {
            client.resource(secret).update();
        }
    }

    public void updateConfigMap(ConfigMap configMap) {
        try (KubernetesClient client = kubernetesClient()) {
            client.resource(configMap).update();
        }
    }

    public String getSecretValue(String secretName, String secretKey) {
        return getSecret(secretName).getData().get(secretKey);
    }

    public void setSecretValue(String secretName, String secretKey, String value) {
        Secret secret = getSecret(secretName);
        if (secret != null) {
            secret.getData().put(secretKey, value);
            updateSecret(secret);
        }
    }

    public void createSecret(String secretName) {
        Secret secret = getSecret(secretName);
        if (secret == null) {
            createSecret(secretName, Map.of(), Map.of());
        }
    }

    public void deleteSecretValue(String secretName, String secretKey) {
        Secret secret = getSecret(secretName);
        if (secret != null) {
            secret.getData().remove(secretKey);
            updateSecret(secret);
        }
    }

    public List<KubernetesSecret> getSecrets() {
        List<KubernetesSecret> result = new ArrayList<>();
        try (KubernetesClient client = kubernetesClient()) {
            client.secrets().inNamespace(getNamespace()).list().getItems().forEach(secret -> {
                Map<String, String> data = new HashMap<>(secret.getData());
                data.replaceAll((s, s2) -> "");
                result.add(new KubernetesSecret(secret.getMetadata().getName(), data));
            });
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return result;
    }

    public void deleteSecret(String secretName) {
        Secret secret = getSecret(secretName);
        if (secret != null) {
            try (KubernetesClient client = kubernetesClient()) {
                client.secrets().inNamespace(getNamespace()).withName(secretName).delete();
            }
        }
    }

    public List<KubernetesConfigMap> getConfigMaps() {
        List<KubernetesConfigMap> result = new ArrayList<>();
        try (KubernetesClient client = kubernetesClient()) {
            client.configMaps().inNamespace(getNamespace()).list().getItems()
                    .forEach(secret -> result.add(new KubernetesConfigMap(secret.getMetadata().getName(), new HashMap<>(secret.getData()))));
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return result;
    }

    public void deleteConfigMap(String configMapName) {
        ConfigMap configMap = getConfigMap(configMapName);
        if (configMap != null) {
            try (KubernetesClient client = kubernetesClient()) {
                client.configMaps().inNamespace(getNamespace()).withName(configMapName).delete();
            }
        }
    }

    public void setConfigMapValue(String configMapName, String configMapKey, String value) {
        ConfigMap configMap = getConfigMap(configMapName);
        if (configMap != null) {
            configMap.getData().put(configMapKey, value);
            updateConfigMap(configMap);
        }
    }

    public void createConfigMap(String configMapName) {
        ConfigMap configMap = getConfigMap(configMapName);
        if (configMap == null) {
            createConfigMap(configMapName, Map.of(), Map.of());
        }
    }

    public void deleteConfigMapValue(String configMapName, String configMapKey) {
        ConfigMap configMap = getConfigMap(configMapName);
        if (configMap != null) {
            configMap.getData().remove(configMapKey);
            updateConfigMap(configMap);
        }
    }

    public String getCluster() {
        try (KubernetesClient client = kubernetesClient()) {
            return client.getMasterUrl().getHost();
        }
    }

    public String getEnvironment() {
        return environment;
    }
}
