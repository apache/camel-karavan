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

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.service.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

import static org.apache.camel.karavan.KaravanConstants.DEV;
import static org.apache.camel.karavan.KaravanEvents.NOTIFICATION_PROJECTS_STARTED;

@Default
@Readiness
@ApplicationScoped
public class KaravanStartupLoader implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(KaravanStartupLoader.class.getName());

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    ProjectService projectService;

    @Inject
    KaravanCache karavanCache;

    @Inject
    DockerService dockerService;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    EventBus eventBus;

    @Inject
    AuthService authService;

    private final AtomicBoolean ready = new AtomicBoolean(false);

    @Override
    public HealthCheckResponse call() {
        if (ready.get()) {
            return HealthCheckResponse.named("Projects").up().build();
        } else {
            return HealthCheckResponse.named("Projects").down().build();
        }
    }

    void onStart(@Observes StartupEvent ev) throws Exception {
        LOGGER.info("Starting " + ConfigService.getAppName() + " in " + environment + " env in " + (ConfigService.inKubernetes() ? "Kubernetes" : "Docker"));
        if (!ConfigService.inKubernetes() && !dockerService.checkDocker()){
            Quarkus.asyncExit();
        } else {
            createCaches();
        }
    }
    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("Stopping " + ConfigService.getAppName() + " in " + environment + " env in " + (ConfigService.inKubernetes() ? "Kubernetes" : "Docker"));
        karavanCache.stopCacheManager();
    }

    void createCaches() {
        try {
            LOGGER.info("Creating defaults...");
            authService.loadDefaults();
            LOGGER.info("Loading projects ...");
            tryStart();
            eventBus.publish(NOTIFICATION_PROJECTS_STARTED, null);
            LOGGER.info("Projects loaded");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void tryStart() throws Exception {
        boolean git = gitService.checkGit();
        LOGGER.info("Starting Project service: git is " + (git ? "ready" : "not ready"));
        if (gitService.checkGit()) {
            if (karavanCache.getFolders().isEmpty()) {
                projectService.importProjects(false);
            }
            if (Objects.equals(environment, DEV)) {
                addKameletsProject();
                addBuildInProject(ProjectFolder.Type.templates.name());
                addBuildInProject(ProjectFolder.Type.configuration.name());
                addBuildInProject(ProjectFolder.Type.shared.name());
                addBuildInProject(ProjectFolder.Type.documentation.name());
            }
            ready.set(true);
        } else {
            LOGGER.info("Projects are not ready");
            throw new Exception("Projects are not ready");
        }
    }



    void addKameletsProject() {
        try {
            ProjectFolder kamelets = karavanCache.getProject(ProjectFolder.Type.kamelets.name());
            if (kamelets == null) {
                LOGGER.info("Add custom kamelets project");
                kamelets = new ProjectFolder(ProjectFolder.Type.kamelets.name(), "Custom Kamelets", "", Instant.now().toEpochMilli(), ProjectFolder.Type.kamelets);
                karavanCache.saveProject(kamelets);
            }
        } catch (Exception e) {
            LOGGER.error("Error during custom kamelets project creation", e);
        }
    }

    public void addBuildInProject(String projectId) {
        try {
            ProjectFolder projectFolder = karavanCache.getProject(projectId);
            if (projectFolder == null) {
                var title = Pattern.compile("^.").matcher(projectId).replaceFirst(m -> m.group().toUpperCase());
                projectFolder = new ProjectFolder(projectId, title, "", Instant.now().toEpochMilli(), ProjectFolder.Type.valueOf(projectId));
                karavanCache.saveProject(projectFolder);

                codeService.getBuildInProjectFiles(projectId).forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, projectId, Instant.now().toEpochMilli());
                    karavanCache.saveProjectFile(file, false);
                });
            } else {
                codeService.getBuildInProjectFiles(projectId).forEach((name, value) -> {
                    ProjectFile f = karavanCache.getProjectFile(projectId, name);
                    if (f == null) {
                        ProjectFile file = new ProjectFile(name, value, projectId, Instant.now().toEpochMilli());
                        karavanCache.saveProjectFile(file, false);
                    }
                });
            }
        } catch (Exception e) {
            LOGGER.error("Error during creation of project " + projectId, e);
        }
    }
}
