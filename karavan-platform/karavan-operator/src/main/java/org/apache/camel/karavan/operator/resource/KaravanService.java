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
import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.ServicePortBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanService extends CRUDKubernetesDependentResource<Service, Karavan> {

    public KaravanService() {
        super(Service.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Service desired(Karavan karavan, Context<Karavan> context) {

        ServicePortBuilder portBuilder = new ServicePortBuilder()
                .withName("http").withPort(80).withProtocol("TCP").withTargetPort(new IntOrString(8080));
        if (karavan.getSpec().getNodePort() > 0) {
            portBuilder.withNodePort(karavan.getSpec().getNodePort());
        }

        return new ServiceBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(Constants.NAME, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withType(karavan.getSpec().getNodePort() > 0 ? "NodePort" : "ClusterIP")
                .withPorts(portBuilder.build())
                .withSelector(Map.of("app", Constants.NAME))
                .endSpec()
                .build();
    }
}
