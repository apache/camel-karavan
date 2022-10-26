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

import io.fabric8.kubernetes.api.model.rbac.RoleBinding;
import io.fabric8.kubernetes.api.model.rbac.RoleBindingBuilder;
import io.fabric8.kubernetes.api.model.rbac.Subject;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;

public class PipelineRoleBinding extends CRUDKubernetesDependentResource<RoleBinding, Karavan> {

    public PipelineRoleBinding() {
        super(RoleBinding.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public RoleBinding desired(Karavan karavan, Context<Karavan> context) {
        return new RoleBindingBuilder()
                .withNewMetadata()
                .withName(Constants.ROLEBINDING_PIPELINE_DEPLOYER)
                .withNamespace(karavan.getMetadata().getNamespace())
                .endMetadata()
                .withNewRoleRef("rbac.authorization.k8s.io", "Role", Constants.ROLE_PIPELINE_DEPLOYER)
                .withSubjects(new Subject("", "ServiceAccount", Constants.SERVICEACCOUNT_PIPELINE, karavan.getMetadata().getNamespace()))
                .build();
    }

    @Override
    public ReconcileResult<RoleBinding> reconcile(Karavan karavan, Context<Karavan> context) {
        RoleBinding role = getKubernetesClient().rbac().roleBindings().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.ROLEBINDING_PIPELINE_DEPLOYER).get();
        if (role == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(role);
        }
    }
}
