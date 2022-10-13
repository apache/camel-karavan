package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.EnvVarBuilder;
import io.fabric8.kubernetes.api.model.EnvVarSourceBuilder;
import io.fabric8.kubernetes.api.model.Secret;
import io.fabric8.kubernetes.api.model.rbac.Role;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.client.DefaultTektonClient;
import io.fabric8.tekton.pipeline.v1beta1.ParamSpecBuilder;
import io.fabric8.tekton.pipeline.v1beta1.StepBuilder;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import io.fabric8.tekton.pipeline.v1beta1.TaskBuilder;
import io.fabric8.tekton.pipeline.v1beta1.WorkspaceDeclaration;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.stream.Collectors;

public class KaravanTektonTask extends CRUDKubernetesDependentResource<Task, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.quarkus-build-image")
    String image;

    public KaravanTektonTask() {
        super(Task.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Task desired(Karavan karavan, Context<Karavan> context) {
        String script = getScript(karavan);
        return new TaskBuilder()
                .withNewMetadata()
                .withName(Constants.TASK_BUILD_QUARKUS)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.TASK_BUILD_QUARKUS, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withParams(new ParamSpecBuilder().withName("project").withType("string").withDescription("ProjectId").build())
                .withSteps(
                        new StepBuilder().withName("karavan-build-deploy")
                                .withScript(script)
                                .withImage(image + ":" + version)
                                .withEnv(
                                        new EnvVarBuilder().withName("PROJECTS_GIT_REPOSITORY").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("projects-git-repository").and().build()).build(),
                                        new EnvVarBuilder().withName("PROJECTS_GIT_USERNAME").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("projects-git-username").and().build()).build(),
                                        new EnvVarBuilder().withName("PROJECTS_GIT_PASSWORD").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("projects-git-password").and().build()).build(),
                                        new EnvVarBuilder().withName("PROJECTS_GIT_BRANCH").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("projects-git-branch").and().build()).build(),
                                        new EnvVarBuilder().withName("KAMELETS_GIT_REPOSITORY").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("kamelets-git-repository").and().build()).build(),
                                        new EnvVarBuilder().withName("KAMELETS_GIT_USERNAME").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("kamelets-git-username").and().build()).build(),
                                        new EnvVarBuilder().withName("KAMELETS_GIT_PASSWORD").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("kamelets-git-password").and().build()).build(),
                                        new EnvVarBuilder().withName("KAMELETS_GIT_BRANCH").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("kamelets-git-branch").and().build()).build(),
                                        new EnvVarBuilder().withName("IMAGE_REGISTRY").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("image-registry").withOptional(true).and().build()).build()
                                )
                                .build()
                )
                .withWorkspaces(
                        new WorkspaceDeclaration("Maven Cache", "/root/.m2", Constants.PVC_M2_CACHE, false, false),
                        new WorkspaceDeclaration("JBang Cache", "/jbang/.jbang/cache", Constants.PVC_JBANG_CACHE, false, false)
                )
                .endSpec()
                .build();
    }

    @Override
    public ReconcileResult<Task> reconcile(Karavan karavan, Context<Karavan> context) {
        Task task = new DefaultTektonClient(getKubernetesClient()).v1beta1().tasks().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.TASK_BUILD_QUARKUS).get();
        if (task == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(task);
        }
    }

    protected String getScript(Karavan karavan) {
        String imageRegistry = getImageRegistry(karavan);
        try {
            InputStream inputStream = KaravanTektonTask.class.getResourceAsStream("/karavan-quarkus-builder-script.sh");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines()
                    .map(s -> {
                        if (s.contains("quarkus.container-image.registry")) {
                            return s.replace("${IMAGE_REGISTRY}", imageRegistry);
                        } else {
                            return s;
                        }
                    })
                    .collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    protected String getImageRegistry(Karavan karavan) {
        String defaultValue = "${IMAGE_REGISTRY}";
        String key = "image-registry";
        try {
            KubernetesClient kubernetesClient = new DefaultKubernetesClient();
            boolean isOpenshift = kubernetesClient.isAdaptable(OpenShiftClient.class);
            Secret secret = kubernetesClient.secrets().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.NAME).get();
            if (secret != null && secret.getData().containsKey(key)) {
                return defaultValue;
            } else if (isOpenshift) {
                return "image-registry.openshift-image-registry.svc:5000";
            } else {
                return defaultValue;
            }
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
