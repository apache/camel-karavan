package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.rbac.PolicyRuleBuilder;
import io.fabric8.kubernetes.api.model.rbac.Role;
import io.fabric8.kubernetes.api.model.rbac.RoleBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;

import javax.inject.Inject;
import java.util.List;
import java.util.Map;


public class KaravanRole extends CRUDKubernetesDependentResource<Role, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanRole() {
        super(Role.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Role desired(Karavan karavan, Context<Karavan> context) {
        return new RoleBuilder()
                .withNewMetadata()
                .withName(Constants.ROLE_KARAVAN)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.ROLE_KARAVAN, Map.of()))
                .endMetadata()
                .withRules(
                        new PolicyRuleBuilder().withApiGroups("").withResources("secrets", "configmaps").withVerbs("get", "list").build(),
                        new PolicyRuleBuilder().withApiGroups("").withResources("persistentvolumes", "persistentvolumeclaims").withVerbs("get", "list", "watch").build(),
                        new PolicyRuleBuilder().withApiGroups("tekton.dev").withResources("pipelineruns").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("", "apps").withResources("deployments", "services", "routes", "replicationcontrollers").withVerbs("*").build()
                        )
                .build();
    }

    @Override
    public ReconcileResult<Role> reconcile(Karavan karavan, Context<Karavan> context) {
        Role role = getKubernetesClient().rbac().roles().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.ROLE_KARAVAN).get();
        if (role == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(role);
        }
    }
}
