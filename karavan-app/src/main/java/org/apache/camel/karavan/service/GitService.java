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
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.model.GitConfig;
import org.apache.camel.karavan.model.PathCommitDetails;
import org.apache.camel.karavan.util.PathUtils;
import org.eclipse.jgit.api.*;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.jboss.logging.Logger;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

@ApplicationScoped
public class GitService {

    @Inject
    GitServiceAuth gitServiceAuth;

    @Inject
    Vertx vertx;

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

    public Tuple3<RevCommit, List<RemoteRefUpdate.Status>, List<String>> commitAndPushProject(ProjectFolder projectFolder, List<ProjectFile> files, String message, String authorName, String authorEmail, List<String> fileNames) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push project " + projectFolder.getProjectId());
        GitConfig gitConfig = gitServiceAuth.getGitConfig();
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        LOGGER.info("Temp folder created " + folder);
        Git git = getGit(true, folder);
        writeProjectToFolder(folder, projectFolder, files);
        addDeletedFilesToIndex(git, folder, projectFolder, files);
        return commitAddedAndPush(git, gitConfig.branch(), message, authorName, authorEmail, fileNames, projectFolder.getProjectId());
    }

    public List<PathCommitDetails> readProjectsToImport() {
        Git importGit = getGitForImport();
        if (importGit != null) {
            return readProjectsFromRepository(importGit);
        }
        return new ArrayList<>(0);
    }

    public List<PathCommitDetails> readProjectFromRepository(String projectId) throws GitAPIException, IOException, URISyntaxException {
        Git git = getGit(true, vertx.fileSystem().createTempDirectoryBlocking(UUID.randomUUID().toString()));
        return readProjectsFromRepository(git).stream().filter(d -> Objects.equals(d.projectId(), projectId)).toList();
    }

    public List<PathCommitDetails> readAllProjectsFromRepository() throws GitAPIException, IOException, URISyntaxException {
        Git git = getGit(true, vertx.fileSystem().createTempDirectoryBlocking(UUID.randomUUID().toString()));
        return readProjectsFromRepository(git);
    }

    public List<PathCommitDetails> getLastCommitForEachFile(Git git) throws IOException, GitAPIException {
        List<PathCommitDetails> pathCommitDetails = new ArrayList<>();
        Repository repository = git.getRepository();

        // 1. Resolve the HEAD commit (the current state of the branch)
        ObjectId head = repository.resolve(Constants.HEAD);
        if (head == null) {
            throw new IllegalStateException("Repository has no HEAD. Is it an empty repository?");
        }

        try (RevWalk revWalk = new RevWalk(repository)) {
            RevCommit headCommit = revWalk.parseCommit(head);
            RevTree tree = headCommit.getTree();

            // 2. Walk through the tree to find all files
            try (TreeWalk treeWalk = new TreeWalk(repository)) {
                treeWalk.addTree(tree);
                treeWalk.setRecursive(false); // 1. Turn off automatic recursion so we don't skip folder nodes

                // Iterate through every file found in the tree
                while (treeWalk.next()) {
                    String path = treeWalk.getPathString();
                    // 2. Determine if the current item is a directory (Tree) or file (Blob)
                    boolean isFolder = treeWalk.isSubtree();
                    Iterable<RevCommit> commits = git.log().addPath(path).setMaxCount(1).call();

                    if (isFolder && !path.startsWith(".")) {
                        for (RevCommit commit : commits) {
                            String commitId = commit.getName();
                            Long commitTime = Integer.valueOf(commit.getCommitTime()).longValue() * 1000;
                            pathCommitDetails.add(new PathCommitDetails(path, null, commitId, commitTime, null, true));
                        }
                        treeWalk.enterSubtree();
                    } else {
                        ObjectId blobId = treeWalk.getObjectId(0);
                        ObjectLoader loader = repository.open(blobId);
                        String content = new String(loader.getBytes(), StandardCharsets.UTF_8);

                        for (RevCommit commit : commits) {
                            String commitId = commit.getName(); // The SHA-1 hash
                            Long commitTime = Integer.valueOf(commit.getCommitTime()).longValue() * 1000;
                            String[] parts = path.split(Pattern.quote(File.separator));
                            if (parts.length == 2) {
                                var projectId = parts[0];
                                var fileName = parts[1];
                                pathCommitDetails.add(new PathCommitDetails(projectId, fileName, commitId, commitTime, content, false));
                            }
                        }
                    }
                }
            }
        }

        return pathCommitDetails;
    }

    private List<PathCommitDetails> readProjectsFromRepository(Git git) {
        LOGGER.info("Read projects...");
        List<PathCommitDetails> result = new ArrayList<>();
        try {
            return getLastCommitForEachFile(git);
        } catch (RefNotFoundException e) {
            LOGGER.error("New repository");
            return result;
        } catch (Exception e) {
            LOGGER.error("Error", e);
            return result;
        }
    }

    public Git getGit(boolean checkout, String folder) throws GitAPIException, IOException, URISyntaxException {
        GitConfig gitConfig = gitServiceAuth.getGitConfig();
        LOGGER.info("Git checkout " + gitConfig.repository());
        LOGGER.info("Temp folder created " + folder);
        Git git = null;
        if (gitServiceAuth.isEphemeral()) {
            LOGGER.warn("New ephemeral repository");
            git = init(folder, gitConfig.repository(), gitConfig.branch());
        } else {
            try {
                git = clone(folder, gitConfig.repository(), gitConfig.branch());
                var branch = git.branchList().call().stream().filter(ref -> ref.getName().equals("refs/heads/" + gitConfig.branch())).findFirst();
                if (branch.isEmpty()) {
                    createBranch(git, gitConfig.branch());
                }
                if (checkout) {
                    checkout(git, false, null, null, gitConfig.branch());
                }
            } catch (RefNotFoundException | InvalidRemoteException | TransportException e) {
                LOGGER.error("New repository", e);
                git = init(folder, gitConfig.repository(), gitConfig.branch());
            } catch (Exception e) {
                LOGGER.error("Error", e);
            }
        }
        return git;
    }


    private void writeProjectToFolder(String folder, ProjectFolder projectFolder, List<ProjectFile> files) throws IOException {
        Path projectDir = PathUtils.resolveInside(Paths.get(folder), projectFolder.getProjectId());
        Files.createDirectories(projectDir);
        LOGGER.info("Write files for project " + projectFolder.getProjectId());
        files.forEach(file -> {
            try {
                Path target = PathUtils.resolveInside(projectDir, file.getName());
                LOGGER.info("Add file " + file.getName());
                Files.writeString(target, file.getCode());
            } catch (SecurityException e) {
                LOGGER.error("Path traversal blocked for file " + file.getName() + " in project " + projectFolder.getProjectId());
                throw e;
            } catch (IOException e) {
                LOGGER.error("Error during file write", e);
            }
        });
    }

    private void addDeletedFilesToIndex(Git git, String folder, ProjectFolder projectFolder, List<ProjectFile> files) throws IOException {
        Path path = Paths.get(folder, projectFolder.getProjectId());
        LOGGER.info("Add deleted files to git index for project " + projectFolder.getProjectId());
        vertx.fileSystem().readDirBlocking(path.toString()).forEach(f -> {
            String[] filenames = f.split(Pattern.quote(File.separator));
            String filename = filenames[filenames.length - 1];
            LOGGER.info("Checking file " + filename);
            if (files.stream().filter(pf -> Objects.equals(pf.getName(), filename)).count() == 0) {
                try {
                    LOGGER.info("Add deleted file " + filename);
                    git.rm().addFilepattern(projectFolder.getProjectId() + File.separator + filename).call();
                } catch (GitAPIException e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    public Tuple3<RevCommit, List<RemoteRefUpdate.Status>, List<String>> commitAddedAndPush(Git git, String branch, String message, String authorName, String authorEmail, List<String> fileNames, String projectId) throws GitAPIException {
        LOGGER.info("Commit and push changes to the branch " + branch);
        AddCommand add = git.add();
        for (String fileName : fileNames) {
            add = add.addFilepattern(projectId + File.separator + fileName);
        }
        LOGGER.info("Git add: " + add.call());
        RevCommit commit = git.commit().setMessage(message).setAuthor(new PersonIdent(authorName, authorEmail)).call();
        List<String> messages = new ArrayList<>();
        List<RemoteRefUpdate.Status> statuses = new ArrayList<>();
        LOGGER.info("Git commit: " + commit);
        if (!gitServiceAuth.isEphemeral()) {
            PushCommand command = git.push();
            command.add(branch).setRemote("origin");
            command = gitServiceAuth.setCredentials(command);
            Iterable<PushResult> results = command.call();
            for (PushResult pr : results) {
                if (pr != null) {
                    LOGGER.info("Git push result: " + pr.getMessages());
                    for (RemoteRefUpdate rru : pr.getRemoteUpdates()) {
                        LOGGER.info("Git push: " + rru.getStatus() + ", " + rru.getMessage());
                        if (RemoteRefUpdate.Status.OK != rru.getStatus()) {
                            statuses.add(rru.getStatus());
                            messages.add(rru.getMessage());
                        }
                    }
                    messages.add(pr.getMessages());
                }
            }
        }
        return Tuple3.of(commit, statuses, messages);
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
        GitConfig gitConfig = gitServiceAuth.getGitConfig();
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        String commitMessage = "Project " + projectId + " is deleted";
        LOGGER.infof("Temp folder %s is created for deletion of project %s", folder, projectId);
        try {
            Git git = getGit(true, folder);
            addDeletedFolderToIndex(git, projectId);
            commitAddedAndPush(git, gitConfig.branch(), commitMessage, authorName, authorEmail, List.of("."), projectId);
            LOGGER.info("Delete Temp folder " + folder);
            vertx.fileSystem().deleteRecursiveBlocking(folder);
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
        command = gitServiceAuth.setCredentials(command);
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

    public boolean checkGit() throws Exception {
        LOGGER.info("Check git");
        if (gitServiceAuth.isEphemeral()) {
            return true;
        }
        GitConfig gitConfig = gitServiceAuth.getGitConfig();
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        try (Git git = clone(folder, gitConfig.repository(), gitConfig.branch())) {
            LOGGER.info("Git is ready");
        } catch (Exception e) {
            LOGGER.info("Error connecting git: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
        }
        return true;
    }

    public List<PathCommitDetails> getStateForCommit(String projectId, String commitId) {
        List<PathCommitDetails> result = new ArrayList<>();
        try {
            // Obtain the Git instance (reusing the import cache for read operations)
            Git git = getGitForImport();
            if (git == null) {
                return result;
            }

            Repository repository = git.getRepository();
            // Resolve the specific commit ID
            ObjectId commitObjectId = repository.resolve(commitId);
            if (commitObjectId == null) {
                LOGGER.warn("Commit " + commitId + " not found.");
                return result;
            }

            try (RevWalk revWalk = new RevWalk(repository)) {
                RevCommit commit = revWalk.parseCommit(commitObjectId);
                RevTree tree = commit.getTree();

                // JGit stores commit time in seconds, convert to milliseconds[cite: 1]
                Long commitTime = Integer.valueOf(commit.getCommitTime()).longValue() * 1000;

                try (TreeWalk treeWalk = new TreeWalk(repository)) {
                    treeWalk.addTree(tree);
                    treeWalk.setRecursive(true); // Traverse into folders automatically

                    // Filter the tree walk to only look at the specific project folder
                    treeWalk.setFilter(org.eclipse.jgit.treewalk.filter.PathFilter.create(projectId));

                    while (treeWalk.next()) {
                        String path = treeWalk.getPathString();

                        // JGit paths typically use '/' internally, but we match the existing separator logic[cite: 1]
                        String[] parts = path.split(Pattern.quote(File.separator));
                        // Fallback in case JGit is enforcing '/' on Windows while File.separator is '\'
                        if (parts.length == 1 && path.contains("/")) {
                            parts = path.split("/");
                        }

                        // Ensure we are only grabbing flat files exactly inside the projectId folder
                        if (parts.length == 2 && parts[0].equals(projectId)) {
                            String fileName = parts[1];

                            // Load the file content for this specific commit[cite: 1]
                            ObjectId blobId = treeWalk.getObjectId(0);
                            ObjectLoader loader = repository.open(blobId);
                            String content = new String(loader.getBytes(), StandardCharsets.UTF_8);

                            // Create the PathCommitDetails record (isFolder = false for files)[cite: 3]
                            result.add(new PathCommitDetails(projectId, fileName, commitId, commitTime, content, false));
                        }
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error("Error retrieving state for commit " + commitId, e);
        }
        return result;
    }
}