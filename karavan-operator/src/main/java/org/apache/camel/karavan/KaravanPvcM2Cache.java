package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.PersistentVolumeClaim;
import io.fabric8.kubernetes.api.model.PersistentVolumeClaimBuilder;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirementsBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;

import javax.inject.Inject;
import java.util.Map;


public class KaravanPvcM2Cache extends CRUDKubernetesDependentResource<PersistentVolumeClaim, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanPvcM2Cache() {
        super(PersistentVolumeClaim.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public PersistentVolumeClaim desired(Karavan karavan, Context<Karavan> context) {
        return new PersistentVolumeClaimBuilder()
                .withNewMetadata()
                .withName(Constants.PVC_M2_CACHE)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.PVC_M2_CACHE, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withResources(new ResourceRequirementsBuilder().withRequests(Map.of("storage", new Quantity("10Gi"))).build())
                .withVolumeMode("Filesystem")
                .withAccessModes("ReadWriteOnce")
                .endSpec()
                .build();
    }

    @Override
    public ReconcileResult<PersistentVolumeClaim> reconcile(Karavan karavan, Context<Karavan> context) {
        PersistentVolumeClaim pvc = getKubernetesClient().persistentVolumeClaims().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.PVC_M2_CACHE).get();
        if (pvc == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(pvc);
        }
    }
}
