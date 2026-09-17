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
package org.apache.camel.karavan.service;

import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.RegistryConfig;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Objects;
import java.util.Optional;

@ApplicationScoped
public class RegistryService {

    private static final Logger LOGGER = Logger.getLogger(RegistryService.class.getName());

    @ConfigProperty(name = "karavan.container-image.registry")
    String registry;
    @ConfigProperty(name = "karavan.container-image.group")
    String group;
    @ConfigProperty(name = "karavan.container-image.registry-username")
    Optional<String> username;
    @ConfigProperty(name = "karavan.container-image.registry-password")
    Optional<String> password;

    @Inject
    KubernetesService kubernetesService;

    public RegistryConfig getRegistryConfig() {
        String registryUrl = registry;
        String imageGroup = group;
        String registryUsername = username.orElse(null);
        String registryPassword = password.orElse(null);
        if (ConfigService.inKubernetes()) {
            registryUrl = kubernetesService.getKaravanSecret("image-registry");
            String i = kubernetesService.getKaravanSecret("image-group");
            imageGroup = i != null ? i : group;
            registryUsername = kubernetesService.getKaravanSecret("image-registry-username");
            registryPassword = kubernetesService.getKaravanSecret("image-registry-password");
            if (registryUsername == null || registryUsername.isBlank()) {
                // Zero-config: reuse the image pull secret of the Talisman pod/ServiceAccount
                String[] credentials = getCredentialsFromPullSecrets(registryUrl);
                if (credentials != null) {
                    registryUsername = credentials[0];
                    registryPassword = credentials[1];
                }
            }
        }
        return new RegistryConfig(registryUrl, imageGroup, registryUsername, registryPassword);
    }

    /**
     * Registry address used to call the registry API. In local dev mode (outside Docker and
     * Kubernetes) the in-compose registry is reachable on its published port only.
     */
    public String getRegistryAddress() {
        String registryUrl = getRegistryConfig().getRegistry();
        if (!ConfigService.inKubernetes() && !ConfigService.inDocker() && "registry:5000".equalsIgnoreCase(registryUrl)) {
            registryUrl = "localhost:5555";
        }
        return registryUrl;
    }

    /**
     * Resolves `username/password` for the registry host from the `kubernetes.io/dockerconfigjson`
     * pull secrets available to Talisman, so the registry does not have to be configured twice.
     */
    private String[] getCredentialsFromPullSecrets(String registry) {
        String host = normalizeRegistryHost(registry);
        for (String dockerConfig : kubernetesService.getDockerConfigJsons()) {
            try {
                JsonObject auths = new JsonObject(dockerConfig).getJsonObject("auths");
                if (auths == null) {
                    continue;
                }
                for (String key : auths.fieldNames()) {
                    if (!Objects.equals(normalizeRegistryHost(key), host)) {
                        continue;
                    }
                    JsonObject entry = auths.getJsonObject(key);
                    String username = entry.getString("username");
                    String password = entry.getString("password");
                    if (username == null && entry.getString("auth") != null) {
                        String decoded = new String(Base64.getDecoder().decode(entry.getString("auth")), StandardCharsets.UTF_8);
                        int colon = decoded.indexOf(':');
                        if (colon > 0) {
                            username = decoded.substring(0, colon);
                            password = decoded.substring(colon + 1);
                        }
                    }
                    if (username != null) {
                        return new String[]{username, password};
                    }
                }
            } catch (Exception e) {
                LOGGER.warn("Failed to parse image pull secret: " + e.getMessage());
            }
        }
        return null;
    }

    private String normalizeRegistryHost(String registry) {
        if (registry == null) {
            return null;
        }
        String host = registry.replaceFirst("^https?://", "");
        int slash = host.indexOf('/');
        if (slash > 0) {
            host = host.substring(0, slash);
        }
        // Docker Hub is referenced by several aliases in docker config files
        if (host.equals("index.docker.io") || host.equals("registry-1.docker.io") || host.equals("registry.hub.docker.com")) {
            host = "docker.io";
        }
        return host;
    }

    public String getRegistryWithGroupForSync() {
        String registryUrl = registry;
        if (!ConfigService.inKubernetes() && registryUrl.equalsIgnoreCase("registry:5000")) {
            registryUrl = "localhost:5555";
        }
        return registryUrl + "/" + group;
    }
}
