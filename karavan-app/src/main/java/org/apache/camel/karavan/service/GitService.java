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

import io.fabric8.kubernetes.api.model.Secret;
import io.quarkus.runtime.StartupEvent;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.Vertx;
import org.apache.camel.karavan.model.GitConfig;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.jgit.api.*;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.microprofile.config.ConfigProvider;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@ApplicationScoped
public class GitService {

    @Inject
    Vertx vertx;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    InfinispanService infinispanService;

    private static final Logger LOGGER = Logger.getLogger(GitService.class.getName());

    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("Git service for repo: " + getGitConfig().getUri());
    }

    private GitConfig getGitConfig() {
        String propertiesPrefix = "karavan.";
        String branch = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-branch", String.class);
        if (kubernetesService.inKubernetes()){
            LOGGER.info("inKubernetes " + kubernetesService.getNamespace());
            Secret secret =  kubernetesService.getKaravanSecret();
            String uri = new String(Base64.getDecoder().decode(secret.getData().get("git-repository").getBytes(StandardCharsets.UTF_8)));
            String username = new String(Base64.getDecoder().decode(secret.getData().get("git-username").getBytes(StandardCharsets.UTF_8)));
            String password = new String(Base64.getDecoder().decode(secret.getData().get("git-password").getBytes(StandardCharsets.UTF_8)));
            if (secret.getData().containsKey("git-branch")){
                branch = new String(Base64.getDecoder().decode(secret.getData().get("git-branch").getBytes(StandardCharsets.UTF_8)));
            }
            return new GitConfig(uri, username, password, branch);
        } else {
            String uri = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-repository", String.class);
            String username = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-username", String.class);
            String password = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-password", String.class);
            return new GitConfig(uri, username, password, branch);
        }
    }

    public Project commitAndPushProject(Project project) throws Exception {
        Project p = infinispanService.getProject(project.getProjectId());
        List<ProjectFile> files = infinispanService.getProjectFiles(project.getProjectId());
        String commitId = commitAndPushProject(p, files);
        p.setLastCommit(commitId);
        infinispanService.saveProject(p, false);
        return p;
    }

    public String commitAndPushProject(Project project, List<ProjectFile> files) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push project " + project.getProjectId());
        GitConfig gitConfig = getGitConfig();
        CredentialsProvider cred = new UsernamePasswordCredentialsProvider(gitConfig.getUsername(), gitConfig.getPassword());
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        LOGGER.info("Temp folder created " + folder);
        Git git = null;
        try {
            git = clone(folder, gitConfig.getUri(), gitConfig.getBranch(), cred);
            checkout(git, false, null, null, gitConfig.getBranch());
        } catch (RefNotFoundException e) {
            LOGGER.error("New repository");
            git = init(folder, gitConfig.getUri(), gitConfig.getBranch());
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
        writeProjectToFolder(folder, project, files);
        addDeletedFilesToIndex(git, folder, project, files);
        return commitAddedAndPush(git, gitConfig.getBranch(), cred, project.getProjectId()).getId().getName();
    }

    public List<Tuple2<String, Map<String, String>>> readProjectsFromRepository() {
        LOGGER.info("Read projects...");
        GitConfig gitConfig = getGitConfig();
        LOGGER.info("Read projects from repository " + gitConfig.getUri());
        CredentialsProvider cred = new UsernamePasswordCredentialsProvider(gitConfig.getUsername(), gitConfig.getPassword());
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        LOGGER.infof("Temp folder created: %s", folder);
        List<Tuple2<String, Map<String, String>>> result = new ArrayList<>();
        Git git = null;
        try {
            git = clone(folder, gitConfig.getUri(), gitConfig.getBranch(), cred);
            checkout(git, false, null, null, gitConfig.getBranch());
            List<String> projects = readProjectsFromFolder(folder);
            projects.forEach(project -> {
                Map<String, String> files = readProjectFilesFromFolder(folder, project);
                result.add(Tuple2.of(project, files));
            });
            return result;
        } catch (RefNotFoundException e) {
            LOGGER.error("New repository");
            return result;
        } catch (Exception e) {
            LOGGER.error("Error", e);
            return result;
        }
    }

    private List<Tuple2<String, String>> readKameletsFromFolder(String folder) {
        LOGGER.info("Read kamelets from " + folder);
        List<Tuple2<String, String>> kamelets = new ArrayList<>();
        vertx.fileSystem().readDirBlocking(folder).stream().filter(f -> f.endsWith("kamelet.yaml")).forEach(f -> {
            Path path = Paths.get(f);
            try {
                String yaml = Files.readString(path);
                kamelets.add(Tuple2.of(path.getFileName().toString(), yaml));
            } catch (IOException e) {
                LOGGER.error("Error during file read", e);
            }
        });
        return kamelets;
    }

    private List<String> readProjectsFromFolder(String folder) {
        LOGGER.info("Read projects from " + folder);
        List<String> files = new ArrayList<>();
        vertx.fileSystem().readDirBlocking(folder).forEach(f -> {
            String[] filenames = f.split(File.separator);
            String folderName = filenames[filenames.length -1];
            if (!folderName.startsWith(".") && Files.isDirectory(Paths.get(f))) {
                LOGGER.info("Importing project from folder " + folderName);
                files.add(folderName);
            }
        });
        return files;
    }

    private Map<String, String> readProjectFilesFromFolder(String repoFolder, String projectFolder) {
        LOGGER.infof("Read files from %s/%s", repoFolder, projectFolder );
        Map<String, String> files = new HashMap<>();
        vertx.fileSystem().readDirBlocking(repoFolder + File.separator + projectFolder).forEach(f -> {
            String[] filenames = f.split(File.separator);
            String filename = filenames[filenames.length -1];
            if (!filename.startsWith(".") && !Files.isDirectory(Paths.get(f))) {
                LOGGER.info("Importing file " + filename);
                try {
                    files.put(filename, Files.readString(Paths.get(f)));
                } catch (IOException e) {
                    LOGGER.error("Error during file read", e);
                }
            }
        });
        return files;
    }

    private void writeProjectToFolder(String folder, Project project, List<ProjectFile> files) throws IOException {
        Files.createDirectories(Paths.get(folder, project.getProjectId()));
        LOGGER.info("Write files for project " + project.getProjectId());
        files.forEach(file -> {
            try {
                LOGGER.info("Add file " + file.getName());
                Files.writeString(Paths.get(folder, project.getProjectId(), file.getName()), file.getCode());
            } catch (IOException e) {
                LOGGER.error("Error during file write", e);
            }
        });
    }

    private void addDeletedFilesToIndex(Git git, String folder, Project project, List<ProjectFile> files) throws IOException {
        Path path = Paths.get(folder, project.getProjectId());
        LOGGER.info("Add deleted files to git index for project " + project.getProjectId());
        vertx.fileSystem().readDirBlocking(path.toString()).forEach(f -> {
            String[] filenames = f.split(File.separator);
            String filename = filenames[filenames.length -1];
            LOGGER.info("Checking file " + filename);
            if (files.stream().filter(pf -> Objects.equals(pf.getName(), filename)).count() == 0){
                try {
                    LOGGER.info("Add deleted file " + filename);
                    git.rm().addFilepattern(project.getProjectId() + File.separator + filename).call();
                } catch (GitAPIException e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    public RevCommit commitAddedAndPush(Git git, String branch, CredentialsProvider cred, String message) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push changes");
        LOGGER.info("Git add: " + git.add().addFilepattern(".").call());
        RevCommit commit = git.commit().setMessage(LocalDateTime.now() + ": " + message).call();
        LOGGER.info("Git commit: " + commit);
        Iterable<PushResult> result = git.push().add(branch).setRemote("origin").setCredentialsProvider(cred).call();
        LOGGER.info("Git push: " + result);
        return commit;
    }

    public Git init(String dir, String uri, String branch) throws GitAPIException, IOException, URISyntaxException {
        Git git = Git.init().setInitialBranch(branch).setDirectory(Path.of(dir).toFile()).call();
        addRemote(git, uri);
        return git;
    }

    private Git clone(String dir, String uri, String branch, CredentialsProvider cred) throws GitAPIException {
        CloneCommand cloneCommand = Git.cloneRepository();
        cloneCommand.setCloneAllBranches(false);
        cloneCommand.setDirectory(Paths.get(dir).toFile());
        cloneCommand.setURI(uri);
        cloneCommand.setBranch(branch);
        cloneCommand.setCredentialsProvider(cred);
        return cloneCommand.call();
    }

    private void addRemote(Git git, String uri) throws URISyntaxException, GitAPIException {
        // add remote repo:
        RemoteAddCommand remoteAddCommand = git.remoteAdd();
        remoteAddCommand.setName("origin");
        remoteAddCommand.setUri(new URIish(uri));
        remoteAddCommand.call();
    }

    private void checkout(Git git, boolean create, String path, String startPoint, String branch) throws GitAPIException {
        // create branch:
        CheckoutCommand checkoutCommand = git.checkout();
        checkoutCommand.setName(branch);
        checkoutCommand.setCreateBranch(create);
        if (startPoint != null){
            checkoutCommand.setStartPoint(startPoint);
        }
        if (path != null) {
            checkoutCommand.addPath(path);
        }
        checkoutCommand.call();
    }
}
