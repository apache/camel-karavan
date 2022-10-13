package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.rbac.RoleBinding;
import io.fabric8.kubernetes.api.model.rbac.RoleBindingBuilder;
import io.fabric8.kubernetes.api.model.rbac.Subject;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;

import javax.inject.Inject;
import java.util.Map;


public class KaravanRoleBindingView extends CRUDKubernetesDependentResource<RoleBinding, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanRoleBindingView() {
        super(RoleBinding.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public RoleBinding desired(Karavan karavan, Context<Karavan> context) {
        return new RoleBindingBuilder()
                .withNewMetadata()
                .withName(Constants.ROLEBINDING_KARAVAN_VIEW)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.ROLEBINDING_KARAVAN_VIEW, Map.of()))
                .endMetadata()
                .withNewRoleRef("rbac.authorization.k8s.io", "ClusterRole", "view")
                .withSubjects(new Subject("", "ServiceAccount", Constants.SERVICEACCOUNT_KARAVAN, karavan.getMetadata().getNamespace()))
                .build();
    }

    @Override
    public ReconcileResult<RoleBinding> reconcile(Karavan karavan, Context<Karavan> context) {
        RoleBinding role = getKubernetesClient().rbac().roleBindings().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.ROLEBINDING_KARAVAN_VIEW).get();
        if (role == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(role);
        }
    }
}
