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
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanConfig;
import org.apache.camel.karavan.cli.ResourceUtils;

import java.util.Map;

public class KaravanSecret {

    public static Secret getSecret(KaravanConfig config) {

        Map<String, String> secretData = Map.of(
                "master-password", (config.isAuthBasic() ? config.getMasterPassword() : "xxx"),
                "oidc-secret", (config.isAuthOidc() ? config.getOidcSecret() : "xxx"),
                "oidc-server-url", (config.isAuthOidc() ? config.getOidcServerUrl() :"https://localhost/auth/realms/karavan"),
                "oidc-frontend-url", (config.isAuthOidc() ? config.getOidcFrontendUrl() : "https://localhost/auth"),
                "git-repository", config.getGitRepository(),
                "git-password", config.getGitPassword(),
                "git-username", config.getGitUsername(),
                "git-branch", config.getGitBranch(),
                "image-registry", config.getImageRegistry()
                );

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
