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

import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.api.model.Route;
import io.fabric8.openshift.api.model.RouteBuilder;
import io.fabric8.openshift.api.model.RoutePort;
import io.fabric8.openshift.api.model.RouteTargetReferenceBuilder;
import io.fabric8.openshift.client.OpenShiftClient;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import io.javaoperatorsdk.operator.processing.dependent.workflow.Condition;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanRoute extends CRUDKubernetesDependentResource<Route, Karavan> implements Condition<Route, Karavan> {

    public KaravanRoute() {
        super(Route.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Route desired(Karavan karavan, Context<Karavan> context) {
        return new RouteBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(Constants.NAME, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withPort(new RoutePort(new IntOrString(8080)))
                .withTo(new RouteTargetReferenceBuilder().withKind("Service").withName(Constants.NAME).build())
                .endSpec()
                .build();
    }

    @Override
    public boolean isMet(Karavan karavan, Route route, Context<Karavan> context) {
        KubernetesClient kubernetesClient = new DefaultKubernetesClient();
        return kubernetesClient.isAdaptable(OpenShiftClient.class);
    }
}
