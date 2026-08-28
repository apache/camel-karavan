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
import org.apache.camel.karavan.cache.ContainerType;
import org.apache.camel.karavan.model.KubernetesConfigMap;
import org.apache.camel.karavan.model.KubernetesSecret;
import org.apache.camel.karavan.model.PodEvent;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.service.CodeService.CAMEL_OBSERVABILITY_PORT;

@Default
@ApplicationScoped
public class KubernetesService {

    private static final Logger LOGGER = Logger.getLogger(KubernetesService.class.getName());

    // Kinds accepted in the user editable kubernetes.yaml resource file of a project.
    // Anything else (Pod, DaemonSet, ClusterRoleBinding, ...) is rejected before reaching the API server.
    public static final String DEFAULT_ALLOWED_DEPLOYMENT_KINDS = "Deployment,Service,ConfigMap,Secret";

    public static final Map<String, Quantity> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", new Quantity("256Mi"),
            "requests.cpu", new Quantity("500m"),
            "limits.memory", new Quantity("2048Mi"),
            "limits.cpu", new Quantity("2000m")
    );

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

    // Extend only together with the matching Kubernetes RBAC permissions, e.g. "Route" on OpenShift
    @ConfigProperty(name = "karavan.deployment.allowed-kinds", defaultValue = DEFAULT_ALLOWED_DEPLOYMENT_KINDS)
    String allowedDeploymentKinds;

    private Set<String> getAllowedDeploymentKinds() {
        return Arrays.stream(allowedDeploymentKinds.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
    }

    public void runBuildProject(String projectId, String podFragment, Map<String, String> envVars) {
        try (KubernetesClient client = kubernetesClient()) {
            String containerName = projectId + BUILDER_SUFFIX;
            Map<String, String> labels = getLabels(containerName, projectId, ContainerType.build);

//        Delete old build pod
            Pod old = client.pods().inNamespace(getNamespace()).withName(containerName).get();
            if (old != null) {
                client.resource(old).delete().wait(60000);
            }
            boolean hasDockerConfigSecret = hasDockerConfigSecret();
            Pod pod = getBuilderPod(containerName, labels, podFragment, hasDockerConfigSecret, envVars);
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

    private Pod getBuilderPod(String name, Map<String, String> labels, String configFragment, boolean hasDockerConfigSecret, Map<String, String> envVars) {
        ObjectMeta meta = new ObjectMetaBuilder()
                .withName(name)
                .withLabels(labels)
                .withNamespace(getNamespace())
                .build();

        ContainerPort port = new ContainerPortBuilder().withContainerPort(8080).withName("http").withProtocol("TCP").build();
        ContainerPort observabilityPort = new ContainerPortBuilder().withContainerPort(CAMEL_OBSERVABILITY_PORT).withName("observability").withProtocol("TCP").build();

        List<VolumeMount> volumeMounts = new ArrayList<>();
        if (hasDockerConfigSecret) {
            volumeMounts.add(new VolumeMountBuilder().withName(BUILD_DOCKER_CONFIG_SECRET).withMountPath("/karavan/.docker").withReadOnly(true).build());
        }
        if (privateKeyPath.isPresent()) {
            volumeMounts.add(new VolumeMountBuilder().withName(PRIVATE_KEY_SECRET_KEY).withMountPath("/karavan/.ssh/id_rsa").withSubPath("id_rsa").withReadOnly(true).build());
            volumeMounts.add(new VolumeMountBuilder().withName(KNOWN_HOSTS_SECRET_KEY).withMountPath("/karavan/.ssh/known_hosts").withSubPath("known_hosts").withReadOnly(true).build());
        }

        Pod pod = Serialization.unmarshal(configFragment, Pod.class);

        pod.getSpec().getContainers().getFirst().getEnv().add(new EnvVarBuilder().withName(ENV_VAR_RUN_IN_BUILD_MODE).withValue("true").build());
        envVars.forEach((key, value) -> pod.getSpec().getContainers().getFirst().getEnv().add(new EnvVarBuilder().withName(key).withValue(value).build()));

        Container container = new ContainerBuilder()
                .withName(name)
                .withImage(devmodeImage)
                .withPorts(port, observabilityPort)
                .withImagePullPolicy(devmodeImagePullPolicy.orElse("IfNotPresent"))
                .withEnv(pod.getSpec().getContainers().getFirst().getEnv())
//                .withCommand("/bin/sh", "-c", "/karavan/builder/build.sh")
                .withVolumeMounts(volumeMounts)
                .build();

        List<Volume> volumes = new ArrayList<>();
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
        try {
            // Wait up to 30 seconds for the pod to leave the 'Pending' phase (ContainerCreating)
            client.pods().inNamespace(getNamespace()).withName(podName)
                    .waitUntilCondition(pod -> pod != null &&
                                    ("Running".equals(pod.getStatus().getPhase()) ||
                                            "Succeeded".equals(pod.getStatus().getPhase()) ||
                                            "Failed".equals(pod.getStatus().getPhase())),
                            30, TimeUnit.SECONDS);
        } catch (Exception e) {
            LOGGER.warn("Timeout or error waiting for pod " + podName + " to become ready: " + e.getMessage());
            // Proceeding anyway so we don't completely block log attempts if the condition logic fails
        }

        LogWatch logWatch = client.pods().inNamespace(getNamespace()).withName(podName).tailingLines(100).watchLog();
        return Tuple2.of(logWatch, client);
    }

    public void rolloutDeployment(String name) {
        try (KubernetesClient client = kubernetesClient()) {
            client.apps().deployments().inNamespace(getNamespace()).withName(name).rolling().restart();
        } catch (Exception ex) {
            LOGGER.error("Failed to apply Kubernetes resources", ex);
        }
    }

    public void startDeployment(String resources, Map<String, String> labels) {
        KubernetesList list;
        try {
            list = Serialization.unmarshal(resources, KubernetesList.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Kubernetes resources: " + e.getMessage());
        }
        if (list == null || list.getItems() == null || list.getItems().isEmpty()) {
            throw new IllegalArgumentException("No Kubernetes resources to apply");
        }
        // The resource file is user editable, so it can not be trusted: only the resource kinds
        // an integration is made of are accepted, and pod specs must not ask for host level access.
        Set<String> allowedKinds = getAllowedDeploymentKinds();
        list.getItems().forEach(item -> validateDeploymentResource(item, allowedKinds));
        try (KubernetesClient client = kubernetesClient()) {
            list.getItems().forEach(item -> {
                if (labels != null) {
                    putLabels(item.getMetadata(), labels);
                    if (item instanceof Deployment deployment && deployment.getSpec() != null && deployment.getSpec().getTemplate() != null) {
                        var template = deployment.getSpec().getTemplate();
                        if (template.getMetadata() == null) {
                            template.setMetadata(new ObjectMeta());
                        }
                        putLabels(template.getMetadata(), labels);
                    }
                }
                // Pin the namespace: a resource must never be applied outside of Karavan's namespace
                item.getMetadata().setNamespace(getNamespace());
                client.resource(item).inNamespace(getNamespace()).serverSideApply();
            });
        } catch (Exception ex) {
            LOGGER.error("Failed to apply Kubernetes resources", ex);
        }
    }

    private static void putLabels(ObjectMeta meta, Map<String, String> labels) {
        if (meta.getLabels() == null) {
            meta.setLabels(new HashMap<>());
        }
        meta.getLabels().putAll(labels);
    }

    static void validateDeploymentResource(HasMetadata item, Set<String> allowedKinds) {
        String kind = item.getKind();
        if (!allowedKinds.contains(kind)) {
            throw new IllegalArgumentException("Resource kind is not allowed: " + kind
                    + ". Allowed kinds: " + String.join(", ", allowedKinds));
        }
        if (item.getMetadata() == null || item.getMetadata().getName() == null) {
            throw new IllegalArgumentException("Resource of kind " + kind + " has no metadata.name");
        }
        if (item instanceof Deployment deployment && deployment.getSpec() != null && deployment.getSpec().getTemplate() != null) {
            validatePodSpec(deployment.getSpec().getTemplate().getSpec());
        }
    }

    private static void validatePodSpec(PodSpec spec) {
        if (spec == null) {
            return;
        }
        if (Boolean.TRUE.equals(spec.getHostNetwork())) {
            throw new IllegalArgumentException("hostNetwork is not allowed");
        }
        if (Boolean.TRUE.equals(spec.getHostPID())) {
            throw new IllegalArgumentException("hostPID is not allowed");
        }
        if (Boolean.TRUE.equals(spec.getHostIPC())) {
            throw new IllegalArgumentException("hostIPC is not allowed");
        }
        if (spec.getVolumes() != null) {
            spec.getVolumes().stream().filter(v -> v.getHostPath() != null).findFirst().ifPresent(v -> {
                throw new IllegalArgumentException("hostPath volume is not allowed: " + v.getName());
            });
        }
        Stream.concat(
                spec.getContainers() != null ? spec.getContainers().stream() : Stream.empty(),
                spec.getInitContainers() != null ? spec.getInitContainers().stream() : Stream.empty()
        ).forEach(KubernetesService::validateContainer);
    }

    private static void validateContainer(Container container) {
        SecurityContext securityContext = container.getSecurityContext();
        if (securityContext != null) {
            if (Boolean.TRUE.equals(securityContext.getPrivileged())) {
                throw new IllegalArgumentException("privileged container is not allowed: " + container.getName());
            }
            if (Boolean.TRUE.equals(securityContext.getAllowPrivilegeEscalation())) {
                throw new IllegalArgumentException("allowPrivilegeEscalation is not allowed: " + container.getName());
            }
            if (securityContext.getCapabilities() != null && securityContext.getCapabilities().getAdd() != null
                    && !securityContext.getCapabilities().getAdd().isEmpty()) {
                throw new IllegalArgumentException("adding Linux capabilities is not allowed: " + container.getName());
            }
        }
        if (container.getPorts() != null) {
            container.getPorts().stream().filter(p -> p.getHostPort() != null).findFirst().ifPresent(p -> {
                throw new IllegalArgumentException("hostPort is not allowed: " + container.getName());
            });
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

    public void runDevModeContainer(String projectId, Boolean verbose, Boolean compile, String projectDevmodeImage, String deploymentFragment, Map<String, String> labels, Map<String, String> envVars) {
        Map<String, String> podLabels = new HashMap<>(labels);
        podLabels.putAll(getLabels(projectId, projectId, ContainerType.devmode));

        try (KubernetesClient client = kubernetesClient()) {
            if (devmodePVC.orElse(false)) {
                createPVC(projectId, labels);
            }
            Pod old = client.pods().inNamespace(getNamespace()).withName(projectId).get();
            if (old == null) {
                Pod pod = getDevModePod(projectId, verbose, compile, podLabels, projectDevmodeImage, deploymentFragment, envVars);
                client.resource(pod).serverSideApply();
            }
        }
        createService(projectId, podLabels);
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
    private Map<String, Quantity> getResourceLimits(PodSpec podSpec) {
        try {
            return podSpec.getContainers().get(0).getResources().getLimits();
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private Map<String, Quantity> getResourceRequests(PodSpec podSpec) {
        try {
            return podSpec.getContainers().get(0).getResources().getRequests();
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public ResourceRequirements getResourceRequirements(PodSpec podSpec) {
        var limits = getResourceLimits(podSpec);
        var requests = getResourceRequests(podSpec);
        return new ResourceRequirementsBuilder()
                .addToRequests("cpu", requests.getOrDefault("cpu", DEFAULT_CONTAINER_RESOURCES.get("requests.cpu")))
                .addToRequests("memory", requests.getOrDefault("memory", DEFAULT_CONTAINER_RESOURCES.get("requests.memory")))
                .addToLimits("cpu", limits.getOrDefault("cpu", DEFAULT_CONTAINER_RESOURCES.get("limits.cpu")))
                .addToLimits("memory", limits.getOrDefault("memory", DEFAULT_CONTAINER_RESOURCES.get("limits.memory")))
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
            volumeMounts = podSpec.getContainers().getFirst().getVolumeMounts();
        } catch (Exception ignored) {}

        ResourceRequirements resources = getResourceRequirements(podSpec);

        ObjectMeta meta = new ObjectMetaBuilder()
                .withName(name)
                .withLabels(labels)
                .withNamespace(getNamespace())
                .build();

        ContainerPort port = new ContainerPortBuilder().withContainerPort(8080).withName("http").withProtocol("TCP").build();
        ContainerPort observabilityPort = new ContainerPortBuilder().withContainerPort(CAMEL_OBSERVABILITY_PORT).withName("observability").withProtocol("TCP").build();

        List<EnvVar> environmentVariables = new ArrayList<>();
        try {
            environmentVariables = new ArrayList<>(podSpec.getContainers().getFirst().getEnv());
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
            environmentVariables.add(new EnvVarBuilder().withName(ENV_VAR_RUN_IN_COMPILE_MODE).withValue("true").build());
        }

        Container container = new ContainerBuilder()
                .withName(name)
                .withImage(projectDevmodeImage != null ? projectDevmodeImage : devmodeImage)
                .withPorts(port, observabilityPort)
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

    public List<PodEvent> getPodEvents(String containerName) {
        List<PodEvent> list = new ArrayList<>();
        try (KubernetesClient client = kubernetesClient()) {
            client.events().v1().events().inNamespace(getNamespace())
                    .withField("regarding.kind", "Pod")
                    .withField("regarding.name", containerName)
                    .list(new ListOptionsBuilder().withLimit(100L).build())
                    .getItems().forEach(e -> {
                        String lastTimestamp;
                        Integer count;

                        if (e.getSeries() != null && e.getSeries().getLastObservedTime() != null) {
                            // 1. Best case: Event has repeated, use the new series time
                            lastTimestamp = e.getSeries().getLastObservedTime().getTime();
                            count = e.getSeries().getCount();
                        } else if (e.getEventTime() != null) {
                            // 2. Event happened once: Use the single-occurrence time
                            lastTimestamp = e.getEventTime().getTime();
                            count = 1;
                        } else if (e.getDeprecatedLastTimestamp() != null) {
                            // 3. Fallback: Legacy compatibility field
                            lastTimestamp = e.getDeprecatedLastTimestamp();
                            count = e.getDeprecatedCount();
                        } else {
                            lastTimestamp = "Unknown";
                            count = 0;
                        }
                        PodEvent pe = new PodEvent(
                                e.getMetadata().getName(),
                                e.getRegarding().getName(),
                                e.getReason(),
                                e.getNote(),
                                e.getType(),
                                count,
                                lastTimestamp);
                        list.add(pe);
                    });
        } catch (Exception e) {
            LOGGER.error("Error getting Pod Events" + e.getMessage());
        }
        return list;
    }
}
