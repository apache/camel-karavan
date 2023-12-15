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
import org.apache.camel.karavan.installer.Constants;
import org.apache.camel.karavan.installer.KaravanCommand;
import org.apache.camel.karavan.installer.ResourceUtils;

import java.util.HashMap;
import java.util.Map;

public class KaravanSecret {

    public static Secret getSecret(KaravanCommand config) {

        Map<String, String> secretData = new HashMap<>();
        secretData.put("karavan.keycloak.url", (config.isAuthOidc() ? config.getKeycloakUrl() : "https://localhost"));
        secretData.put("karavan.keycloak.realm", (config.isAuthOidc() ? config.getKeycloakRealm() : "karavan"));
        secretData.put("karavan.keycloak.frontend.clientId", (config.isAuthOidc() ? config.getKeycloakFrontendClientId() : "karavan"));
        secretData.put("karavan.keycloak.backend.clientId", (config.isAuthOidc() ? config.getKeycloakBackendClientId() : "karavan"));
        secretData.put("karavan.keycloak.backend.secret", (config.isAuthOidc() ? config.getKeycloakBackendSecret() : "secret"));
        secretData.put("git-repository", config.getGitRepository());
        secretData.put("git-password", config.getGitPassword());
        secretData.put("git-username", config.getGitUsername());
        secretData.put("git-branch", config.getGitBranch());
        secretData.put("image-registry", config.getImageRegistry());
        secretData.put("image-group", config.getImageGroup());
        secretData.put("image-registry-username", config.getImageRegistryUsername());
        secretData.put("image-registry-password", config.getImageRegistryPassword());

        return new SecretBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(Constants.NAME, config.getVersion(), Map.of()))
                .endMetadata()
                .withStringData(secretData)
                .build();
    }
}
