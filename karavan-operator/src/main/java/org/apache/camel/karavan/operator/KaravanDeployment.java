package org.apache.camel.karavan.operator;

import io.fabric8.kubernetes.api.model.EnvVar;
import io.fabric8.kubernetes.api.model.EnvVarSourceBuilder;
import io.fabric8.kubernetes.api.model.ObjectFieldSelector;
import io.fabric8.kubernetes.api.model.OwnerReference;
import io.fabric8.kubernetes.api.model.OwnerReferenceBuilder;
import io.fabric8.kubernetes.api.model.PersistentVolumeClaimVolumeSource;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirementsBuilder;
import io.fabric8.kubernetes.api.model.SecretKeySelector;
import io.fabric8.kubernetes.api.model.VolumeBuilder;
import io.fabric8.kubernetes.api.model.VolumeMountBuilder;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class KaravanDeployment extends CRUDKubernetesDependentResource<Deployment, Karavan> {

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.image")
    String baseImage;

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanDeployment() {
        super(Deployment.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Deployment desired(Karavan karavan, Context<Karavan> context) {

        String image = baseImage + ":" + version;
        List<EnvVar> envVarList = new ArrayList<>();

        envVarList.add(
                new EnvVar("KUBERNETES_NAMESPACE", null, new EnvVarSourceBuilder().withFieldRef(new ObjectFieldSelector("","metadata.namespace")).build())
        );
        if (karavan.getSpec().getAuth() == "basic") {
            image = baseImage + "-basic:" + version;
            envVarList.add(
                    new EnvVar("MASTER_PASSWORD", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("master-password","karavan", false)).build())
            );
        } else if (karavan.getSpec().getAuth() == "oidc") {
            image = baseImage + "-oidc:" + version;
            envVarList.add(
                    new EnvVar("OIDC_FRONTEND_URL", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("oidc-frontend-url","karavan", false)).build())
            );
            envVarList.add(
                    new EnvVar("OIDC_SERVER_URL", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("oidc-server-url","karavan", false)).build())
            );
            envVarList.add(
                    new EnvVar("OIDC_SECRET", null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector("oidc-secret","karavan", false)).build())
            );
        }

        return new DeploymentBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.NAME, Map.of("app.kubernetes.io/runtime", "quarkus")))
                .withOwnerReferences(this.createOwnerReference(karavan))
                .endMetadata()

                .withNewSpec()
                .withReplicas(karavan.getSpec().getInstances())
                .withNewSelector()
                .addToMatchLabels(Map.of("app", Constants.NAME))
                .endSelector()

                .withNewTemplate()
                .withNewMetadata()
                .addToLabels(Map.of("app", Constants.NAME))
                .endMetadata()

                .withNewSpec()
                    .addNewContainer()
                        .withName(Constants.NAME)
                        .withImage(image)
                        .withImagePullPolicy("Always")
                        .withEnv(envVarList)
                        .addNewPort()
                            .withContainerPort(8080)
                            .withName(Constants.NAME)
                        .endPort()
                        .withResources(new ResourceRequirementsBuilder().withRequests(Map.of("memory", new Quantity("2048Mi"))).build())
                        .withVolumeMounts(new VolumeMountBuilder().withName("karavan-data").withMountPath("/deployments/karavan-data").build())
                    .endContainer()
                .withServiceAccount(Constants.NAME)
                .withVolumes(new VolumeBuilder().withName("karavan-data").withPersistentVolumeClaim(new PersistentVolumeClaimVolumeSource("karavan-data", false)).build())
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }


    private OwnerReference createOwnerReference(Karavan resource) {
        final var metadata = resource.getMetadata();
        return new OwnerReferenceBuilder()
                .withUid(metadata.getUid())
                .withApiVersion(resource.getApiVersion())
                .withName(metadata.getName())
                .withKind(resource.getKind())
                .build();
    }
}
