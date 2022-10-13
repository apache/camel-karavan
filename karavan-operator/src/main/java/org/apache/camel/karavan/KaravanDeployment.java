package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.EnvVarSourceBuilder;
import io.fabric8.kubernetes.api.model.ObjectFieldSelectorBuilder;
import io.fabric8.kubernetes.api.model.OwnerReference;
import io.fabric8.kubernetes.api.model.OwnerReferenceBuilder;
import io.fabric8.kubernetes.api.model.PersistentVolumeClaimVolumeSource;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirementsBuilder;
import io.fabric8.kubernetes.api.model.VolumeBuilder;
import io.fabric8.kubernetes.api.model.VolumeMountBuilder;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import java.util.Map;

public class KaravanDeployment extends CRUDKubernetesDependentResource<Deployment, Karavan> {

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.image")
    String image;

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanDeployment() {
        super(Deployment.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Deployment desired(Karavan karavan, Context<Karavan> context) {
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
//                        .withImage(getImageName(karavan))
                        .withImage("ghcr.io/apache/camel-karavan:3.18.4") // TODO: set correct version after
                        .withImagePullPolicy("Always")
                        .addNewEnv()
                            .withName("KUBERNETES_NAMESPACE")
                            .withValueFrom(new EnvVarSourceBuilder().withFieldRef(new ObjectFieldSelectorBuilder().withFieldPath("metadata.namespace").build()).build())
                        .endEnv()
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

    private String getImageName(Karavan karavan) {
        String auth = karavan.getSpec().getAuth();
        switch (auth){
            case "oidc": return image + "-oidc:" + version;
            case "basic": return image + "-basic:" + version;
            default: return image + ":" + version;
        }
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
