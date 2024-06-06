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

import io.quarkus.runtime.StartupEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.GitRepo;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.apache.camel.karavan.KaravanEvents.*;

@Default
@Readiness
@ApplicationScoped
public class ProjectStarter implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(ProjectStarter.class.getName());

    private static final String DEV_ENV = "dev";

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    ProjectService projectService;

    @Inject
    KaravanCache karavanCache;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    EventBus eventBus;

    private AtomicBoolean ready = new AtomicBoolean(false);

    @Override
    public HealthCheckResponse call() {
        if (ready.get()) {
            return HealthCheckResponse.named("Projects").up().build();
        } else {
            return HealthCheckResponse.named("Projects").down().build();
        }
    }

    void onStart(@Observes StartupEvent ev) throws Exception {
        LOGGER.info("Projects services: starting...");
        tryStart();
        eventBus.publish(PROJECTS_STARTED, null);
        LOGGER.info("Projects services: started");
    }

    public void tryStart() throws Exception {
        boolean git = gitService.checkGit();
        LOGGER.info("Starting Project service: git is " + (git ? "ready" : "not ready"));
        if (gitService.checkGit()) {
            if (karavanCache.getProjects().isEmpty()) {
                importAllProjects();
            }
            if (Objects.equals(environment, DEV_ENV)) {
                addKameletsProject();
                addTemplatesProject();
                addServicesProject();
            }
            ready.set(true);
        } else {
            LOGGER.info("Projects are not ready");
            throw new Exception("Projects are not ready");
        }
    }

    private void importAllProjects() {
        LOGGER.info("Import projects from Git");
        try {
            List<GitRepo> repos = gitService.readProjectsToImport();
            repos.forEach(repo -> {
                Project project;
                String folderName = repo.getName();
                if (folderName.equals(Project.Type.templates.name())) {
                    project = new Project(Project.Type.templates.name(), "Templates", "Templates", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.templates);
                } else if (folderName.equals(Project.Type.kamelets.name())) {
                    project = new Project(Project.Type.kamelets.name(), "Custom Kamelets", "Custom Kamelets", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.kamelets);
                } else if (folderName.equals(Project.Type.services.name())) {
                    project = new Project(Project.Type.services.name(), "Services", "Development Services", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.services);
                } else {
                    project = projectService.getProjectFromRepo(repo);
                }
                karavanCache.saveProject(project);

                repo.getFiles().forEach(repoFile -> {
                    ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), folderName, repoFile.getLastCommitTimestamp());
                    karavanCache.saveProjectFile(file);
                });
            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    void addKameletsProject() {
        LOGGER.info("Add custom kamelets project if not exists");
        try {
            Project kamelets = karavanCache.getProject(Project.Type.kamelets.name());
            if (kamelets == null) {
                kamelets = new Project(Project.Type.kamelets.name(), "Custom Kamelets", "Custom Kamelets", "", Instant.now().toEpochMilli(), Project.Type.kamelets);
                karavanCache.saveProject(kamelets);
            }
        } catch (Exception e) {
            LOGGER.error("Error during custom kamelets project creation", e);
        }
    }

    void addTemplatesProject() {
        LOGGER.info("Add templates project if not exists");
        try {
            Project templates = karavanCache.getProject(Project.Type.templates.name());
            if (templates == null) {
                templates = new Project(Project.Type.templates.name(), "Templates", "Templates", "", Instant.now().toEpochMilli(), Project.Type.templates);
                karavanCache.saveProject(templates);

                codeService.getTemplates().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.templates.name(), Instant.now().toEpochMilli());
                    karavanCache.saveProjectFile(file);
                });
                projectService.commitAndPushProject(JsonObject.of("projectId", Project.Type.templates.name(), "message", "Add custom templates"));
            } else {
                LOGGER.info("Add new templates if any");
                codeService.getTemplates().forEach((name, value) -> {
                    ProjectFile f = karavanCache.getProjectFile(Project.Type.templates.name(), name);
                    if (f == null) {
                        ProjectFile file = new ProjectFile(name, value, Project.Type.templates.name(), Instant.now().toEpochMilli());
                        karavanCache.saveProjectFile(file);
                    }
                });
            }
        } catch (Exception e) {
            LOGGER.error("Error during templates project creation", e);
        }
    }

    void addServicesProject() {
        LOGGER.info("Add services project if not exists");
        try {
            Project services = karavanCache.getProject(Project.Type.services.name());
            if (services == null) {
                services = new Project(Project.Type.services.name(), "Services", "Development Services", "", Instant.now().toEpochMilli(), Project.Type.services);
                karavanCache.saveProject(services);

                codeService.getServices().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.services.name(), Instant.now().toEpochMilli());
                    karavanCache.saveProjectFile(file);
                });
                projectService.commitAndPushProject(JsonObject.of("projectId", Project.Type.services.name(), "message", "Add services"));
            }
        } catch (Exception e) {
            LOGGER.error("Error during services project creation", e);
        }
    }
}
