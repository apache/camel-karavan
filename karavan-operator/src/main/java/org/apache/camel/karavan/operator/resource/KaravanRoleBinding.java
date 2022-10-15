package org.apache.camel.karavan.operator.resource;

import io.fabric8.kubernetes.api.model.rbac.RoleBinding;
import io.fabric8.kubernetes.api.model.rbac.RoleBindingBuilder;
import io.fabric8.kubernetes.api.model.rbac.Subject;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanRoleBinding extends CRUDKubernetesDependentResource<RoleBinding, Karavan> {

    public KaravanRoleBinding() {
        super(RoleBinding.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public RoleBinding desired(Karavan karavan, Context<Karavan> context) {
        return new RoleBindingBuilder()
                .withNewMetadata()
                .withName(Constants.ROLEBINDING_KARAVAN)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(Constants.ROLEBINDING_KARAVAN, Map.of()))
                .endMetadata()
                .withNewRoleRef("rbac.authorization.k8s.io", "Role", Constants.ROLE_KARAVAN)
                .withSubjects(new Subject("", "ServiceAccount", Constants.SERVICEACCOUNT_KARAVAN, karavan.getMetadata().getNamespace()))
                .build();
    }

    @Override
    public ReconcileResult<RoleBinding> reconcile(Karavan karavan, Context<Karavan> context) {
        RoleBinding role = getKubernetesClient().rbac().roleBindings().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.ROLEBINDING_KARAVAN).get();
        if (role == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(role);
        }
    }
}
