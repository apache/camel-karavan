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

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanCommand;

import java.util.Map;

public class Nexus {

    public static final String NEXUS_NAME = "nexus";
    public static final String NEXUS_IMAGE = "sonatype/nexus3";
    public static final String NEXUS_DATA = "nexus-data";
    public static final int NEXUS_PORT = 8081;

    public static Service getService(KaravanCommand config) {

        ServicePortBuilder portBuilder = new ServicePortBuilder()
                .withPort(80)
                .withProtocol("TCP")
                .withTargetPort(new IntOrString(NEXUS_PORT));

        return new ServiceBuilder()
                .withNewMetadata()
                .withName(NEXUS_NAME)
                .withNamespace(config.getNamespace())
                .endMetadata()
                .withNewSpec()
                .withSelector(Map.of("app", NEXUS_NAME))
                .withPorts(portBuilder.build())
                .endSpec()
                .build();
    }

    public static Deployment getDeployment (KaravanCommand config) {
        return new DeploymentBuilder()
                .withNewMetadata()
                .withName(NEXUS_NAME)
                .withNamespace(config.getNamespace())
                .endMetadata()

                .withNewSpec()
                .withNewSelector()
                .addToMatchLabels(Map.of("app", NEXUS_NAME))
                .endSelector()

                .withNewTemplate()
                .withNewMetadata()
                .addToLabels(Map.of("app", NEXUS_NAME))
                .endMetadata()

                .withNewSpec()
                    .addNewContainer()
                        .withName(NEXUS_NAME)
                        .withImage(NEXUS_IMAGE)
                        .withImagePullPolicy("Always")
                        .addNewPort()
                            .withContainerPort(NEXUS_PORT)
                            .withName("8081-tcp")
                        .endPort()
                        .withVolumeMounts(
                                new VolumeMountBuilder().withName(NEXUS_DATA).withMountPath("/" + NEXUS_DATA).build()
                        )
                    .withLivenessProbe(
                            new ProbeBuilder()
                                    .withHttpGet(new HTTPGetActionBuilder()
                                            .withPath("/service/rest/v1/status")
                                            .withPort(new IntOrString(NEXUS_PORT))
                                            .build())
                                    .withInitialDelaySeconds(90)
                                    .withPeriodSeconds(3)
                                    .build())
                    .withReadinessProbe(
                            new ProbeBuilder()
                                    .withHttpGet(new HTTPGetActionBuilder()
                                            .withPath("/service/rest/v1/status")
                                            .withPort(new IntOrString(NEXUS_PORT))
                                            .build())
                                    .withInitialDelaySeconds(90)
                                    .withPeriodSeconds(3)
                                    .build())
                    .endContainer()
                .withServiceAccount(Constants.NAME)
                .withVolumes(
                        new VolumeBuilder().withName(NEXUS_DATA).withEmptyDir(new EmptyDirVolumeSource()).build()
                )
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }

}
