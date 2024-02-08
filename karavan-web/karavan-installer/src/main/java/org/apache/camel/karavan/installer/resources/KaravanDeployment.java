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
package org.apache.camel.karavan.installer.resources;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import org.apache.camel.karavan.installer.Constants;
import org.apache.camel.karavan.installer.KaravanCommand;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.apache.camel.karavan.installer.Constants.*;

public class KaravanDeployment {

    public static Deployment getDeployment(KaravanCommand config) {

        String baseImage = config.getBaseImage();

        String image = baseImage + ":" + config.getVersion();
        List<EnvVar> envVarList = new ArrayList<>();

        String devModeImage = config.getDevmodeImage().contains(":")
                ? config.getDevmodeImage()
                : config.getDevmodeImage() + ":" + config.getVersion();

        envVarList.add(
                new EnvVar("KARAVAN_ENVIRONMENT", config.getEnvironment(), null)
        );
        envVarList.add(
                new EnvVar("KARAVAN_CONTAINER_STATUS_INTERVAL", "disabled", null)
        );
        envVarList.add(
                new EnvVar("KARAVAN_CONTAINER_STATISTICS_INTERVAL", "disabled", null)
        );
        envVarList.add(
                new EnvVar("KARAVAN_CAMEL_STATUS_INTERVAL", "3s", null)
        );
        envVarList.add(
                new EnvVar("KARAVAN_DEVMODE_IMAGE", devModeImage, null)
        );
        envVarList.add(
                new EnvVar("KUBERNETES_NAMESPACE", null, new EnvVarSourceBuilder().withFieldRef(new ObjectFieldSelector("", "metadata.namespace")).build())
        );
        String auth = config.getAuth();
        if (Objects.equals(auth, "oidc")) {
            image = baseImage + ":" + config.getVersion() + "-oidc";
            envVarList.add(new EnvVar(KEYCLOAK_URL, null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector(KEYCLOAK_URL, NAME, false)).build()));
            envVarList.add(new EnvVar(KEYCLOAK_REALM, null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector(KEYCLOAK_REALM, NAME, false)).build()));
            envVarList.add(new EnvVar(KEYCLOAK_FRONTEND_CLIENT_ID, null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector(KEYCLOAK_FRONTEND_CLIENT_ID, NAME, false)).build()));
            envVarList.add(new EnvVar(KEYCLOAK_BACKEND_CLIENT_ID, null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector(KEYCLOAK_BACKEND_CLIENT_ID, NAME, false)).build()));
            envVarList.add(new EnvVar(KEYCLOAK_BACKEND_SECRET, null, new EnvVarSourceBuilder().withSecretKeyRef(new SecretKeySelector(KEYCLOAK_BACKEND_SECRET, NAME, false)).build()));
        }

        if (config.isInstallGitea()) {
            envVarList.add(
                    new EnvVar("KARAVAN_GIT_INSTALL_GITEA", "true", null)
            );
        }

        Map<String, String> labels = config.getLabels();
        labels.put("app.kubernetes.io/runtime", "quarkus");

        return new DeploymentBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(config.getNamespace())
                .withLabels(labels)
                .endMetadata()

                .withNewSpec()
                .withReplicas(1)
                .withNewSelector()
                .addToMatchLabels(Map.of("app", Constants.NAME))
                .endSelector()

                .withNewTemplate()
                .withNewMetadata()
                .addToLabels(Map.of("app", Constants.NAME))
                .endMetadata()

                .withNewSpec()
                .addNewContainer()
                .withName(Constants.NAME)
                .withImage(image)
                .withImagePullPolicy("Always")
                .withEnv(envVarList)
                .addNewPort()
                .withContainerPort(8080)
                .withName(Constants.NAME)
                .endPort()
                .withResources(new ResourceRequirementsBuilder().withRequests(
                        Map.of("memory", new Quantity("512Mi"))).build())
                .endContainer()
                .withServiceAccount(Constants.SERVICEACCOUNT_KARAVAN)
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }

}
