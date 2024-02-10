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

import io.quarkus.vertx.ConsumeEvent;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.ContainerStatus;
import org.apache.camel.karavan.cache.model.GroupedKey;
import org.apache.camel.karavan.cache.model.Project;
import org.apache.camel.karavan.cache.model.ProjectFile;
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.code.DockerComposeConverter;
import org.apache.camel.karavan.code.model.DockerComposeService;
import org.apache.camel.karavan.docker.DockerForKaravan;
import org.apache.camel.karavan.git.GitService;
import org.apache.camel.karavan.git.model.GitRepo;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.registry.RegistryService;
import org.apache.camel.karavan.shared.Constants;
import org.apache.camel.karavan.shared.Property;
import org.apache.camel.karavan.validation.project.ProjectModifyValidator;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.code.CodeService.*;
import static org.apache.camel.karavan.shared.Constants.NOTIFICATION_EVENT_COMMIT;

@Default
@Readiness
@ApplicationScoped
public class ProjectService implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(ProjectService.class.getName());

    public static final String PUSH_PROJECT = "PUSH_PROJECT";

    @ConfigProperty(name = "karavan.environment")
    String environment;


    @Inject
    ProjectModifyValidator projectModifyValidator;

    @Inject
    KaravanCacheService karavanCacheService;

    @Inject
    NotificationService notificationService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    RegistryService registryService;

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

    public String runProjectWithJBangOptions(Project project, String jBangOptions) throws Exception {
        String containerName = project.getProjectId();
        ContainerStatus status = karavanCacheService.getDevModeContainerStatus(project.getProjectId(), environment);
        if (status == null) {
            status = ContainerStatus.createDevMode(project.getProjectId(), environment);
        }
        if (!Objects.equals(status.getState(), ContainerStatus.State.running.name())) {
            status.setInTransit(true);
            eventBus.publish(ContainerStatusService.CONTAINER_STATUS, JsonObject.mapFrom(status));

            Map<String, String> files = codeService.getProjectFilesForDevMode(project.getProjectId(), true);
            if (ConfigService.inKubernetes()) {
                kubernetesService.runDevModeContainer(project, jBangOptions, files);
            } else {
                DockerComposeService dcs = codeService.getDockerComposeService(project.getProjectId());
                dockerForKaravan.runProjectInDevMode(project.getProjectId(), jBangOptions, dcs.getPortsMap(), files);
            }
            return containerName;
        } else {
            return null;
        }
    }

    public void buildProject(Project project, String tag) throws Exception {
        tag = tag != null && !tag.isEmpty() && !tag.isBlank()
                ? tag
                : Instant.now().toString().substring(0, 19).replace(":", "-");
        String script = codeService.getBuilderScript();
        List<String> env = getProjectEnvForBuild(project, tag);
        if (ConfigService.inKubernetes()) {
            kubernetesService.runBuildProject(project, script, env, tag);
        } else {
            env.addAll(getConnectionsEnvForBuild());
            Map<String, String> sshFiles = getSshFiles();
            dockerForKaravan.runBuildProject(project, script, env, sshFiles, tag);
        }
    }

    private Map<String, String> getSshFiles() {
        Map<String, String> sshFiles = new HashMap<>(2);
        Tuple2<String,String> sshFileNames = gitService.getSShFiles();
        if (sshFileNames.getItem1() != null) {
            sshFiles.put("id_rsa", codeService.getFileString(sshFileNames.getItem1()));
        }
        if (sshFileNames.getItem2() != null) {
            sshFiles.put("known_hosts", codeService.getFileString(sshFileNames.getItem2()));
        }
        return sshFiles;
    }

    private List<String> getProjectEnvForBuild(Project project, String tag) {
        return new ArrayList<>(List.of(
                "PROJECT_ID=" + project.getProjectId(),
                "TAG=" + tag
        ));
    }

    private List<String> getConnectionsEnvForBuild() {
        List<String> env = new ArrayList<>();
        env.addAll(registryService.getEnvForBuild());
        env.addAll(gitService.getEnvForBuild());
        return env;
    }

    public List<Project> getAllProjects(String type) {
        if (karavanCacheService.isReady()) {
            return karavanCacheService.getProjects().stream()
                    .filter(p -> type == null || Objects.equals(p.getType().name(), type))
                    .sorted(Comparator.comparing(Project::getProjectId))
                    .collect(Collectors.toList());
        } else {
            return List.of();
        }
    }

    private String getImage(List<ProjectFile> files, String projectId) {
        Optional<ProjectFile> file = files.stream().filter(f -> Objects.equals(f.getProjectId(), projectId)).findFirst();
        if (file.isPresent()) {
            DockerComposeService service = DockerComposeConverter.fromCode(file.get().getCode(), projectId);
            String image = service.getImage();
            return Objects.equals(image, projectId) ? null : image;
        } else {
            return null;
        }
    }

    public Project save(Project project) {
        projectModifyValidator.validate(project).failOnError();

        karavanCacheService.saveProject(project);

        ProjectFile appProp = codeService.getApplicationProperties(project);
        karavanCacheService.saveProjectFile(appProp);
        if (!ConfigService.inKubernetes()) {
            ProjectFile projectCompose = codeService.createInitialProjectCompose(project);
            karavanCacheService.saveProjectFile(projectCompose);
        } else if (kubernetesService.isOpenshift()){
            ProjectFile projectCompose = codeService.createInitialDeployment(project);
            karavanCacheService.saveProjectFile(projectCompose);
        }

        return project;
    }

    public Project copy(String sourceProjectId, Project project) {
        projectModifyValidator.validate(project).failOnError();

        Project sourceProject = karavanCacheService.getProject(sourceProjectId);

        // Save project
        karavanCacheService.saveProject(project);

        // Copy files from the source and make necessary modifications
        Map<GroupedKey, ProjectFile> filesMap = karavanCacheService.getProjectFilesMap(sourceProjectId).entrySet().stream()
                .filter(e -> !Objects.equals(e.getValue().getName(), PROJECT_COMPOSE_FILENAME) &&
                        !Objects.equals(e.getValue().getName(), PROJECT_DEPLOYMENT_JKUBE_FILENAME)
                )
                .collect(Collectors.toMap(
                        e -> new GroupedKey(project.getProjectId(), e.getKey().getEnv(), e.getKey().getKey()),
                        e -> {
                            ProjectFile file = e.getValue();
                            file.setProjectId(project.getProjectId());
                            if (Objects.equals(file.getName(), APPLICATION_PROPERTIES_FILENAME)) {
                                modifyPropertyFileOnProjectCopy(file, sourceProject, project);
                            }
                            return file;
                        })
                );
        karavanCacheService.saveProjectFiles(filesMap);

        if (!ConfigService.inKubernetes()) {
            ProjectFile projectCompose = codeService.createInitialProjectCompose(project);
            karavanCacheService.saveProjectFile(projectCompose);
        } else if (kubernetesService.isOpenshift()) {
            ProjectFile projectCompose = codeService.createInitialDeployment(project);
            karavanCacheService.saveProjectFile(projectCompose);
        }

        return project;
    }

    private void modifyPropertyFileOnProjectCopy(ProjectFile propertyFile, Project sourceProject, Project project) {
        String fileContent = propertyFile.getCode();

        String sourceProjectIdProperty = String.format(Property.PROJECT_ID.getKeyValueFormatter(), sourceProject.getProjectId());
        String sourceProjectNameProperty = String.format(Property.PROJECT_NAME.getKeyValueFormatter(), sourceProject.getName());
        String sourceProjectDescriptionProperty = String.format(Property.PROJECT_DESCRIPTION.getKeyValueFormatter(), sourceProject.getDescription());
        String sourceGavProperty = String.format(Property.GAV.getKeyValueFormatter(), sourceProject.getProjectId());

        String[] searchValues = {sourceProjectIdProperty, sourceProjectNameProperty, sourceProjectDescriptionProperty, sourceGavProperty};

        String updatedProjectIdProperty = String.format(Property.PROJECT_ID.getKeyValueFormatter(), project.getProjectId());
        String updatedProjectNameProperty = String.format(Property.PROJECT_NAME.getKeyValueFormatter(), project.getName());
        String updatedProjectDescriptionProperty = String.format(Property.PROJECT_DESCRIPTION.getKeyValueFormatter(), project.getDescription());
        String updatedGavProperty = String.format(Property.GAV.getKeyValueFormatter(), project.getProjectId());

        String[] replacementValues = {updatedProjectIdProperty, updatedProjectNameProperty, updatedProjectDescriptionProperty, updatedGavProperty};

        String updatedCode = StringUtils.replaceEach(fileContent, searchValues, replacementValues);

        propertyFile.setCode(updatedCode);
    }

    public Integer getProjectPort(String projectId) {
        return codeService.getProjectPort(projectId);
    }

    @Retry(maxRetries = 100, delay = 2000)
    public void tryStart() throws Exception {
        if (karavanCacheService.isReady() && gitService.checkGit()) {
            if (karavanCacheService.getProjects().isEmpty()) {
                importAllProjects();
            }
            if (Objects.equals(environment, Constants.DEV_ENV)) {
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
                    project = getProjectFromRepo(repo);
                }
                karavanCacheService.saveProject(project);

                repo.getFiles().forEach(repoFile -> {
                    ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), folderName, repoFile.getLastCommitTimestamp());
                    karavanCacheService.saveProjectFile(file);
                });
            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    public Project importProject(String projectId) throws Exception {
        LOGGER.info("Import project from Git " + projectId);
        GitRepo repo = gitService.readProjectFromRepository(projectId);
        return importProjectFromRepo(repo);
    }

    private Project importProjectFromRepo(GitRepo repo) {
        LOGGER.info("Import project from GitRepo " + repo.getName());
        try {
            Project project = getProjectFromRepo(repo);
            karavanCacheService.saveProject(project);
            repo.getFiles().forEach(repoFile -> {
                ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), repo.getName(), repoFile.getLastCommitTimestamp());
                karavanCacheService.saveProjectFile(file);
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
        if (propertiesFile != null) {
            String projectName = codeService.getProjectName(propertiesFile);
            String projectDescription = codeService.getProjectDescription(propertiesFile);
            return new Project(folderName, projectName, projectDescription, repo.getCommitId(), repo.getLastCommitTimestamp());
        } else {
            return new Project(folderName, folderName, folderName, repo.getCommitId(), repo.getLastCommitTimestamp());
        }

    }

    @ConsumeEvent(value = PUSH_PROJECT, blocking = true, ordered = true)
    void commitAndPushProject(JsonObject event) throws Exception {
        LOGGER.info("Commit: " + event.encodePrettily());
        String projectId = event.getString("projectId");
        String message = event.getString("message");
        String userId = event.getString("userId");
        String eventId = event.getString("eventId");
        Project p = karavanCacheService.getProject(projectId);
        List<ProjectFile> files = karavanCacheService.getProjectFiles(projectId);
        RevCommit commit = gitService.commitAndPushProject(p, files, message);
        String commitId = commit.getId().getName();
        Long lastUpdate = commit.getCommitTime() * 1000L;
        p.setLastCommit(commitId);
        p.setLastCommitTimestamp(lastUpdate);
        karavanCacheService.saveProject(p);
        if (userId != null) {
            notificationService.sendSystem(eventId, NOTIFICATION_EVENT_COMMIT, Project.class.getSimpleName(), JsonObject.mapFrom(p));
        }
    }

    void addKameletsProject() {
        LOGGER.info("Add custom kamelets project if not exists");
        try {
            Project kamelets = karavanCacheService.getProject(Project.Type.kamelets.name());
            if (kamelets == null) {
                kamelets = new Project(Project.Type.kamelets.name(), "Custom Kamelets", "Custom Kamelets", "", Instant.now().toEpochMilli(), Project.Type.kamelets);
                karavanCacheService.saveProject(kamelets);
                commitAndPushProject(JsonObject.of("projectId", Project.Type.kamelets.name(), "message", "Add custom kamelets"));
            }
        } catch (Exception e) {
            LOGGER.error("Error during custom kamelets project creation", e);
        }
    }

    void addTemplatesProject() {
        LOGGER.info("Add templates project if not exists");
        try {
            Project templates = karavanCacheService.getProject(Project.Type.templates.name());
            if (templates == null) {
                templates = new Project(Project.Type.templates.name(), "Templates", "Templates", "", Instant.now().toEpochMilli(), Project.Type.templates);
                karavanCacheService.saveProject(templates);

                codeService.getTemplates().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.templates.name(), Instant.now().toEpochMilli());
                    karavanCacheService.saveProjectFile(file);
                });
                commitAndPushProject(JsonObject.of("projectId", Project.Type.templates.name(), "message", "Add custom templates"));
            } else {
                LOGGER.info("Add new templates if any");
                codeService.getTemplates().forEach((name, value) -> {
                    ProjectFile f = karavanCacheService.getProjectFile(Project.Type.templates.name(), name);
                    if (f == null) {
                        ProjectFile file = new ProjectFile(name, value, Project.Type.templates.name(), Instant.now().toEpochMilli());
                        karavanCacheService.saveProjectFile(file);
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
            Project services = karavanCacheService.getProject(Project.Type.services.name());
            if (services == null) {
                services = new Project(Project.Type.services.name(), "Services", "Development Services", "", Instant.now().toEpochMilli(), Project.Type.services);
                karavanCacheService.saveProject(services);

                codeService.getServices().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.Type.services.name(), Instant.now().toEpochMilli());
                    karavanCacheService.saveProjectFile(file);
                });
                commitAndPushProject(JsonObject.of("projectId", Project.Type.services.name(), "message", "Add services"));
            }
        } catch (Exception e) {
            LOGGER.error("Error during services project creation", e);
        }
    }

    public String getDevServiceCode() {
        List<ProjectFile> files = karavanCacheService.getProjectFiles(Project.Type.services.name());
        Optional<ProjectFile> file = files.stream().filter(f -> f.getName().equals(DEV_SERVICES_FILENAME)).findFirst();
        return file.orElse(new ProjectFile()).getCode();
    }

    public void setProjectImage(String projectId, JsonObject data) throws Exception {
        String imageName = data.getString("imageName");
        boolean commit = data.getBoolean("commit");
        data.put("projectId", projectId);
        codeService.updateDockerComposeImage(projectId, imageName);
        if (commit) {
            eventBus.publish(PUSH_PROJECT, data);
        }
    }

    public DockerComposeService getProjectDockerComposeService(String projectId) {
        return codeService.getDockerComposeService(projectId);
    }
}
