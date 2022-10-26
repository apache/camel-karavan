/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.operator.resource;

import io.fabric8.kubernetes.api.model.rbac.PolicyRuleBuilder;
import io.fabric8.kubernetes.api.model.rbac.Role;
import io.fabric8.kubernetes.api.model.rbac.RoleBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;

public class PipelineRoleDeployer extends CRUDKubernetesDependentResource<Role, Karavan> {

    public PipelineRoleDeployer() {
        super(Role.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Role desired(Karavan karavan, Context<Karavan> context) {
        return new RoleBuilder()
                .withNewMetadata()
                .withName(Constants.ROLE_PIPELINE_DEPLOYER)
                .withNamespace(karavan.getMetadata().getNamespace())
                .endMetadata()
                .withRules(
                        new PolicyRuleBuilder().withApiGroups("").withResources("secrets", "configmaps", "services", "persistentvolumes", "persistentvolumeclaims").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("networking.k8s.io").withResources("ingresses").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("route.openshift.io").withResources( "routes").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("apps").withResources("deployments").withVerbs("*").build()
                        )
                .build();
    }

    @Override
    public ReconcileResult<Role> reconcile(Karavan karavan, Context<Karavan> context) {
        Role role = getKubernetesClient().rbac().roles().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.ROLE_PIPELINE_DEPLOYER).get();
        if (role == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(role);
        }
    }
}
