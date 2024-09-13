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

import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.*;
import org.eclipse.jgit.api.*;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.*;
import org.eclipse.jgit.transport.ssh.jsch.JschConfigSessionFactory;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.TreeFilter;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Pattern;

@ApplicationScoped
public class GitService {

    @ConfigProperty(name = "karavan.git.repository")
    String repository;

    @ConfigProperty(name = "karavan.git.username")
    Optional<String> username;

    @ConfigProperty(name = "karavan.git.password")
    Optional<String> password;

    @ConfigProperty(name = "karavan.git.branch", defaultValue = "main")
    String branch;

    @ConfigProperty(name = "karavan.private-key-path")
    Optional<String> privateKeyPath;

    @ConfigProperty(name = "karavan.known-hosts-path")
    Optional<String> knownHostsPath;

    @ConfigProperty(name = "karavan.git.ephemeral", defaultValue = "false")
    boolean ephemeral;

    @Inject
    Vertx vertx;

    SshSessionFactory sshSessionFactory;

    private Git gitForImport;

    private static final Logger LOGGER = Logger.getLogger(GitService.class.getName());

    public Git getGitForImport() {
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
        if (ephemeral) {
            repository = "http://karavan.git";
            username = Optional.of("karavan");
            password = Optional.of("karavan");
            privateKeyPath = Optional.empty();
            knownHostsPath = Optional.empty();
        }
        return new GitConfig(repository, username.orElse(null), password.orElse(null), branch, privateKeyPath.orElse(null));
    }

    public Tuple2<String,String> getSShFiles() {
        return Tuple2.of(privateKeyPath.orElse(null), knownHostsPath.orElse(null));
    }

    public GitConfig getGitConfigForBuilder() {
        return new GitConfig(repository, username.orElse(null), password.orElse(null), branch, privateKeyPath.orElse(null));
    }

    public RevCommit commitAndPushProject(Project project, List<ProjectFile> files, String message, String authorName, String authorEmail, List<String> fileNames) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push project " + project.getProjectId());
        GitConfig gitConfig = getGitConfig();
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        LOGGER.info("Temp folder created " + folder);
        Git git = getGit(true, folder);
//        try {
//            git = clone(folder, gitConfig.getUri(), gitConfig.getBranch());
//            checkout(git, false, null, null, gitConfig.getBranch());
//        } catch (RefNotFoundException | InvalidRemoteException | TransportException e) {
//            LOGGER.error("New repository");
//            git = init(folder, gitConfig.getUri(), gitConfig.getBranch());
//        } catch (Exception e) {
//            LOGGER.error("Error", e);
//        }
        writeProjectToFolder(folder, project, files);
        addDeletedFilesToIndex(git, folder, project, files);
        return commitAddedAndPush(git, gitConfig.getBranch(), message, authorName, authorEmail, fileNames, project.getProjectId());
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
                    files.add(new GitRepoFile(name, fileCommit.getItem2().longValue() * 1000, body));
                }
                Tuple2<String, Integer> commit = lastCommit(git, project);
                GitRepo repo = new GitRepo(project, commit.getItem1(), commit.getItem2().longValue() * 1000, files);
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
        GitConfig gitConfig = getGitConfig();
        LOGGER.info("Git checkout " + gitConfig.getUri());
        LOGGER.info("Temp folder created " + folder);
        Git git = null;
        if (ephemeral) {
            LOGGER.error("New ephemeral repository");
            git = init(folder, gitConfig.getUri(), gitConfig.getBranch());
        } else {
            try {
                git = clone(folder, gitConfig.getUri(), gitConfig.getBranch());
                var branch = git.branchList().call().stream().filter(ref -> ref.getName().equals("refs/heads/" + gitConfig.getBranch())).findFirst();
                if (branch.isEmpty()) {
                    createBranch(git, gitConfig.getBranch());
                }
                if (checkout) {
                    checkout(git, false, null, null, gitConfig.getBranch());
                }
            } catch (RefNotFoundException | InvalidRemoteException | TransportException e) {
                LOGGER.error("New repository", e);
                git = init(folder, gitConfig.getUri(), gitConfig.getBranch());
            } catch (Exception e) {
                LOGGER.error("Error", e);
            }
        }
        return git;
    }

    private List<String> readProjectsFromFolder(String folder, String... filter) {
        LOGGER.info("Read projects from " + folder);
        List<String> files = new ArrayList<>();
        vertx.fileSystem().readDirBlocking(folder).forEach(path -> {
            String[] filenames = path.split(Pattern.quote(File.separator));
            String folderName = filenames[filenames.length - 1];
            if (folderName.startsWith(".")) {
                // skip hidden
            } else if (Files.isDirectory(Paths.get(path))) {
                if (filter == null || filter.length == 0 || Arrays.asList(filter).contains(folderName)) {
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
            String[] filenames = f.split(Pattern.quote(File.separator));
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
            String[] filenames = f.split(Pattern.quote(File.separator));
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

    public RevCommit commitAddedAndPush(Git git, String branch, String message, String authorName, String authorEmail, List<String> fileNames, String projectId) throws GitAPIException {
        LOGGER.info("Commit and push changes to the branch " + branch);
        AddCommand add = git.add();
        for (String fileName : fileNames) {
            add = add.addFilepattern(projectId + File.separator + fileName);
        }
        LOGGER.info("Git add: " + add.call());
        RevCommit commit = git.commit().setMessage(message).setAuthor(new PersonIdent(authorName, authorEmail)).call();
        LOGGER.info("Git commit: " + commit);
        if (!ephemeral) {
            PushCommand pushCommand = git.push();
            pushCommand.add(branch).setRemote("origin");
            setCredentials(pushCommand);
            Iterable<PushResult> result = pushCommand.call();
            LOGGER.info("Git push: " + result);
        }
        return commit;
    }

    public Git init(String dir, String uri, String branch) throws GitAPIException, IOException, URISyntaxException {
        Git git = Git.init().setInitialBranch(branch).setDirectory(Path.of(dir).toFile()).call();
//        git.branchCreate().setName(branch).call();
        addRemote(git, uri);
        return git;
    }

    private void addDeletedFolderToIndex(Git git, String projectId) {
        LOGGER.infof("Add folder %s to git index.", projectId);
        try {
            git.rm().addFilepattern(projectId + File.separator).call();
        } catch (GitAPIException e) {
            throw new RuntimeException(e);
        }
    }

    public void deleteProject(String projectId, String authorName, String authorEmail) {
        LOGGER.info("Delete and push project " + projectId);
        GitConfig gitConfig = getGitConfig();
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        String commitMessage = "Project " + projectId + " is deleted";
        LOGGER.infof("Temp folder %s is created for deletion of project %s", folder, projectId);
        try {
            Git git = getGit(true, folder);
            addDeletedFolderToIndex(git, projectId);
            commitAddedAndPush(git, gitConfig.getBranch(), commitMessage, authorName, authorEmail, List.of("."), projectId);
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

    private Git clone(String dir, String uri, String branch) throws GitAPIException, URISyntaxException {
        CloneCommand command = Git.cloneRepository();
        command.setCloneAllBranches(false);
        command.setDirectory(Paths.get(dir).toFile());
        command.setURI(uri);
        command.setBranch(branch);
        setCredentials(command);
        Git git = command.call();
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

    private void fetch(Git git) throws GitAPIException {
        // fetch:
        FetchCommand command = git.fetch();
        setCredentials(command);
        FetchResult result = command.call();
    }

    private void pull(Git git) throws GitAPIException {
        // pull:
        PullCommand command = git.pull();
        setCredentials(command);
        PullResult result = command.call();
    }

    private void createBranch(Git git, String branch) throws GitAPIException {
        git.commit().setMessage("Initial commit").call();
        git.branchCreate().setName(branch).call();
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
                        String[] parts = path.split(Pattern.quote(File.separator));
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

    public boolean checkGit() throws Exception {
        LOGGER.info("Check git");
        if (ephemeral) {
            return true;
        }
        GitConfig gitConfig = getGitConfig();
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        try (Git git = clone(folder, gitConfig.getUri(), gitConfig.getBranch())) {
            LOGGER.info("Git is ready");
        } catch (Exception e) {
            LOGGER.info("Error connecting git: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
        }
        return true;
    }

    private <T extends TransportCommand> T setCredentials(T command) {
        if (privateKeyPath.isPresent() && repository.startsWith("git")) {
            LOGGER.info("Set SshTransport");
            command.setTransportConfigCallback(transport -> {
                SshTransport sshTransport = (SshTransport) transport;
                sshTransport.setSshSessionFactory(getSshSessionFactory());
            });
        } else if (username.isPresent() && password.isPresent()) {
            LOGGER.info("Set UsernamePasswordCredentialsProvider");
            command.setCredentialsProvider(new UsernamePasswordCredentialsProvider(username.get(), password.get()));
        }
        return command;
    }

    private SshSessionFactory getSshSessionFactory() {
        if (sshSessionFactory == null) {
            sshSessionFactory = new JschConfigSessionFactory() {
                protected void configureJSch(JSch jsch) {
                    try {
                        jsch.addIdentity(privateKeyPath.get());
                        jsch.setKnownHosts(knownHostsPath.get());
                    } catch (JSchException e) {
                        LOGGER.info("Error configureJSch: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
                    }
                }
            };
        }
        return sshSessionFactory;
    }
}
