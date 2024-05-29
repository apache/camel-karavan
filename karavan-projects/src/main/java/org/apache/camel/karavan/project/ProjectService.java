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
package org.apache.camel.karavan.project;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.config.ConfigService;
import org.apache.camel.karavan.project.model.DockerComposeService;
import org.apache.camel.karavan.project.model.Project;
import org.apache.camel.karavan.project.model.ProjectFile;
import org.apache.camel.karavan.project.model.GitRepo;
import org.apache.camel.karavan.status.model.GroupedKey;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.jgit.revwalk.RevCommit;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.project.CodeService.*;
import static org.apache.camel.karavan.project.CodeService.INTERNAL_PORT;
import static org.apache.camel.karavan.project.ProjectEvents.*;
import static org.apache.camel.karavan.project.ProjectsCache.DEFAULT_ENVIRONMENT;

@Default
@ApplicationScoped
public class ProjectService {

    private static final Logger LOGGER = Logger.getLogger(ProjectService.class.getName());

    @Inject
    ProjectsCache projectsCache;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = CMD_PUSH_PROJECT, blocking = true, ordered = true)
    public void commitAndPushProject(JsonObject event) throws Exception {
        LOGGER.info("Commit: " + event.encodePrettily());
        String projectId = event.getString("projectId");
        String message = event.getString("message");
        String userId = event.getString("userId");
        String eventId = event.getString("eventId");
        Project p = projectsCache.getProject(projectId);
        List<ProjectFile> files = projectsCache.getProjectFiles(projectId);
        RevCommit commit = gitService.commitAndPushProject(p, files, message);
        String commitId = commit.getId().getName();
        Long lastUpdate = commit.getCommitTime() * 1000L;
        p.setLastCommit(commitId);
        p.setLastCommitTimestamp(lastUpdate);
        projectsCache.saveProject(p);
        if (userId != null) {
            eventBus.publish(COMMIT_HAPPENED, JsonObject.of("eventId", eventId, "project", JsonObject.mapFrom(p)));
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
            projectsCache.saveProject(project);
            repo.getFiles().forEach(repoFile -> {
                ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), repo.getName(), repoFile.getLastCommitTimestamp());
                projectsCache.saveProjectFile(file);
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

    public String getDevServiceCode() {
        List<ProjectFile> files = projectsCache.getProjectFiles(Project.Type.services.name());
        Optional<ProjectFile> file = files.stream().filter(f -> f.getName().equals(DEV_SERVICES_FILENAME)).findFirst();
        return file.orElse(new ProjectFile()).getCode();
    }

    public DockerComposeService getProjectDockerComposeService(String projectId) {
        return codeService.getDockerComposeService(projectId);
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

    public void setProjectImage(String projectId, JsonObject data) throws Exception {
        String imageName = data.getString("imageName");
        boolean commit = data.getBoolean("commit");
        data.put("projectId", projectId);
        codeService.updateDockerComposeImage(projectId, imageName);
        if (commit) {
            eventBus.publish(CMD_PUSH_PROJECT, data);
        }
    }

    public List<Project> getAllProjects(String type) {
        return projectsCache.getProjects().stream()
                .filter(p -> type == null || Objects.equals(p.getType().name(), type))
                .sorted(Comparator.comparing(Project::getProjectId))
                .collect(Collectors.toList());
    }

    public Project save(Project project) throws Exception {
        boolean projectIdExists = projectsCache.getProject(project.getProjectId()) != null;

        if (projectIdExists) {
            throw new Exception("Project with id " + project.getProjectId() + " already exists");
        } else {
            projectsCache.saveProject(project);
            ProjectFile appProp = codeService.getApplicationProperties(project);
            projectsCache.saveProjectFile(appProp);
            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project, getMaxPortMappedInProjects() + 1);
                projectsCache.saveProjectFile(projectCompose);
            } else {
                ProjectFile projectCompose = codeService.createInitialDeployment(project);
                projectsCache.saveProjectFile(projectCompose);
            }
        }
        return project;
    }

    public Project copy(String sourceProjectId, Project project) throws Exception {
        boolean projectIdExists = projectsCache.getProject(project.getProjectId()) != null;

        if (projectIdExists) {
            throw new Exception("Project with id " + project.getProjectId() + " already exists");
        } else {

            Project sourceProject = projectsCache.getProject(sourceProjectId);

            // Save project
            projectsCache.saveProject(project);

            // Copy files from the source and make necessary modifications
            Map<String, ProjectFile> filesMap = projectsCache.getProjectFilesMap(sourceProjectId).entrySet().stream()
                    .filter(e -> !Objects.equals(e.getValue().getName(), PROJECT_COMPOSE_FILENAME) &&
                            !Objects.equals(e.getValue().getName(), PROJECT_DEPLOYMENT_JKUBE_FILENAME)
                    )
                    .collect(Collectors.toMap(
                            e -> GroupedKey.create(project.getProjectId(), DEFAULT_ENVIRONMENT, e.getValue().getName()),
                            e -> {
                                ProjectFile file = e.getValue();
                                file.setProjectId(project.getProjectId());
                                if (Objects.equals(file.getName(), APPLICATION_PROPERTIES_FILENAME)) {
                                    modifyPropertyFileOnProjectCopy(file, sourceProject, project);
                                }
                                return file;
                            })
                    );
            projectsCache.saveProjectFiles(filesMap);

            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project, getMaxPortMappedInProjects() + 1);
                projectsCache.saveProjectFile(projectCompose);
            } else {
                ProjectFile projectCompose = codeService.createInitialDeployment(project);
                projectsCache.saveProjectFile(projectCompose);
            }

            return project;
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

    public Integer getProjectPort(ProjectFile composeFile) {
        if (composeFile != null) {
            DockerComposeService dcs = DockerComposeConverter.fromCode(composeFile.getCode(), composeFile.getProjectId());
            Optional<Integer> port = dcs.getPortsMap().entrySet().stream()
                    .filter(e -> Objects.equals(e.getValue(), INTERNAL_PORT)).map(Map.Entry::getKey).findFirst();
            return port.orElse(null);
        }
        return null;
    }

    private int getMaxPortMappedInProjects() {
        List<ProjectFile> files =  projectsCache.getProjectFilesByName(PROJECT_COMPOSE_FILENAME).stream()
                .filter(f -> !Objects.equals(f.getProjectId(), Project.Type.templates.name())).toList();
        if (!files.isEmpty()) {
            return files.stream().map(this::getProjectPort)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .max().orElse(INTERNAL_PORT);
        } else {
            return INTERNAL_PORT;
        }
    }

    public enum Property {
        PROJECT_ID("camel.karavan.project-id=%s"),
        PROJECT_NAME("camel.karavan.project-name=%s"),
        PROJECT_DESCRIPTION("camel.karavan.project-description=%s"),
        GAV("camel.jbang.gav=org.camel.karavan.demo:%s:1");

        private final String keyValueFormatter;

        Property(String keyValueFormatter) {
            this.keyValueFormatter = keyValueFormatter;
        }

        public String getKeyValueFormatter() {
            return keyValueFormatter;
        }
    }
}
