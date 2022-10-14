package org.apache.camel.karavan.operator;

import io.fabric8.kubernetes.api.model.ServiceAccount;
import io.fabric8.kubernetes.api.model.ServiceAccountBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;

import javax.inject.Inject;
import java.util.Map;

public class KaravanServiceAccount extends CRUDKubernetesDependentResource<ServiceAccount, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanServiceAccount() {
        super(ServiceAccount.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public ServiceAccount desired(Karavan karavan, Context<Karavan> context) {
        return new ServiceAccountBuilder()
                .withNewMetadata()
                .withName(Constants.SERVICEACCOUNT_KARAVAN)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.SERVICEACCOUNT_KARAVAN, Map.of()))
                .endMetadata()
                .build();
    }

    @Override
    public ReconcileResult<ServiceAccount> reconcile(Karavan karavan, Context<Karavan> context) {
        ServiceAccount sa = getKubernetesClient().serviceAccounts().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.SERVICEACCOUNT_KARAVAN).get();
        if (sa == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(sa);
        }
    }
}
