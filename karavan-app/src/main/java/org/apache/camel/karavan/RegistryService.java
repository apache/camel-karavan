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
package org.apache.camel.karavan;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.manager.kubernetes.KubernetesManager;
import org.apache.camel.karavan.project.model.RegistryConfig;
import org.apache.camel.karavan.config.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
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
    KubernetesManager kubernetesManager;

    public RegistryConfig getRegistryConfig() {
        String registryUrl = registry;
        String imageGroup = group;
        String registryUsername = username.orElse(null);
        String registryPassword = password.orElse(null);
        if (ConfigService.inKubernetes()) {
            registryUrl = kubernetesManager.getKaravanSecret("image-registry");
            String i = kubernetesManager.getKaravanSecret("image-group");
            imageGroup = i != null ? i : group;
            registryUsername = kubernetesManager.getKaravanSecret("image-registry-username");
            registryPassword = kubernetesManager.getKaravanSecret("image-registry-password");
        }
        return new RegistryConfig(registryUrl, imageGroup, registryUsername, registryPassword);
    }

    public String getRegistryWithGroupForSync() {
        String registryUrl = registry;
        if (!ConfigService.inKubernetes() && registryUrl.equalsIgnoreCase("registry:5000")) {
            registryUrl = "localhost:5555";
        }
        return registryUrl + "/" + group;
    }

    public List<String> getEnvForBuild() {
        RegistryConfig rc = getRegistryConfig();
        List<String> result = new ArrayList<>();
        result.add("IMAGE_REGISTRY=" + rc.getRegistry());
        if (rc.getUsername() != null && !rc.getUsername().isEmpty()) {
            result.add("IMAGE_REGISTRY_USERNAME=" + rc.getUsername());
        }
        if (rc.getPassword() != null && !rc.getPassword().isEmpty()) {
            result.add("IMAGE_REGISTRY_PASSWORD=" + rc.getPassword());
        }
        if (rc.getGroup() != null && !rc.getGroup().isEmpty()) {
            result.add("IMAGE_GROUP=" + rc.getGroup());
        }
        return result;
    }

}
