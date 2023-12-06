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
package org.apache.camel.karavan.git;

import io.fabric8.kubernetes.api.model.Secret;
import io.quarkus.oidc.UserInfo;
import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.git.model.GitConfig;
import org.apache.camel.karavan.git.model.GitRepo;
import org.apache.camel.karavan.git.model.GitRepoFile;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.jgit.api.*;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.*;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.TreeFilter;
import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.jboss.logging.Logger;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@ApplicationScoped
public class GitService {

    @Inject
    Vertx vertx;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    SecurityIdentity securityIdentity;

    private Git gitForImport;

    private static final Logger LOGGER = Logger.getLogger(GitService.class.getName());

    public Git getGitForImport(){
        if (gitForImport == null) {
            try {
                gitForImport = getGit(true, vertx.fileSystem().createTempDirectoryBlocking("import"));
            } catch (Exception e) {
                LOGGER.error("Error", e);
            }
        }
        return gitForImport;
    }

    public GitConfig getGitConfig() {
        String propertiesPrefix = "karavan.";
        String branch = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-branch", String.class);
        if (ConfigService.inKubernetes()) {
            String uri = kubernetesService.getKaravanSecret("git-repository");
            String username = kubernetesService.getKaravanSecret("git-username");
            String password = kubernetesService.getKaravanSecret("git-password");
            String branchInSecret = kubernetesService.getKaravanSecret("git-branch");
            branch = branchInSecret != null ? branchInSecret : branch;
            return new GitConfig(uri, username, password, branch);
        } else if (ConfigService.inDocker()) {
            String uri = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-repository", String.class);
            String username = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-username", String.class);
            String password = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-password", String.class);
            return new GitConfig(uri, username, password, branch);
        } else {
            Boolean giteaInstall = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-install-gitea", Boolean.class);
            String uri = giteaInstall
                    ? "http://localhost:3000/karavan/karavan.git"
                    : ConfigProvider.getConfig().getValue(propertiesPrefix + "git-repository", String.class);
            String username = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-username", String.class);
            String password = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-password", String.class);
            return new GitConfig(uri, username, password, branch);
        }
    }

    public List<String> getEnvForBuild() {
        GitConfig gitConfig = getGitConfigForBuilder();
        return List.of(
                "GIT_REPOSITORY=" + gitConfig.getUri(),
                "GIT_USERNAME=" + gitConfig.getUsername(),
                "GIT_PASSWORD=" + gitConfig.getPassword(),
                "GIT_BRANCH=" + gitConfig.getBranch());
    }

    public GitConfig getGitConfigForBuilder() {
        String propertiesPrefix = "karavan.";
        String branch = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-branch", String.class);
        if (ConfigService.inKubernetes()) {
            LOGGER.info("inKubernetes " + kubernetesService.getNamespace());
            Secret secret = kubernetesService.getKaravanSecret();
            String uri = kubernetesService.getKaravanSecret("git-repository");
            String username = kubernetesService.getKaravanSecret("git-username");
            String password = kubernetesService.getKaravanSecret("git-password");
            if (secret.getData().containsKey("git-branch")) {
                branch = kubernetesService.getKaravanSecret("git-branch");
            }
            return new GitConfig(uri, username, password, branch);
        } else {
            String uri = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-repository", String.class);
            String username = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-username", String.class);
            String password = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-password", String.class);
            return new GitConfig(uri, username, password, branch);
        }
    }

    public RevCommit commitAndPushProject(Project project, List<ProjectFile> files, String message) throws GitAPIException, IOException, URISyntaxException {
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
        } catch (RefNotFoundException | TransportException e) {
            LOGGER.error("New repository");
            git = init(folder, gitConfig.getUri(), gitConfig.getBranch());
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
        writeProjectToFolder(folder, project, files);
        addDeletedFilesToIndex(git, folder, project, files);
        return commitAddedAndPush(git, gitConfig.getBranch(), cred, message);
    }

    public List<GitRepo> readProjectsToImport() {
        Git importGit = getGitForImport();
        if (importGit != null) {
            return readProjectsFromRepository(importGit, new String[0]);
        }
        return new ArrayList<>(0);
    }

    public GitRepo readProjectFromRepository(String projectId) throws GitAPIException, IOException, URISyntaxException {
        Git git = getGit(true, vertx.fileSystem().createTempDirectoryBlocking(UUID.randomUUID().toString()));
        return readProjectsFromRepository(git, projectId).get(0);
    }

    private List<GitRepo> readProjectsFromRepository(Git git, String... filter) {
        LOGGER.info("Read projects...");
        List<GitRepo> result = new ArrayList<>();
        try {
            String folder = git.getRepository().getDirectory().getAbsolutePath().replace("/.git", "");
            List<String> projects = readProjectsFromFolder(folder, filter);
            for (String project : projects) {
                Map<String, String> filesRead = readProjectFilesFromFolder(folder, project);
                List<GitRepoFile> files = new ArrayList<>(filesRead.size());
                for (Map.Entry<String, String> entry : filesRead.entrySet()) {
                    String name = entry.getKey();
                    String body = entry.getValue();
                    Tuple2<String, Integer> fileCommit = lastCommit(git, project + File.separator + name);
                    files.add(new GitRepoFile(name, Integer.valueOf(fileCommit.getItem2()).longValue() * 1000, body));
                }
                Tuple2<String, Integer> commit = lastCommit(git, project);
                GitRepo repo = new GitRepo(project, commit.getItem1(), Integer.valueOf(commit.getItem2()).longValue() * 1000, files);
                result.add(repo);
            }
            return result;
        } catch (RefNotFoundException e) {
            LOGGER.error("New repository");
            return result;
        } catch (Exception e) {
            LOGGER.error("Error", e);
            return result;
        }
    }

    public Git getGit(boolean checkout, String folder) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Git checkout");
        GitConfig gitConfig = getGitConfig();
        CredentialsProvider cred = new UsernamePasswordCredentialsProvider(gitConfig.getUsername(), gitConfig.getPassword());
        LOGGER.info("Temp folder created " + folder);
        Git git = null;
        try {
            git = clone(folder, gitConfig.getUri(), gitConfig.getBranch(), cred);
            if (checkout) {
                checkout(git, false, null, null, gitConfig.getBranch());
            }
        } catch (RefNotFoundException | TransportException e) {
            LOGGER.error("New repository");
            git = init(folder, gitConfig.getUri(), gitConfig.getBranch());
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
        return git;
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

    private List<String> readProjectsFromFolder(String folder, String... filter) {
        LOGGER.info("Read projects from " + folder);
        List<String> files = new ArrayList<>();
        vertx.fileSystem().readDirBlocking(folder).forEach(path -> {
            String[] filenames = path.split(File.separator);
            String folderName = filenames[filenames.length - 1];
            if (folderName.startsWith(".")) {
                // skip hidden
            } else if (Files.isDirectory(Paths.get(path))) {
                if (filter == null || filter.length == 0 || Arrays.stream(filter).filter(f -> f.equals(folderName)).findFirst().isPresent()) {
                    LOGGER.info("Importing project from folder " + folderName);
                    files.add(folderName);
                }
            }
        });
        return files;
    }

    private Map<String, String> readProjectFilesFromFolder(String repoFolder, String projectFolder) {
        LOGGER.infof("Read files from %s/%s", repoFolder, projectFolder);
        Map<String, String> files = new HashMap<>();
        vertx.fileSystem().readDirBlocking(repoFolder + File.separator + projectFolder).forEach(f -> {
            String[] filenames = f.split(File.separator);
            String filename = filenames[filenames.length - 1];
            Path path = Paths.get(f);
            if (!filename.startsWith(".") && !Files.isDirectory(path)) {
                LOGGER.info("Importing file " + filename);
                try {
                    files.put(filename, Files.readString(path));
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
            String filename = filenames[filenames.length - 1];
            LOGGER.info("Checking file " + filename);
            if (files.stream().filter(pf -> Objects.equals(pf.getName(), filename)).count() == 0) {
                try {
                    LOGGER.info("Add deleted file " + filename);
                    git.rm().addFilepattern(project.getProjectId() + File.separator + filename).call();
                } catch (GitAPIException e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    public RevCommit commitAddedAndPush(Git git, String branch, CredentialsProvider cred, String message) throws GitAPIException {
        LOGGER.info("Commit and push changes");
        LOGGER.info("Git add: " + git.add().addFilepattern(".").call());
        RevCommit commit = git.commit().setMessage(message).setAuthor(getPersonIdent()).call();
        LOGGER.info("Git commit: " + commit);
        Iterable<PushResult> result = git.push().add(branch).setRemote("origin").setCredentialsProvider(cred).call();
        LOGGER.info("Git push: " + result);
        return commit;
    }

    private PersonIdent getPersonIdent() {
        if (securityIdentity != null && securityIdentity.getAttributes().get("userinfo") != null) {
            UserInfo userInfo = (UserInfo) securityIdentity.getAttributes().get("userinfo");
            return new PersonIdent(securityIdentity.getPrincipal().getName(), userInfo.getEmail());
        }
        return new PersonIdent("karavan", "karavan@test.org");
    }

    public Git init(String dir, String uri, String branch) throws GitAPIException, IOException, URISyntaxException {
        Git git = Git.init().setInitialBranch(branch).setDirectory(Path.of(dir).toFile()).call();
//        git.branchCreate().setName(branch).call();
        addRemote(git, uri);
        return git;
    }

    private void addDeletedFolderToIndex(Git git, String folder, String projectId, List<ProjectFile> files) {
        LOGGER.infof("Add folder %s to git index.", projectId);
        try {
            git.rm().addFilepattern(projectId + File.separator).call();
        } catch (GitAPIException e) {
            throw new RuntimeException(e);
        }
    }

    public void deleteProject(String projectId, List<ProjectFile> files) {
        LOGGER.info("Delete and push project " + projectId);
        GitConfig gitConfig = getGitConfig();
        CredentialsProvider cred = new UsernamePasswordCredentialsProvider(gitConfig.getUsername(), gitConfig.getPassword());
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        String commitMessage = "Project " + projectId + " is deleted";
        LOGGER.infof("Temp folder %s is created for deletion of project %s", folder, projectId);
        Git git = null;
        try {
            git = clone(folder, gitConfig.getUri(), gitConfig.getBranch(), cred);
            checkout(git, false, null, null, gitConfig.getBranch());
            addDeletedFolderToIndex(git, folder, projectId, files);
            commitAddedAndPush(git, gitConfig.getBranch(), cred, commitMessage);
            LOGGER.info("Delete Temp folder " + folder);
            vertx.fileSystem().deleteRecursiveBlocking(folder, true);
            LOGGER.infof("Project %s deleted from Git", projectId);
        } catch (RefNotFoundException e) {
            LOGGER.error("Repository not found");
        } catch (Exception e) {
            LOGGER.error("Error", e);
            throw new RuntimeException(e);
        }
    }

    private Git clone(String dir, String uri, String branch, CredentialsProvider cred) throws GitAPIException, URISyntaxException {
        CloneCommand cloneCommand = Git.cloneRepository();
        cloneCommand.setCloneAllBranches(false);
        cloneCommand.setDirectory(Paths.get(dir).toFile());
        cloneCommand.setURI(uri);
        cloneCommand.setBranch(branch);
        cloneCommand.setCredentialsProvider(cred);
        Git git = cloneCommand.call();
        addRemote(git, uri);
        return git;
    }

    private void addRemote(Git git, String uri) throws URISyntaxException, GitAPIException {
        // add remote repo:
        RemoteAddCommand remoteAddCommand = git.remoteAdd();
        remoteAddCommand.setName("origin");
        remoteAddCommand.setUri(new URIish(uri));
        remoteAddCommand.call();
    }

    private void fetch(Git git, CredentialsProvider cred) throws GitAPIException {
        // fetch:
        FetchCommand fetchCommand = git.fetch();
        fetchCommand.setCredentialsProvider(cred);
        FetchResult result = fetchCommand.call();
    }

    private void pull(Git git, CredentialsProvider cred) throws GitAPIException {
        // pull:
        PullCommand pullCommand = git.pull();
        pullCommand.setCredentialsProvider(cred);
        PullResult result = pullCommand.call();
    }

    private void checkout(Git git, boolean create, String path, String startPoint, String branch) throws GitAPIException {
        // create branch:
        CheckoutCommand checkoutCommand = git.checkout();
        checkoutCommand.setName(branch);
        checkoutCommand.setCreateBranch(create);
        if (startPoint != null) {
            checkoutCommand.setStartPoint(startPoint);
        }
        if (path != null) {
            checkoutCommand.addPath(path);
        }
        checkoutCommand.call();
    }

    private Tuple2<String, Integer> lastCommit(Git git, String path) throws GitAPIException {
        Iterable<RevCommit> log = git.log().addPath(path).setMaxCount(1).call();
        for (RevCommit commit : log) {
            return Tuple2.of(commit.getId().getName(), commit.getCommitTime());
        }
        return null;
    }

    public Set<String> getChangedProjects(RevCommit commit) {
        Set<String> files = new HashSet<>();
        Git git = getGitForImport();
        if (git != null) {
            TreeWalk walk = new TreeWalk(git.getRepository());
            walk.setRecursive(true);
            walk.setFilter(TreeFilter.ANY_DIFF);

            ObjectId a = commit.getTree().getId();
            RevCommit parent = commit.getParent(0);
            ObjectId b = parent.getTree().getId();
            try {
                walk.reset(b, a);
                List<DiffEntry> changes = DiffEntry.scan(walk);
                changes.stream().forEach(de -> {
                    String path = de.getNewPath();
                    if (path != null) {
                        String[] parts = path.split(File.separator);
                        if (parts.length > 0) {
                            files.add(parts[0]);
                        }
                    }
                });
            } catch (IOException e) {
                LOGGER.error("Error", e);
            }
        }
        return files;
    }

    @Retry(maxRetries = 100, delay = 2000)
    public boolean checkGit() throws Exception {
        LOGGER.info("Check git");
        GitConfig gitConfig = getGitConfig();
        CredentialsProvider cred = new UsernamePasswordCredentialsProvider(gitConfig.getUsername(), gitConfig.getPassword());
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        try (Git git = clone(folder, gitConfig.getUri(), gitConfig.getBranch(), cred)) {
            LOGGER.info("Git is ready");
        }
        return true;
    }
}
