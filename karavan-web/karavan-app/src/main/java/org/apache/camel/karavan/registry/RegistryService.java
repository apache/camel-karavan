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
package org.apache.camel.karavan.registry;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class RegistryService {

    private static final Logger LOGGER = Logger.getLogger(RegistryService.class.getName());

    @ConfigProperty(name = "karavan.image-registry-install")
    boolean installRegistry;
    @ConfigProperty(name = "karavan.image-registry")
    String registry;
    @ConfigProperty(name = "karavan.image-group")
    String group;
    @ConfigProperty(name = "karavan.image-registry-username")
    Optional<String> username;
    @ConfigProperty(name = "karavan.image-registry-password")
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
        }
        return new RegistryConfig(registryUrl, imageGroup, registryUsername, registryPassword);
    }

    public String getRegistryWithGroupForSync() {
        String registryUrl = registry;
        if (!ConfigService.inKubernetes() && installRegistry) {
            registryUrl = "localhost:5555";
        }
        return registryUrl + "/" + group;
    }

    public List<String> getEnvForBuild() {
        RegistryConfig rc = getRegistryConfig();
        return List.of(
                "IMAGE_REGISTRY=" + rc.getRegistry(),
                "IMAGE_REGISTRY_USERNAME=" + rc.getUsername(),
                "IMAGE_REGISTRY_PASSWORD=" + rc.getPassword(),
                "IMAGE_GROUP=" + rc.getGroup()
        );
    }

}
