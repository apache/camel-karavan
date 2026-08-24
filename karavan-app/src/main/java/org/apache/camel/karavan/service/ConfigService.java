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

import io.quarkus.runtime.StartupEvent;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.Configuration;
import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static org.apache.camel.karavan.KaravanConstants.DEV;

@ApplicationScoped
public class ConfigService {

    private static final Logger LOGGER = Logger.getLogger(ConfigService.class.getName());

    @ConfigProperty(name = "karavan.title")
    String title;

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @ConfigProperty(name = "karavan.environments")
    Optional<List<String>> environments;

    @ConfigProperty(name = "karavan.secret.name", defaultValue = "karavan")
    String secretName;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    CodeService codeService;

    private Configuration configuration;
    private static Boolean inKubernetes;
    private static Boolean inDocker;

    void onStart(@Observes @Priority(10) StartupEvent ev) {
        getConfiguration(null);
    }

    public Configuration getConfiguration(Map<String, String> advanced) {
        if (configuration == null) {
            var configFilenames =  codeService.getBuildInProjectFileList(ProjectFolder.Type.configuration.name());
            configuration = new Configuration(
                    title,
                    version,
                    inKubernetes() ? "kubernetes" : "docker",
                    environment,
                    secretName,
                    secretName,
                    getEnvs(),
                    configFilenames,
                    advanced
            );
        }
        return configuration;
    }

    public static boolean inKubernetes() {
        if (inKubernetes == null) {
            inKubernetes = Objects.nonNull(System.getenv("KUBERNETES_SERVICE_HOST"));
        }
        return inKubernetes;
    }

    public static boolean inDocker() {
        if (inDocker == null) {
            inDocker = !inKubernetes() && Files.exists(Paths.get("/.dockerenv"));
        }
        return inDocker;
    }

    protected List<String> getEnvs() {
        return environments.orElse(List.of(DEV));
    }


    public static String getAppName() {
        return ConfigProvider.getConfig().getOptionalValue("karavan.appName", String.class).orElse("karavan");
    }


}