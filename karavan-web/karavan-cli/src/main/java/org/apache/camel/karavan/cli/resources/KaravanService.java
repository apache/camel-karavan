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

import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.ServicePortBuilder;
import io.fabric8.openshift.api.model.Route;
import io.fabric8.openshift.api.model.RouteBuilder;
import io.fabric8.openshift.api.model.RoutePort;
import io.fabric8.openshift.api.model.RouteTargetReferenceBuilder;
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanConfig;
import org.apache.camel.karavan.cli.ResourceUtils;

import java.util.Map;

public class KaravanService {

    public static Service getService(KaravanConfig config) {

        ServicePortBuilder portBuilder = new ServicePortBuilder()
                .withName("http").withPort(80).withProtocol("TCP").withTargetPort(new IntOrString(8080));
        if (config.getNodePort() > 0) {
            portBuilder.withNodePort(config.getNodePort());
        }

        return new ServiceBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(Constants.NAME, config.getVersion(), Map.of()))
                .endMetadata()
                .withNewSpec()
                .withType(config.getNodePort() > 0 ? "NodePort" : "ClusterIP")
                .withPorts(portBuilder.build())
                .withSelector(Map.of("app", Constants.NAME))
                .endSpec()
                .build();
    }

    public static Route getRoute(KaravanConfig config) {
        return new RouteBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(Constants.NAME, config.getVersion(), Map.of()))
                .endMetadata()
                .withNewSpec()
                .withPort(new RoutePort(new IntOrString(8080)))
                .withTo(new RouteTargetReferenceBuilder().withKind("Service").withName(Constants.NAME).build())
                .endSpec()
                .build();
    }

}
