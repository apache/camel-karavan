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
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.docker.DockerComposeConverter;
import org.apache.camel.karavan.docker.DockerForKaravan;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.*;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.DEV_ENVIRONMENT;
import static org.apache.camel.karavan.KaravanEvents.*;
import static org.apache.camel.karavan.service.CodeService.*;

@Default
@ApplicationScoped
public class ProjectService {

    private static final Logger LOGGER = Logger.getLogger(ProjectService.class.getName());

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    KaravanCache karavanCache;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    RegistryService registryService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    EventBus eventBus;

    public void commitAndPushProject(String projectId, String message, String userId, String eventId) throws Exception {
        LOGGER.info("Commit project: " + projectId);
        Project p = karavanCache.getProject(projectId);
        List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
        RevCommit commit = gitService.commitAndPushProject(p, files, message);
        karavanCache.syncFilesCommited(projectId);
        String commitId = commit.getId().getName();
        Long lastUpdate = commit.getCommitTime() * 1000L;
        p.setLastCommit(commitId);
        p.setLastCommitTimestamp(lastUpdate);
        karavanCache.saveProject(p);
        if (userId != null) {
            eventBus.publish(COMMIT_HAPPENED, JsonObject.of("eventId", eventId, "project", JsonObject.mapFrom(p)));
        }
    }

    public String runProjectWithJBangOptions(Project project, String jBangOptions) throws Exception {
        String containerName = project.getProjectId();
        PodContainerStatus status = karavanCache.getDevModePodContainerStatus(project.getProjectId(), environment);
        if (status == null) {
            status = PodContainerStatus.createDevMode(project.getProjectId(), environment);
        }
        if (!Objects.equals(status.getState(), PodContainerStatus.State.running.name())) {
            status.setInTransit(true);
            eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(status));

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

    public Project importProject(String projectId) throws Exception {
        LOGGER.info("Import project from Git " + projectId);
        GitRepo repo = gitService.readProjectFromRepository(projectId);
        return importProjectFromRepo(repo);
    }

    private Project importProjectFromRepo(GitRepo repo) {
        LOGGER.info("Import project from GitRepo " + repo.getName());
        try {
            Project project = getProjectFromRepo(repo);
            karavanCache.saveProject(project);
            repo.getFiles().forEach(repoFile -> {
                ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), repo.getName(), repoFile.getLastCommitTimestamp());
                karavanCache.saveProjectFile(file, true);
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
            return new Project(folderName, projectName, repo.getCommitId(), repo.getLastCommitTimestamp());
        } else {
            return new Project(folderName, folderName, repo.getCommitId(), repo.getLastCommitTimestamp());
        }
    }

    public String getDevServiceCode() {
        List<ProjectFile> files = karavanCache.getProjectFiles(Project.Type.services.name());
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
        String sourceGavProperty = String.format(Property.GAV.getKeyValueFormatter(), sourceProject.getProjectId());

        String[] searchValues = {sourceProjectIdProperty, sourceProjectNameProperty, sourceGavProperty};

        String updatedProjectIdProperty = String.format(Property.PROJECT_ID.getKeyValueFormatter(), project.getProjectId());
        String updatedProjectNameProperty = String.format(Property.PROJECT_NAME.getKeyValueFormatter(), project.getName());
        String updatedGavProperty = String.format(Property.GAV.getKeyValueFormatter(), project.getProjectId());

        String[] replacementValues = {updatedProjectIdProperty, updatedProjectNameProperty, updatedGavProperty};

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
        return karavanCache.getProjects().stream()
                .filter(p -> type == null || Objects.equals(p.getType().name(), type))
                .sorted(Comparator.comparing(Project::getProjectId))
                .collect(Collectors.toList());
    }

    public Project create(Project project) throws Exception {
        boolean projectIdExists = karavanCache.getProject(project.getProjectId()) != null;

        if (projectIdExists) {
            throw new Exception("Project with id " + project.getProjectId() + " already exists");
        } else {
            karavanCache.saveProject(project);
            ProjectFile appProp = codeService.getApplicationProperties(project);
            karavanCache.saveProjectFile(appProp, false);
            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project, getMaxPortMappedInProjects() + 1);
                karavanCache.saveProjectFile(projectCompose, false);
            } else {
                ProjectFile projectCompose = codeService.createInitialDeployment(project);
                karavanCache.saveProjectFile(projectCompose, false);
            }
        }
        return project;
    }

    public Project copy(String sourceProjectId, Project project) throws Exception {
        boolean projectIdExists = karavanCache.getProject(project.getProjectId()) != null;

        if (projectIdExists) {
            throw new Exception("Project with id " + project.getProjectId() + " already exists");
        } else {

            Project sourceProject = karavanCache.getProject(sourceProjectId);

            // Save project
            karavanCache.saveProject(project);

            // Copy files from the source and make necessary modifications
            Map<String, ProjectFile> filesMap = karavanCache.getProjectFilesMap(sourceProjectId).entrySet().stream()
                    .filter(e -> !Objects.equals(e.getValue().getName(), PROJECT_COMPOSE_FILENAME) &&
                            !Objects.equals(e.getValue().getName(), PROJECT_DEPLOYMENT_JKUBE_FILENAME)
                    )
                    .collect(Collectors.toMap(
                            e -> GroupedKey.create(project.getProjectId(), DEV_ENVIRONMENT, e.getValue().getName()),
                            e -> {
                                ProjectFile file = e.getValue();
                                file.setProjectId(project.getProjectId());
                                if (Objects.equals(file.getName(), APPLICATION_PROPERTIES_FILENAME)) {
                                    modifyPropertyFileOnProjectCopy(file, sourceProject, project);
                                }
                                return file;
                            })
                    );
            karavanCache.saveProjectFiles(filesMap);

            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project, getMaxPortMappedInProjects() + 1);
                karavanCache.saveProjectFile(projectCompose, false);
            } else {
                ProjectFile projectCompose = codeService.createInitialDeployment(project);
                karavanCache.saveProjectFile(projectCompose, false);
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
        List<ProjectFile> files =  karavanCache.getProjectFilesByName(PROJECT_COMPOSE_FILENAME).stream()
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
