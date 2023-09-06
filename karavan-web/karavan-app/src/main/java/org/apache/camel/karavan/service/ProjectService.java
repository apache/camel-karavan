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

import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.docker.DockerForKaravan;
import org.apache.camel.karavan.docker.model.DockerComposeService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.*;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.shared.ConfigService;
import org.apache.camel.karavan.shared.EventType;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.service.CodeService.DEV_SERVICES_FILENAME;
import static org.apache.camel.karavan.service.CodeService.PROJECT_COMPOSE_FILENAME;

@Default
@Readiness
@ApplicationScoped
public class ProjectService implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(ProjectService.class.getName());

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @ConfigProperty(name = "karavan.git-pull-interval")
    String gitPullInterval;

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    EventBus eventBus;

    private AtomicBoolean ready = new AtomicBoolean(false);
    private AtomicBoolean readyToPull = new AtomicBoolean(false);

    @Override
    public HealthCheckResponse call() {
        if (ready.get()) {
            return HealthCheckResponse.named("project").up().build();
        } else {
            return HealthCheckResponse.named("project").down().build();
        }
    }

    public String runProjectWithJBangOptions(Project project, String jBangOptions) throws Exception {
        String containerName = project.getProjectId();
        ContainerStatus status = infinispanService.getDevModeContainerStatus(project.getProjectId(), environment);
        if (status == null) {
            status = ContainerStatus.createDevMode(project.getProjectId(), environment);
        }

        if (!Objects.equals(status.getState(), ContainerStatus.State.running.name())) {
            status.setInTransit(true);
            eventBus.send(EventType.CONTAINER_STATUS, JsonObject.mapFrom(status));

            if (ConfigService.inKubernetes()) {
                kubernetesService.runDevModeContainer(project, jBangOptions);
            } else {
                Map<String, String> files = infinispanService.getProjectFiles(project.getProjectId()).stream()
                        .filter(f -> !Objects.equals(f.getName(), PROJECT_COMPOSE_FILENAME))
                        .collect(Collectors.toMap(ProjectFile::getName, ProjectFile::getCode));
                ProjectFile compose = infinispanService.getProjectFile(project.getProjectId(), PROJECT_COMPOSE_FILENAME);
                DockerComposeService dcs = codeService.convertToDockerComposeService(compose.getCode(), project.getProjectId());
                dockerForKaravan.runProjectInDevMode(project.getProjectId(), jBangOptions, dcs.getPortsMap(), files);
            }
            return containerName;
        } else {
            return null;
        }
    }

    public String buildProject(Project project) throws Exception {
        if (ConfigService.inKubernetes()) {
            return kubernetesService.createPipelineRun(project);
        } else {
            Map<String, String> files = infinispanService.getProjectFiles(project.getProjectId()).stream()
                    .filter(f -> !Objects.equals(f.getName(), PROJECT_COMPOSE_FILENAME))
                    .collect(Collectors.toMap(ProjectFile::getName, ProjectFile::getCode));
            ProjectFile compose = infinispanService.getProjectFile(project.getProjectId(), PROJECT_COMPOSE_FILENAME);
            DockerComposeService dcs = codeService.convertToDockerComposeService(compose.getCode(), project.getProjectId());

            String templateName = project.getRuntime() + "-builder-script-docker.sh";
            String script = codeService.getTemplateText(templateName);

            GitConfig gitConfig = gitService.getGitConfig();
            List<String> env = List.of(
                    "GIT_REPOSITORY=" + gitConfig.getUri(),
                    "GIT_USERNAME=" + gitConfig.getUsername(),
                    "GIT_PASSWORD=" + gitConfig.getPassword(),
                    "PROJECT_ID=" + project.getProjectId(),
                    "IMAGE_REGISTRY=registry:5000",
                    "IMAGE_GROUP=karavan"
            );

            dockerForKaravan.runBuildProject(project.getProjectId(), script, files);
            return project.getProjectId();
        }
    }

    public Project save(Project project) throws Exception {
        boolean isNew = infinispanService.getProject(project.getProjectId()) == null;
        infinispanService.saveProject(project);
        if (isNew) {
            ProjectFile appProp = codeService.getApplicationProperties(project);
            infinispanService.saveProjectFile(appProp);
            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project);
                infinispanService.saveProjectFile(projectCompose);
            }
        }
        return project;
    }

    public Integer getProjectPort(String projectId) {
        ProjectFile composeFile = infinispanService.getProjectFile(projectId, PROJECT_COMPOSE_FILENAME);
        return codeService.getProjectPort(composeFile);
    }

    public void pullCommits() {
        if (readyToPull.get()) {
            LOGGER.info("Pull commits...");
            Tuple2<String, Integer> lastCommit = infinispanService.getLastCommit();
            gitService.getCommitsAfterCommit(lastCommit.getItem2()).forEach(commitInfo -> {
                if (!infinispanService.hasCommit(commitInfo.getCommitId())) {
                    commitInfo.getRepos().forEach(repo -> {
                        Project project = importProjectFromRepo(repo);
                        kubernetesService.createPipelineRun(project);
                    });
                    infinispanService.saveCommit(commitInfo.getCommitId(), commitInfo.getTime());
                }
                infinispanService.saveLastCommit(commitInfo.getCommitId());
            });
        }
    }

    void importCommits() {
        LOGGER.info("Import commits...");
        gitService.getAllCommits().forEach(commitInfo -> {
            System.out.println(commitInfo.getCommitId() + " " + Instant.ofEpochSecond(commitInfo.getTime()).toString());
            infinispanService.saveCommit(commitInfo.getCommitId(), commitInfo.getTime());
            infinispanService.saveLastCommit(commitInfo.getCommitId());
        });
        readyToPull.set(true);
    }

    @Retry(maxRetries = 100, delay = 2000)
    public void tryStart() throws Exception {
        if (infinispanService.isReady() && gitService.checkGit()) {
            if (infinispanService.getProjects().isEmpty()) {
                importAllProjects();
            }
            addKameletsProject();
            addTemplatesProject();
            addServicesProject();
            if (!Objects.equals("disabled", gitPullInterval.toLowerCase()) && !Objects.equals("off", gitPullInterval.toLowerCase())) {
                importCommits();
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
                    project = new Project(Project.Type.templates.name(), "Templates", "Templates", "", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.templates);
                } else if (folderName.equals(Project.Type.kamelets.name())) {
                    project = new Project(Project.Type.kamelets.name(), "Custom Kamelets", "Custom Kamelets", "", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.kamelets);
                } else if (folderName.equals(Project.Type.pipelines.name())) {
                    project = new Project(Project.Type.pipelines.name(), "Pipelines", "CI/CD Pipelines", "", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.pipelines);
                } else if (folderName.equals(Project.Type.services.name())) {
                    project = new Project(Project.Type.services.name(), "Services", "Development Services", "", repo.getCommitId(), repo.getLastCommitTimestamp(), Project.Type.services);
                } else {
                    project = getProjectFromRepo(repo);
                }
                infinispanService.saveProject(project);

                repo.getFiles().forEach(repoFile -> {
                    ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), folderName, repoFile.getLastCommitTimestamp());
                    infinispanService.saveProjectFile(file);
                });
            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    public Project importProject(String projectId) {
        LOGGER.info("Import project from Git " + projectId);
        try {
            GitRepo repo = gitService.readProjectFromRepository(projectId);
            return importProjectFromRepo(repo);
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
            return null;
        }
    }

    private Project importProjectFromRepo(GitRepo repo) {
        LOGGER.info("Import project from GitRepo " + repo.getName());
        try {
            Project project = getProjectFromRepo(repo);
            infinispanService.saveProject(project);
            repo.getFiles().forEach(repoFile -> {
                ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), repo.getName(), repoFile.getLastCommitTimestamp());
                infinispanService.saveProjectFile(file);
            });
            return project;
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
            return null;
        }
    }

    public Project getProjectFromRepo(GitRepo repo) {
        String folderName = repo.getName();
        String propertiesFile = codeService.getPropertiesFile(repo);
        String projectName = codeService.getProjectName(propertiesFile);
        String projectDescription = codeService.getProjectDescription(propertiesFile);
        String runtime = codeService.getProjectRuntime(propertiesFile);
        return new Project(folderName, projectName, projectDescription, runtime, repo.getCommitId(), repo.getLastCommitTimestamp());
    }

    public Project commitAndPushProject(String projectId, String message) throws Exception {
        Project p = infinispanService.getProject(projectId);
        List<ProjectFile> files = infinispanService.getProjectFiles(projectId);
        RevCommit commit = gitService.commitAndPushProject(p, files, message);
        String commitId = commit.getId().getName();
        Long lastUpdate = commit.getCommitTime() * 1000L;
        p.setLastCommit(commitId);
        p.setLastCommitTimestamp(lastUpdate);
        infinispanService.saveProject(p);
        infinispanService.saveCommit(commitId, commit.getCommitTime());
        return p;
    }

    void addKameletsProject() {
        LOGGER.info("Add custom kamelets project if not exists");
        try {
            Project kamelets = infinispanService.getProject(Project.Type.kamelets.name());
            if (kamelets == null) {
                kamelets = new Project(Project.Type.kamelets.name(), "Custom Kamelets", "Custom Kamelets", "", "", Instant.now().toEpochMilli(), Project.Type.kamelets);
                infinispanService.saveProject(kamelets);
                commitAndPushProject(Project.Type.kamelets.name(), "Add custom kamelets");
            }
        } catch (Exception e) {
            LOGGER.error("Error during custom kamelets project creation", e);
        }
    }

    void addTemplatesProject() {
        LOGGER.info("Add templates project if not exists");
        try {
            Project templates = infinispanService.getProject(Project.Type.templates.name());
            if (templates == null) {
                templates = new Project(Project.Type.templates.name(), "Templates", "Templates", "", "", Instant.now().toEpochMilli(), Project.Type.templates);
                infinispanService.saveProject(templates);

                codeService.getTemplates().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.templates.name(), Instant.now().toEpochMilli());
                    infinispanService.saveProjectFile(file);
                });
                commitAndPushProject(Project.Type.templates.name(), "Add default templates");
            }
        } catch (Exception e) {
            LOGGER.error("Error during templates project creation", e);
        }
    }

    void addServicesProject() {
        LOGGER.info("Add services project if not exists");
        try {
            Project services = infinispanService.getProject(Project.Type.services.name());
            if (services == null) {
                services = new Project(Project.Type.services.name(), "Services", "Development Services", "", "", Instant.now().toEpochMilli(), Project.Type.services);
                infinispanService.saveProject(services);

                codeService.getServices().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.services.name(), Instant.now().toEpochMilli());
                    infinispanService.saveProjectFile(file);
                });
                commitAndPushProject(Project.Type.services.name(), "Add services");
            }
        } catch (Exception e) {
            LOGGER.error("Error during services project creation", e);
        }
    }

    void addPipelinesProject() {
        LOGGER.info("Add pipelines project if not exists");
        try {
            Project pipelines = infinispanService.getProject(Project.Type.pipelines.name());
            if (pipelines == null) {
                pipelines = new Project(Project.Type.pipelines.name(), "Pipelines", "CI/CD Pipelines", "", "", Instant.now().toEpochMilli(), Project.Type.pipelines);
                infinispanService.saveProject(pipelines);

                codeService.getTemplates().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.pipelines.name(), Instant.now().toEpochMilli());
                    infinispanService.saveProjectFile(file);
                });
                commitAndPushProject(Project.Type.pipelines.name(), "Add default pipelines");
            }
        } catch (Exception e) {
            LOGGER.error("Error during pipelines project creation", e);
        }
    }

    public String getDevServiceCode() {
        List<ProjectFile> files = infinispanService.getProjectFiles(Project.Type.services.name());
        Optional<ProjectFile> file = files.stream().filter(f -> f.getName().equals(DEV_SERVICES_FILENAME)).findFirst();
        return file.orElse(new ProjectFile()).getCode();
    }
}
