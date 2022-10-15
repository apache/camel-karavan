package org.apache.camel.karavan.operator.resource;

import io.fabric8.kubernetes.api.model.PersistentVolumeClaim;
import io.fabric8.kubernetes.api.model.PersistentVolumeClaimBuilder;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirementsBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanPvcJbang extends CRUDKubernetesDependentResource<PersistentVolumeClaim, Karavan> {

    public KaravanPvcJbang() {
        super(PersistentVolumeClaim.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public PersistentVolumeClaim desired(Karavan karavan, Context<Karavan> context) {
        return new PersistentVolumeClaimBuilder()
                .withNewMetadata()
                .withName(Constants.PVC_JBANG_CACHE)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(Constants.PVC_JBANG_CACHE, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withResources(new ResourceRequirementsBuilder().withRequests(Map.of("storage", new Quantity("2Gi"))).build())
                .withVolumeMode("Filesystem")
                .withAccessModes("ReadWriteOnce")
                .endSpec()
                .build();
    }

    public ReconcileResult<PersistentVolumeClaim> reconcile(Karavan karavan, Context<Karavan> context) {
        PersistentVolumeClaim pvc = getKubernetesClient().persistentVolumeClaims().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.PVC_JBANG_CACHE).get();
        if (pvc == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(pvc);
        }
    }
}
