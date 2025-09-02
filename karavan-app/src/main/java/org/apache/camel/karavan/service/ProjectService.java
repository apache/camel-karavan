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
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
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
    KubernetesService kubernetesService;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    EventBus eventBus;


    public Project commitAndPushProject(String projectId, String message, List<String> fileNames) throws Exception {
        return commitAndPushProject(projectId, message, DEFAULT_AUTHOR_NAME, DEFAULT_AUTHOR_EMAIL, fileNames);
    }

    public Project commitAndPushProject(String projectId, String message, String authorName, String authorEmail, List<String> fileNames) throws Exception {
        if (Objects.equals(environment, DEV)) {
            LOGGER.info("Commit project: " + projectId);
            Project p = karavanCache.getProject(projectId);
            List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
            RevCommit commit = gitService.commitAndPushProject(p, files, message, authorName, authorEmail, fileNames);
            karavanCache.syncFilesCommited(projectId, fileNames);
            String commitId = commit.getId().getName();
            Long lastUpdate = commit.getCommitTime() * 1000L;
            p.setLastCommit(commitId);
            p.setLastCommitTimestamp(lastUpdate);
            karavanCache.saveProject(p, false);
            return p;
        } else {
            throw new RuntimeException("Unsupported environment: " + environment);
        }
    }

    public String runProjectInDeveloperMode(String projectId, Boolean verbose, Boolean compile, Map<String, String> labels, Map<String, String> envVars) throws Exception {
        String containerName = projectId;
        PodContainerStatus status = karavanCache.getDevModePodContainerStatus(projectId, environment);
        if (status == null) {
            status = PodContainerStatus.createDevMode(projectId, environment);
        }
        if (!Objects.equals(status.getState(), PodContainerStatus.State.running.name())) {
            status.setInTransit(true);
            eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(status));

            Map<String, String> files = codeService.getProjectFilesForDevMode(projectId, true);
            String projectDevmodeImage = codeService.getProjectDevModeImage(projectId);
            if (ConfigService.inKubernetes()) {
                String deploymentFragment = codeService.getDeploymentFragment(projectId);
                kubernetesService.runDevModeContainer(projectId, verbose, compile, files, projectDevmodeImage, deploymentFragment, labels, envVars);
            } else {
                DockerComposeService compose = getProjectDockerComposeService(projectId);
                dockerForKaravan.runProjectInDevMode(projectId, verbose, compile, compose, files, projectDevmodeImage, labels, envVars);
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

        if (ConfigService.inKubernetes()) {
            String podFragment = codeService.getBuilderPodFragment();
            podFragment = codeService.substituteVariables(podFragment, Map.of( "projectId", project.getProjectId(), "tag", tag));
            kubernetesService.runBuildProject(project.getProjectId(), podFragment);
        } else {
            Map<String, String> sshFiles = getSshFiles();
            String composeFragment =  codeService.getBuilderComposeFragment(project.getProjectId(), tag);
            DockerComposeService compose = DockerComposeConverter.fromCode(composeFragment, project.getProjectId() + "-builder");
            String script = codeService.getBuilderScript();
            dockerForKaravan.runBuildProject(project, script, compose, sshFiles, tag);
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

    public void importProject(String projectId) throws Exception {
        LOGGER.info("Import project from Git " + projectId);
        GitRepo repo = gitService.readProjectFromRepository(projectId);
        importProjectFromRepo(repo);
    }

    public void importProjectFromArchiveFile(InputStream projectArchiveInputStream, boolean overwriteExistingFiles) throws Exception {
        LOGGER.info("Import project(s) from archive file");
        try {
            ZipArchiveInputStream zipArchiveInputStream = new ZipArchiveInputStream(projectArchiveInputStream);
            ZipArchiveEntry zipArchiveEntry = zipArchiveInputStream.getNextEntry();
            Map<String, String> projects = new HashMap<>();
            Map<String, List<ProjectFile>> files = new HashMap<>();
            while (zipArchiveEntry != null) {
                if (zipArchiveInputStream.canReadEntryData(zipArchiveEntry)) {
                    String zipArchiveEntryName = zipArchiveEntry.getName().replace("\\", "/");
                    if (!zipArchiveEntry.isDirectory() && StringUtils.countMatches(zipArchiveEntryName, "/") == 1) {
                        String[] nameParts = zipArchiveEntryName.split("/");
                        if (Arrays.stream(nameParts).allMatch(name -> !name.isBlank() && !name.equals(".") && !name.equals(".."))) {
                            String parentFolderName = nameParts[nameParts.length - 2];
                            String fileName = nameParts[nameParts.length - 1];
                            if (parentFolderName.matches("[a-zA-Z0-9-]{5,}")) {
                                boolean projectFileExists = karavanCache.getProjectFile(parentFolderName, fileName) != null;
                                if (!projectFileExists || overwriteExistingFiles) {
                                    LOGGER.debug("Importing file: " + zipArchiveEntryName);
                                    ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                                    byte[] buffer = new byte[4096];
                                    int len;
                                    while ((len = zipArchiveInputStream.read(buffer)) != -1) {
                                        byteArrayOutputStream.write(buffer, 0, len);
                                    }
                                    String fileContent = byteArrayOutputStream.toString(zipArchiveInputStream.getCharset());
                                    if (fileName.equals(APPLICATION_PROPERTIES_FILENAME)) {
                                        String projectName = codeService.getProjectName(fileContent);
                                        projects.put(parentFolderName, projectName);
                                    } else if (!projects.containsKey(parentFolderName)) {
                                        projects.put(parentFolderName, parentFolderName);
                                    }
                                    List<ProjectFile> projectFiles = new ArrayList<>();
                                    if (files.containsKey(parentFolderName)) {
                                        projectFiles.addAll(files.get(parentFolderName));
                                    }
                                    projectFiles.add(new ProjectFile(fileName, fileContent, parentFolderName, null));
                                    files.put(parentFolderName, projectFiles);
                                } else {
                                    LOGGER.debug("Skipping file: " + zipArchiveEntryName);
                                }
                            }
                        }
                    }
                    zipArchiveEntry = zipArchiveInputStream.getNextEntry();
                }
            }
            zipArchiveInputStream.close();

            for (Map.Entry<String, String> entry : projects.entrySet()) {
                Project project = new Project(entry.getKey(), entry.getValue());
                karavanCache.saveProject(project, false);
            }

            for (Map.Entry<String, List<ProjectFile>> entry : files.entrySet()) {
                for (ProjectFile projectFile : entry.getValue()) {
                    karavanCache.saveProjectFile(projectFile, false, false);
                }
            }

        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
            throw e;
        }
    }

    private void importProjectFromRepo(GitRepo repo) {
        LOGGER.info("Import project from GitRepo " + repo.getName());
        try {
            Project project = getProjectFromRepo(repo);
            karavanCache.saveProject(project, false);
            repo.getFiles().forEach(repoFile -> {
                ProjectFile file = new ProjectFile(repoFile.getName(), repoFile.getBody(), repo.getName(), repoFile.getLastCommitTimestamp());
                karavanCache.saveProjectFile(file, true, false);
            });
            karavanCache.syncFilesCommited(project.getProjectId(), karavanCache.getProjectFiles(project.getProjectId()).stream().map(ProjectFile::getName).collect(Collectors.toList()));
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    public byte[] downloadProjectArchiveFile(String projectId) throws Exception {
        Project project = karavanCache.getProject(projectId);
        if (project != null) {

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            ZipArchiveOutputStream zipOutputStream = new ZipArchiveOutputStream(byteArrayOutputStream);
            List<ProjectFile> projectFiles = karavanCache.getProjectFiles(projectId);

            for (ProjectFile projectFile : projectFiles) {
                ZipArchiveEntry entry = new ZipArchiveEntry(projectId + "/" + projectFile.getName());
                byte[] data = projectFile.getCode().getBytes(StandardCharsets.UTF_8);
                entry.setSize(data.length);
                zipOutputStream.putArchiveEntry(entry);
                zipOutputStream.write(data);
                zipOutputStream.closeArchiveEntry();
            }

            zipOutputStream.finish();
            return byteArrayOutputStream.toByteArray();
        }
        return null;
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

    public String getDockerDevServiceCode() {
        List<ProjectFile> files = karavanCache.getProjectFiles(Project.Type.services.name());
        Optional<ProjectFile> file = files.stream().filter(f -> f.getName().equals(DEV_SERVICES_FILENAME)).findFirst();
        return file.orElse(new ProjectFile()).getCode();
    }

    public String getKubernetesDevServiceCode(String name) {
        List<ProjectFile> files = karavanCache.getProjectFiles(Project.Type.services.name());
        Optional<ProjectFile> file = files.stream().filter(f -> f.getName().equals(name + ".yaml")).findFirst();
        return file.orElse(new ProjectFile()).getCode();
    }

    public DockerComposeService getProjectDockerComposeService(String projectId) {
        String composeTemplate = codeService.getDockerComposeFileForProject(projectId);
        String composeCode = codeService.replaceEnvWithRuntimeProperties(composeTemplate);
        return DockerComposeConverter.fromCode(composeCode, projectId);
    }

    private void modifyPropertyFileOnProjectCopy(ProjectFile propertyFile, Project sourceProject, Project project) {
        String fileContent = propertyFile.getCode();

        String sourceProjectIdProperty = String.format(PROPERTY_FORMATTER_PROJECT_ID, sourceProject.getProjectId());
        String sourceProjectNameProperty = String.format(PROPERTY_FORMATTER_PROJECT_NAME, sourceProject.getName());
        String sourceGavProperty = fileContent.lines().filter(line -> line.startsWith(PROPERTY_NAME_GAV)).findFirst().orElse("");

        String[] searchValues = {sourceProjectIdProperty, sourceProjectNameProperty, sourceGavProperty};

        String updatedProjectIdProperty = String.format(PROPERTY_FORMATTER_PROJECT_ID, project.getProjectId());
        String updatedProjectNameProperty = String.format(PROPERTY_FORMATTER_PROJECT_NAME, project.getName());
        String updatedGavProperty = String.format(codeService.getGavFormatter(), project.getGavPackageSuffix());

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
            karavanCache.saveProject(project, false);
            ProjectFile appProp = codeService.generateApplicationProperties(project);
            karavanCache.saveProjectFile(appProp, false, false);
            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project, getMaxPortMappedInProjects() + 1);
                karavanCache.saveProjectFile(projectCompose, false, false);
            } else {
                ProjectFile projectDeployment = codeService.createInitialDeployment(project);
                karavanCache.saveProjectFile(projectDeployment, false, false);
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
            karavanCache.saveProject(project, false);

            // Copy files from the source and make necessary modifications
            Map<String, ProjectFile> filesMap = karavanCache.getProjectFilesMap(sourceProjectId).entrySet().stream()
                    .filter(e -> !Objects.equals(e.getValue().getName(), PROJECT_COMPOSE_FILENAME))
                    .filter(e -> !Objects.equals(e.getValue().getName(), PROJECT_DEPLOYMENT_JKUBE_FILENAME))
                    .collect(Collectors.toMap(
                            e -> GroupedKey.create(project.getProjectId(), DEV, e.getValue().getName()),
                            e -> {
                                ProjectFile file = e.getValue();
                                file.setProjectId(project.getProjectId());
                                if (Objects.equals(file.getName(), APPLICATION_PROPERTIES_FILENAME)) {
                                    modifyPropertyFileOnProjectCopy(file, sourceProject, project);
                                }
                                return file;
                            })
                    );
            karavanCache.saveProjectFiles(filesMap, false);

            if (!ConfigService.inKubernetes()) {
                ProjectFile projectCompose = codeService.createInitialProjectCompose(project, getMaxPortMappedInProjects() + 1);
                karavanCache.saveProjectFile(projectCompose, false, false);
            } else {
                ProjectFile projectCompose = codeService.createInitialDeployment(project);
                karavanCache.saveProjectFile(projectCompose, false, false);
            }

            return project;
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

    private int getMaxPortMappedInProjects() {
        try {
            List<ProjectFile> files = karavanCache.getProjectFilesByName(PROJECT_COMPOSE_FILENAME).stream()
                    .filter(f -> !Objects.equals(f.getProjectId(), Project.Type.templates.name()))
                    .filter(f -> !Objects.equals(f.getProjectId(), Project.Type.kamelets.name()))
                    .filter(f -> !Objects.equals(f.getProjectId(), Project.Type.configuration.name()))
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
}
