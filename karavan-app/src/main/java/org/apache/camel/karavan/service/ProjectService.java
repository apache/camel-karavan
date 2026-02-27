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

import io.smallrye.mutiny.tuples.Tuple3;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.*;
import org.apache.camel.karavan.docker.DockerComposeConverter;
import org.apache.camel.karavan.docker.DockerForKaravan;
import org.apache.camel.karavan.docker.DockerStackConverter;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.CommitResult;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.DockerStackService;
import org.apache.camel.karavan.model.PathCommitDetails;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.KaravanEvents.CMD_PUSH_PROJECT;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_UPDATED;
import static org.apache.camel.karavan.service.CodeService.*;

@Default
@ApplicationScoped
public class ProjectService {

    private static final Logger LOGGER = Logger.getLogger(ProjectService.class.getName());
    private static final String DEFAULT_AUTHOR_NAME = "karavan";
    private static final String DEFAULT_AUTHOR_EMAIL = "karavan@test.org";

    @ConfigProperty(name = "karavan.environment", defaultValue = DEV)
    String environment;

    @Inject
    KaravanCache karavanCache;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    ConfigService configService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    EventBus eventBus;

    @Inject
    AuthService authService;

    public List<ProjectFolder> getAllProjects(String type) {
        Map<String, Long> lastUpdates = karavanCache.getLatestUpdatePerProject();
        return karavanCache.getFolders().stream()
                .filter(p -> type == null || Objects.equals(p.getType().name(), type))
                .sorted(Comparator.comparing(ProjectFolder::getProjectId))
                .map(p -> {
                    Long lastUpdate = lastUpdates.getOrDefault(p.getProjectId(), p.getLastUpdate());
                    return new ProjectFolder(p.getProjectId(), p.getName(), lastUpdate, p.getType());
                })
                .collect(Collectors.toList());
    }

    public CommitResult commitAndPushProject(String projectId, String message, List<String> fileNames) throws Exception {
        return commitAndPushProject(projectId, message, DEFAULT_AUTHOR_NAME, DEFAULT_AUTHOR_EMAIL, fileNames);
    }

    public CommitResult commitAndPushProject(String projectId, String message, String authorName, String authorEmail, List<String> fileNames) throws Exception {
        if (Objects.equals(environment, DEV)) {
            LOGGER.info("Commit project: " + projectId);
            ProjectFolder p = karavanCache.getProject(projectId);
            List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
            Tuple3<RevCommit, List<RemoteRefUpdate.Status>, List<String>> result = gitService.commitAndPushProject(p, files, message, authorName, authorEmail, fileNames);
            var commit = result.getItem1();
            var statuses = result.getItem2();
            var messages = result.getItem3();
            if (statuses.stream().noneMatch(status -> status != RemoteRefUpdate.Status.OK)) {
                String commitId = commit.getId().getName();
                Long lastUpdate = commit.getCommitTime() * 1000L;
                importProject(projectId);
                return new CommitResult(p, statuses, messages, commitId, lastUpdate);
            } else {
                return new CommitResult(p, statuses, messages, null, null);
            }
        } else {
            throw new RuntimeException("Unsupported environment: " + environment);
        }
    }

    public String runProjectInDeveloperMode(String projectId, Boolean verbose, Boolean compile, Map<String, String> labels, Map<String, String> envVars, Boolean appOnly) throws Exception {
        PodContainerStatus status = karavanCache.getDevModePodContainerStatus(projectId, environment);
        if (status == null) {
            status = PodContainerStatus.createDevMode(projectId, environment);
        }
        if (!Objects.equals(status.getState(), PodContainerStatus.State.running.name())) {
            status.setInTransit(true);
            eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(status));

            Map<String, String> files = codeService.getProjectFilesForDevMode(projectId, true)
                    .entrySet().stream().filter(e -> !appOnly || APPLICATION_PROPERTIES_FILENAME.equals(e.getKey()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
            String projectDevmodeImage = codeService.getProjectDevModeImage(projectId);
            if (ConfigService.inKubernetes()) {
                String deploymentFragment = codeService.getDeploymentFragment(projectId);
                kubernetesService.runDevModeContainer(projectId, verbose, compile, files, projectDevmodeImage, deploymentFragment, labels, envVars);
            } else if (configService.inDockerSwarmMode()) {
                DockerStackService stack = getProjectDockerStackService(projectId);
                dockerForKaravan.runProjectInDevMode(projectId, verbose, compile, stack, projectDevmodeImage, labels, envVars);
            } else {
                DockerComposeService compose = getProjectDockerComposeService(projectId);
                dockerForKaravan.runProjectInDevMode(projectId, verbose, compile, compose, files, projectDevmodeImage, labels, envVars);
            }
            return projectId;
        } else {
            return null;
        }
    }

    public void buildProject(ProjectFolder projectFolder, String tag) throws Exception {
        tag = tag != null && !tag.isBlank()
                ? tag
                : Instant.now().toString().substring(0, 19).replace(":", "-");
        var name = projectFolder.getProjectId() + "-builder";
        var session = authService.createAndSaveSession(name, false);
        if (ConfigService.inKubernetes()) {
            String podFragment = codeService.getBuilderPodFragment();
            podFragment = codeService.substituteVariables(podFragment, Map.of( "projectId", projectFolder.getProjectId(), "tag", tag));
            kubernetesService.runBuildProject(projectFolder.getProjectId(), podFragment, Map.of(ENV_VAR_BUILDER_SESSION_ID, session.getSessionId()));
        } else if (configService.inDockerSwarmMode()) {
            String stackFragment = codeService.getBuilderStackFragment(projectFolder.getProjectId(), tag);
            DockerStackService stack = DockerStackConverter.fromCode(stackFragment, name);
            stack.addEnvironment(ENV_VAR_RUN_IN_BUILD_MODE, "true");
            stack.addEnvironment(ENV_VAR_BUILDER_SESSION_ID, session.getSessionId());
            dockerForKaravan.runBuildProject(projectFolder, stack, tag);
        } else {
            Map<String, String> sshFiles = codeService.getSshFiles();
            String script = codeService.getBuilderScript();
            String composeFragment =  codeService.getBuilderComposeFragment(projectFolder.getProjectId(), tag);
            DockerComposeService compose = DockerComposeConverter.fromCode(composeFragment, name);
            compose.addEnvironment(ENV_VAR_RUN_IN_BUILD_MODE, "true");
            compose.addEnvironment(ENV_VAR_BUILDER_SESSION_ID, session.getSessionId());
            dockerForKaravan.runBuildProject(projectFolder, script, compose, sshFiles, tag);
        }
    }

    public void importProject(String projectId) throws Exception {
        LOGGER.info("Import project from Git " + projectId);
        List<PathCommitDetails> pathCommitDetails = gitService.readProjectFromRepository(projectId);
        importProjectFromRepo(pathCommitDetails);
    }

    private void importProjectFromRepo(List<PathCommitDetails> pathCommitDetails) {
        try {
            var folderDetails = pathCommitDetails.stream().filter(PathCommitDetails::isFolder).findFirst().orElse(null);
            var filesDetails = pathCommitDetails.stream().filter(f -> !f.isFolder()).toList();
            assert folderDetails != null;
            LOGGER.info("Import project from GitRepo " + folderDetails.projectId());
            ProjectFolder projectFolder = getProjectFromRepo(folderDetails, pathCommitDetails);
            ProjectFolderCommited projectFolderCommited = getProjectCommitedFromRepo(folderDetails);
            karavanCache.saveProject(projectFolder, false);
            karavanCache.saveProjectCommited(projectFolderCommited);
            karavanCache.deleteProjectFileCommited(projectFolder.getProjectId());
            filesDetails.forEach(repoFile -> {
                ProjectFile file = new ProjectFile(repoFile.fileName(), repoFile.content(), repoFile.projectId(), repoFile.commitTime());
                karavanCache.saveProjectFile(file, repoFile.commitId(), false);
            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    public ProjectFolder getProjectFromRepo(PathCommitDetails folderDetails, List<PathCommitDetails> folderFiles) {
        String folderName = folderDetails.projectId();
        String propertiesFile = codeService.getPropertiesFile(folderFiles);
        if (propertiesFile != null) {
            String projectName = codeService.getProjectName(propertiesFile);
            return new ProjectFolder(folderName, projectName, folderDetails.commitTime());
        } else {
            return new ProjectFolder(folderName, folderName, folderDetails.commitTime());
        }
    }

    public ProjectFolderCommited getProjectCommitedFromRepo(PathCommitDetails folderDetails) {
        return new ProjectFolderCommited(folderDetails.projectId(), folderDetails.commitId(), folderDetails.commitTime());
    }

    public DockerComposeService getProjectDockerComposeService(String projectId) {
        String composeTemplate = codeService.getDockerComposeFileForProject(projectId);
        String composeCode = codeService.replaceEnvWithRuntimeProperties(composeTemplate);
        return DockerComposeConverter.fromCode(composeCode, projectId);
    }

    public DockerStackService getProjectDockerStackService(String projectId) {
        String stackTemplate = codeService.getDockerStackFileForProject(projectId);
        String stackCode = codeService.replaceEnvWithRuntimeProperties(stackTemplate);
        return DockerStackConverter.fromCode(stackCode, projectId);
    }

    private void modifyPropertyFileOnProjectCopy(ProjectFile propertyFile, ProjectFolder sourceProjectFolder, ProjectFolder projectFolder) {
        String fileContent = propertyFile.getCode();

        String sourceProjectIdProperty = String.format(PROPERTY_FORMATTER_PROJECT_ID, sourceProjectFolder.getProjectId());
        String sourceProjectNameProperty = String.format(PROPERTY_FORMATTER_PROJECT_NAME, sourceProjectFolder.getName());
        String sourceGavProperty = fileContent.lines().filter(line -> line.startsWith(PROPERTY_NAME_GAV)).findFirst().orElse("");

        String[] searchValues = {sourceProjectIdProperty, sourceProjectNameProperty, sourceGavProperty};

        String updatedProjectIdProperty = String.format(PROPERTY_FORMATTER_PROJECT_ID, projectFolder.getProjectId());
        String updatedProjectNameProperty = String.format(PROPERTY_FORMATTER_PROJECT_NAME, projectFolder.getName());
        String updatedGavProperty = String.format(codeService.getGavFormatter(), CodeService.getGavPackageSuffix(projectFolder.getProjectId()));

        String[] replacementValues = {updatedProjectIdProperty, updatedProjectNameProperty, updatedGavProperty};

        String updatedCode = StringUtils.replaceEach(fileContent, searchValues, replacementValues);

        propertyFile.setCode(updatedCode);
    }

    public void setProjectImage(String projectId, JsonObject data) {
        String imageName = data.getString("imageName");
        boolean commit = data.getBoolean("commit");
        data.put("projectId", projectId);
        data.put("fileNames", PROJECT_COMPOSE_FILENAME);
        codeService.updateDockerComposeImage(projectId, imageName);
        if (commit) {
            eventBus.publish(CMD_PUSH_PROJECT, data);
        }
    }

    public ProjectFolder create(ProjectFolder projectFolder) throws Exception {
        boolean projectIdExists = karavanCache.getProject(projectFolder.getProjectId()) != null;

        if (projectIdExists) {
            throw new Exception("Project with id " + projectFolder.getProjectId() + " already exists");
        } else {
            karavanCache.saveProject(projectFolder, true);
            ProjectFile appProp = codeService.generateApplicationProperties(projectFolder);
            karavanCache.saveProjectFile(appProp, null, true);
            if (!ConfigService.inKubernetes()) {
                var port = getMaxPortMappedInProjects() + 1;
                ProjectFile projectCompose =
                        configService.inDockerSwarmMode()
                        ? codeService.createInitialProjectStack(projectFolder, port)
                        : codeService.createInitialProjectCompose(projectFolder, port);
                karavanCache.saveProjectFile(projectCompose, null, true);
            } else {
                ProjectFile projectDeployment = codeService.createInitialDeployment(projectFolder);
                karavanCache.saveProjectFile(projectDeployment, null, true);
            }
        }
        return projectFolder;
    }

    public ProjectFolder copy(String sourceProjectId, ProjectFolder projectFolder) throws Exception {
        boolean projectIdExists = karavanCache.getProject(projectFolder.getProjectId()) != null;

        if (projectIdExists) {
            throw new Exception("Project with id " + projectFolder.getProjectId() + " already exists");
        } else {

            ProjectFolder sourceProjectFolder = karavanCache.getProject(sourceProjectId);

            // Save project
            karavanCache.saveProject(projectFolder, true);

            // Copy files from the source and make necessary modifications
            Map<String, ProjectFile> filesMap = karavanCache.getProjectFiles(sourceProjectId).stream()
                    .filter(f -> !Objects.equals(f.getName(), PROJECT_COMPOSE_FILENAME))
                    .filter(f -> !Objects.equals(f.getName(), PROJECT_STACK_FILENAME))
                    .filter(f -> !Objects.equals(f.getName(), PROJECT_DEPLOYMENT_JKUBE_FILENAME))
                    .collect(Collectors.toMap(
                            f -> GroupedKey.create(projectFolder.getProjectId(), DEV, f.getName()),
                            file -> {
                                var newFile = file.copy();
                                newFile.setProjectId(projectFolder.getProjectId());
                                if (Objects.equals(file.getName(), APPLICATION_PROPERTIES_FILENAME)) {
                                    modifyPropertyFileOnProjectCopy(newFile, sourceProjectFolder, projectFolder);
                                }
                                return newFile;
                            })
                    );

            karavanCache.saveProjectFiles(filesMap, true);

            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = null;
                var sourceComposeFile = karavanCache.getProjectFile(sourceProjectId, PROJECT_COMPOSE_FILENAME);
                if (sourceComposeFile != null) {
                    String newPort = String.valueOf(getMaxPortMappedInProjects() + 1);
                    var compose = DockerComposeConverter.fromCode(sourceComposeFile.getCode());
                    var service = compose.getServices().get(sourceProjectId);
                    service.setContainer_name(projectFolder.getProjectId());
                    service.setImage(projectFolder.getProjectId());
                    service.setPorts(service.getPorts().stream().map(s -> s.endsWith(":" + INTERNAL_PORT) ? newPort + ":" + INTERNAL_PORT : s).collect(Collectors.toList()));
                    compose.getServices().put(projectFolder.getProjectId(), service);
                    compose.getServices().remove(sourceProjectId);
                    projectCompose = new ProjectFile(PROJECT_COMPOSE_FILENAME, DockerComposeConverter.toCode(compose), projectFolder.getProjectId(), Instant.now().getEpochSecond() * 1000L);
                } else {
                    projectCompose = codeService.createInitialProjectCompose(projectFolder, getMaxPortMappedInProjects() + 1);
                }
                karavanCache.saveProjectFile(projectCompose, null, true);
            } else {
                ProjectFile projectCompose = codeService.createInitialDeployment(projectFolder);
                karavanCache.saveProjectFile(projectCompose, null, true);
            }

            return projectFolder;
        }
    }

    public Integer getProjectPort(ProjectFile composeFile) {
        try {
            if (composeFile != null) {
                DockerComposeService dcs = DockerComposeConverter.fromCode(composeFile.getCode(), composeFile.getProjectId());
                Optional<Integer> port = dcs.getPortsMap().entrySet().stream()
                        .filter(e -> Objects.equals(e.getValue(), INTERNAL_PORT)).map(Map.Entry::getKey).findFirst();
                return port.orElse(null);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public int getMaxPortMappedInProjects() {
        try {
            List<ProjectFile> files = karavanCache.getProjectFilesByName(PROJECT_COMPOSE_FILENAME).stream()
                    .filter(f -> !Objects.equals(f.getProjectId(), ProjectFolder.Type.templates.name()))
                    .filter(f -> !Objects.equals(f.getProjectId(), ProjectFolder.Type.kamelets.name()))
                    .filter(f -> !Objects.equals(f.getProjectId(), ProjectFolder.Type.contracts.name()))
                    .filter(f -> !Objects.equals(f.getProjectId(), ProjectFolder.Type.configuration.name()))
                    .toList();
            if (!files.isEmpty()) {
                return files.stream().map(this::getProjectPort)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .max().orElse(INTERNAL_PORT);
            } else {
                return INTERNAL_PORT;
            }
        } catch (Exception e) {
            return INTERNAL_PORT;
        }
    }

    public void importProjects(boolean onlyNew) {
        LOGGER.info("Import " +(onlyNew ? "Only New" : "")+ " projects from git: " + gitService.getGitConfig().getUri());
        try {
            List<PathCommitDetails> pathCommitDetails = onlyNew ? gitService.readAllProjectsFromRepository() : gitService.readProjectsToImport();
            List<PathCommitDetails> projectPaths = pathCommitDetails.stream().filter(PathCommitDetails::isFolder).toList();
            projectPaths.forEach(folderDetails -> {
                ProjectFolder projectFolder;
                ProjectFolderCommited projectFolderCommited;
                String folderName = folderDetails.projectId();
                var folderFiles = pathCommitDetails.stream().filter(d -> !d.isFolder() && Objects.equals(d.projectId(), folderName)).toList();

                boolean needImport = !onlyNew || karavanCache.getProject(folderName) == null;
                LOGGER.info("Project " + folderName + " " + (needImport ? "is loading!" : "skipped!"));

                if (needImport) {
                    if (folderName.equals(ProjectFolder.Type.templates.name())) {
                        projectFolder = new ProjectFolder(ProjectFolder.Type.templates.name(), "Templates", folderDetails.commitTime(), ProjectFolder.Type.templates);
                    } else if (folderName.equals(ProjectFolder.Type.kamelets.name())) {
                        projectFolder = new ProjectFolder(ProjectFolder.Type.kamelets.name(), "Custom Kamelets",  folderDetails.commitTime(), ProjectFolder.Type.kamelets);
                    } else if (folderName.equals(ProjectFolder.Type.configuration.name())) {
                        projectFolder = new ProjectFolder(ProjectFolder.Type.configuration.name(), "Configuration",  folderDetails.commitTime(), ProjectFolder.Type.configuration);
                    } else if (folderName.equals(ProjectFolder.Type.documentation.name())) {
                        projectFolder = new ProjectFolder(ProjectFolder.Type.documentation.name(), "Documentation",  folderDetails.commitTime(), ProjectFolder.Type.documentation);
                    } else {
                        projectFolder = getProjectFromRepo(folderDetails, folderFiles);
                    }
                    karavanCache.saveProject(projectFolder, true);
                    projectFolderCommited = new ProjectFolderCommited(projectFolder.getProjectId(), folderDetails.commitId(), folderDetails.commitTime());
                    karavanCache.saveProjectCommited(projectFolderCommited);


                    folderFiles.forEach(fileDetails -> {
                        var file = new ProjectFile(fileDetails.fileName(), fileDetails.content(), folderName, fileDetails.commitTime());
                        var commitedFile = ProjectFileCommited.fromFile(file, fileDetails.commitId());
                        karavanCache.saveProjectFileCommited(commitedFile);
                        var fileInCache = karavanCache.getProjectFile(file.getProjectId(), file.getName());
                        if (fileInCache == null || fileInCache.getLastUpdate() < file.getLastUpdate()) {
                            karavanCache.saveProjectFile(file, null, false);
                        }
                    });
                }
            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }
}
