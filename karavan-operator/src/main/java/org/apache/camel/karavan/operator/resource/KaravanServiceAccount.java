package org.apache.camel.karavan.operator.resource;

import io.fabric8.kubernetes.api.model.ServiceAccount;
import io.fabric8.kubernetes.api.model.ServiceAccountBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanServiceAccount extends CRUDKubernetesDependentResource<ServiceAccount, Karavan> {

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
                .withLabels(Utils.getLabels(Constants.SERVICEACCOUNT_KARAVAN, Map.of()))
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
