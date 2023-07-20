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
package org.apache.camel.karavan.cli.resources;

import io.fabric8.kubernetes.api.model.rbac.*;
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanConfig;

public class KaravanRole {

    public static Role getRole(KaravanConfig config) {
        return new RoleBuilder()
                .withNewMetadata()
                .withName(Constants.ROLE_KARAVAN)
                .withNamespace(config.getNamespace())
                .endMetadata()
                .withRules(
                        new PolicyRuleBuilder().withApiGroups("").withResources("secrets", "configmaps").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("").withResources("persistentvolumes", "persistentvolumeclaims").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("tekton.dev").withResources("pipelineruns").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("").withResources("pods", "services", "replicationcontrollers").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("route.openshift.io").withResources("routes").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("apps").withResources("deployments").withVerbs("*").build()
                        )
                .build();
    }

    public static RoleBinding getRoleBinding(KaravanConfig config) {
        return new RoleBindingBuilder()
                .withNewMetadata()
                .withName(Constants.ROLEBINDING_KARAVAN)
                .withNamespace(config.getNamespace())
                .endMetadata()
                .withNewRoleRef("rbac.authorization.k8s.io", "Role", Constants.ROLE_KARAVAN)
                .withSubjects(new Subject("", "ServiceAccount", Constants.SERVICEACCOUNT_KARAVAN, config.getNamespace()))
                .build();
    }

    public static RoleBinding getRoleBindingView(KaravanConfig config) {
        return new RoleBindingBuilder()
                .withNewMetadata()
                .withName(Constants.ROLEBINDING_KARAVAN_VIEW)
                .withNamespace(config.getNamespace())
                .endMetadata()
                .withNewRoleRef("rbac.authorization.k8s.io", "ClusterRole", "view")
                .withSubjects(new Subject("", "ServiceAccount", Constants.SERVICEACCOUNT_KARAVAN, config.getNamespace()))
                .build();
    }

//    Pipeline roles

    public static Role getRoleDeployer(KaravanConfig config) {
        return new RoleBuilder()
                .withNewMetadata()
                .withName(Constants.ROLE_PIPELINE_DEPLOYER)
                .withNamespace(config.getNamespace())
                .endMetadata()
                .withRules(
                        new PolicyRuleBuilder().withApiGroups("").withResources("secrets", "configmaps", "services", "persistentvolumes", "persistentvolumeclaims").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("networking.k8s.io").withResources("ingresses").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("route.openshift.io").withResources( "routes").withVerbs("*").build(),
                        new PolicyRuleBuilder().withApiGroups("apps").withResources("deployments").withVerbs("*").build()
                )
                .build();
    }

    public static RoleBinding getRoleBindingPipeline(KaravanConfig config) {
        return new RoleBindingBuilder()
                .withNewMetadata()
                .withName(Constants.ROLEBINDING_PIPELINE_DEPLOYER)
                .withNamespace(config.getNamespace())
                .endMetadata()
                .withNewRoleRef("rbac.authorization.k8s.io", "Role", Constants.ROLE_PIPELINE_DEPLOYER)
                .withSubjects(new Subject("", "ServiceAccount", Constants.SERVICEACCOUNT_PIPELINE, config.getNamespace()))
                .build();
    }
}
