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
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.Configuration;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
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
import static org.apache.camel.karavan.service.CodeService.BUILD_SCRIPT_FILENAME;

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

    @ConfigProperty(name = "karavan.shared.folder")
    Optional<String> sharedFolder;

    @Inject
    KaravanCache karavanCache;

    @Inject
    KubernetesService kubernetesService;

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
            var configFilenames =  codeService.getConfigurationList();
            configuration = new Configuration(
                    title,
                    version,
                    inKubernetes() ? "kubernetes" : "docker",
                    environment,
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
            inDocker = !inKubernetes() && Files.exists(Paths.get(".dockerenv"));
        }
        return inDocker;
    }

    public void shareOnStartup() {
        if (ConfigService.inKubernetes() && environment.equals(DEV)) {
            LOGGER.info("Creating Configmap for " + BUILD_SCRIPT_FILENAME);
            try {
                share(BUILD_SCRIPT_FILENAME);
            } catch (Exception e) {
                var error = e.getCause() != null ? e.getCause() : e;
                LOGGER.error("Error while trying to share build.sh as Configmap", error);
            }
        }
    }

    public void share(String filename) throws Exception {
        if (filename != null) {
            ProjectFile f = karavanCache.getProjectFile(Project.Type.configuration.name(), filename);
            if (f != null) {
                shareFile(f);
            }
        } else {
            for (ProjectFile f : karavanCache.getProjectFiles(Project.Type.configuration.name())) {
                shareFile(f);
            }
        }
    }

    private void shareFile(ProjectFile f) throws Exception {
        var filename = f.getName();
        var parts = filename.split("\\.");
        var prefix = parts[0];
        if (environment.equals(DEV) && !getEnvs().contains(prefix)) { // no prefix AND dev env
            storeFile(f.getName(), f.getCode());
        } else if (Objects.equals(prefix, environment)) { // with prefix == env
            filename = f.getName().substring(environment.length() + 1);
            storeFile(filename, f.getCode());
        }
    }

    private void storeFile(String filename , String code) throws Exception {
        if (inKubernetes()) {
            createConfigMapFromFile(filename, code);
        } else {
            if (sharedFolder.isPresent()) {
                Files.writeString(Paths.get(sharedFolder.get(), filename), code);
            } else {
                throw new Exception("Shared folder not configured");
            }
        }
    }

    protected List<String> getEnvs() {
        return environments.orElse(List.of(DEV));
    }

    private void createConfigMapFromFile(String filename, String content) {
        kubernetesService.createConfigmap(filename, Map.of(filename, content));
    }

    public static String getAppName() {
        return ConfigProvider.getConfig().getOptionalValue("karavan.appName", String.class).orElse("karavan");
    }


}