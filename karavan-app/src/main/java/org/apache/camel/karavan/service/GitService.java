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
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.Vertx;
import org.apache.camel.karavan.model.CommitInfo;
import org.apache.camel.karavan.model.GitConfig;
import org.apache.camel.karavan.model.GitRepo;
import org.apache.camel.karavan.model.GitRepoFile;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.jgit.api.CheckoutCommand;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.FetchCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.MergeCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.PullCommand;
import org.eclipse.jgit.api.PullResult;
import org.eclipse.jgit.api.RemoteAddCommand;
import org.eclipse.jgit.api.Status;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.merge.MergeStrategy;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.FetchResult;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.TreeFilter;
import org.eclipse.microprofile.config.ConfigProvider;
import org.jboss.logging.Logger;
import org.wildfly.common.Branch;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@ApplicationScoped
public class GitService {

    @Inject
    Vertx vertx;

    @Inject
    KubernetesService kubernetesService;

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

    public List<CommitInfo> getAllCommits() {
        List<CommitInfo> result = new ArrayList<>();
        try {
            Git pollGit = getGitForImport();
            if (pollGit != null) {
                StreamSupport.stream(pollGit.log().all().call().spliterator(), false)
                        .sorted(Comparator.comparingInt(RevCommit::getCommitTime))
                        .forEach(commit -> result.add(new CommitInfo(commit.getName(), commit.getCommitTime())));
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return result;
    }

    public List<CommitInfo> getCommitsAfterCommit(int commitTime) {
        List<CommitInfo> result = new ArrayList<>();
        try {
            Git pollGit = getGitForImport();
            if (pollGit != null) {
                GitConfig gitConfig = getGitConfig("shash","shash","shash");
                CredentialsProvider cred = new UsernamePasswordCredentialsProvider(gitConfig.getUsername(), gitConfig.getPassword());
                pull(pollGit, cred);
                List<RevCommit> commits = StreamSupport.stream(pollGit.log().all().call().spliterator(), false)
                        .filter(commit -> commit.getCommitTime() > commitTime)
                        .sorted(Comparator.comparingInt(RevCommit::getCommitTime)).collect(Collectors.toList());
                for (RevCommit commit: commits) {
                    List<String> projects = new ArrayList<>(getChangedProjects(commit));
                    List<GitRepo> repo = readProjectsFromRepository(pollGit, projects.toArray(new String[projects.size()]));
                    result.add(new CommitInfo(commit.getName(), commit.getCommitTime(), repo));
                }
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return result;
    }

    public GitConfig getGitConfig(String uri, String username, String password) {
        String propertiesPrefix = "karavan.";
        String branch = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-branch", String.class);
        if (kubernetesService.inKubernetes()) {
            // System.out.println("inKubernetes inKubernetes inKubernetes " + kubernetesService.getNamespace());
            LOGGER.info("inKubernetes " + kubernetesService.getNamespace());
            Secret secret = kubernetesService.getKaravanSecret();
            String urii = new String(Base64.getDecoder().decode(secret.getData().get("git-repository").getBytes(StandardCharsets.UTF_8)));
            String usernamei = new String(Base64.getDecoder().decode(secret.getData().get("git-username").getBytes(StandardCharsets.UTF_8)));
            String passwordi = new String(Base64.getDecoder().decode(secret.getData().get("git-password").getBytes(StandardCharsets.UTF_8)));
            if (secret.getData().containsKey("git-branch")) {
                branch = new String(Base64.getDecoder().decode(secret.getData().get("git-branch").getBytes(StandardCharsets.UTF_8)));
            }
            return new GitConfig(uri, username, password, branch);
        } else {
            // String uri = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-repository", String.class);
            // String username = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-username", String.class);
            // String password = ConfigProvider.getConfig().getValue(propertiesPrefix + "git-password", String.class);
            // String username = "shashwath-sk";
            // // String password = "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";
            // String password = "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";
            // String uri = "https://github.com/shashwath-sk/karavan-minikube-poc";
            return new GitConfig(uri, username, password, branch);
        }
    }

    public String getLastButOneCommit(Git git) throws NoHeadException, GitAPIException{
        Iterable<RevCommit> commits = git.log().setMaxCount(2).call();
        RevCommit branchCommit = null;
        String lastButOneCommitId="";
        for (RevCommit commit : commits) {
            if (branchCommit == null) {
                branchCommit = commit;
            } else {
                RevCommit lastButOneCommit = commit;
                lastButOneCommitId = lastButOneCommit.getId().getName();
            }
            System.out.println("Last but one commit id " + commit.getId().getName());
        }
        return lastButOneCommitId;
    }

    public RevCommit commitAndPushProject(Project project, List<ProjectFile> files, String message , String username , String accessToken , String repoUri , String branch,String file) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push project " + project.getProjectId());
        // GitConfig gitConfig = getGitConfig(username,accessToken,repoUri);
        CredentialsProvider cred = new UsernamePasswordCredentialsProvider(username, accessToken);
        String uri = repoUri;
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        LOGGER.info("Temp folder created " + folder);
        Git git = null;
        ObjectId testBaseId = null;
        try {
            git = clone(folder, uri, branch, cred);
            Repository repository = git.getRepository();
            // testBaseId = repository.resolve("HEAD");
            // String lastButOne = getLastButOneCommit(git);
            // checkout(git, true, null, lastButOne, "newmain");
        } catch (RefNotFoundException | TransportException e) {
            LOGGER.error("New repository");
            git = clone(folder, uri, "main", cred);
            checkout(git, true, null, null, branch);
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
        //folder contains a path ,which consists of projects present in the git repo
        // doCommit(files,folder,git, branch, cred, message);
        writeProjectToFolder(folder, project, files,file);
        addDeletedFilesToIndex(git, folder, project, files);
        // git.fetch().call();
        // fetch( git,cred,branch);
        // // Get the current branch
        // String currentBranch = git.getRepository().getBranch();
        // System.out.println("currentBranch"+currentBranch);

        // // Pull changes from remote branch
        // PullCommand pull = git.pull()
        //         .setRemote("origin")
        //         .setRemoteBranchName(branch)
        //         .setStrategy(MergeStrategy.THEIRS);
        // PullResult result = pull.call();       

        // System.out.println("result res"+result.getMergeResult().getMergeStatus());
        // if (!result.getMergeResult().isFastForward())) {
        //     // Handle conflicts
        //     // MergeResult mergeResult = result.getMergeResult();
        //     // List<Conflict> conflicts = mergeResult.getConflicts();xw
        //     // for (Conflict conflict : conflicts) {
        //     //     // Resolve conflict by updating file contents
        //     //     // ...
                
        //     //     // Add file to index
        //     //     git.add().addFilepattern(conflict.getPath()).call();
        //     System.out.println("Conflicts found: " + result.getMergeResult().getMergeStatus());
        //     }
        // String remotePath = "origin/" + branch;
        // System.out.println("\n\nremotePath remotePath remotePath\n\n" + remotePath);
        // // fetch( git,cred,branch);
        // MergeResult result = git.merge()
        //     // .setStrategy(MergeStrategy.RECURSIVE)
        //     .include(git.getRepository().resolve(remotePath))
        //     .call();
        
            
        // System.out.println("\n\nConflicts found: \n\n" + result);
    
        // Check for conflicts
        // if (result.getConflicts() != null && !result.getConflicts().isEmpty()) {
        //     // Handle conflicts
        //     System.out.println("Conflicts found: " + result.getConflicts().size());
        // }
        return commitAddedAndPush(testBaseId,files,folder,git, branch, cred, message,file);
    }

    public List<GitRepo> readProjectsToImport() {
        Git importGit = getGitForImport();
        if (importGit != null) {
            return readProjectsFromRepository(importGit, null);
        }
        return new ArrayList<>(0);
    }

    public GitRepo readProjectFromRepository(String projectId) {
        Git git = null;
        try {
            git = getGit(true, vertx.fileSystem().createTempDirectoryBlocking(UUID.randomUUID().toString()));
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
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
        GitConfig gitConfig = getGitConfig("shash","shash","shash");
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
                if (filter == null || Arrays.stream(filter).filter(f -> f.equals(folderName)).findFirst().isPresent()) {
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

    // private void detectMergeConflicts(){
    //     Path repositoryPath = Path.of("/path/to/repository");
    //     try (Repository repository = new Repository(repositoryPath.toFile())) {
    //         Path filePath1 = Path.of("/path/to/file1");
    //         Path filePath2 = Path.of("/path/to/file2");

    //         // Check if the files exist
    //         if (!Files.exists(filePath1) || !Files.exists(filePath2)) {
    //             System.err.println("One or both files do not exist.");
    //             return;
    //         }

    //         byte[] file1Contents;
    //         byte[] file2Contents;

    //         try {
    //             // Read the contents of the files
    //             file1Contents = Files.readAllBytes(filePath1);
    //             file2Contents = Files.readAllBytes(filePath2);
    //         } catch (IOException e) {
    //             System.err.println("Failed to read the files: " + e.getMessage());
    //             return;
    //         }

    //         RawText oldText = new RawText(file1Contents);
    //         RawText newText = new RawText(file2Contents);
    //         SequenceComparator<RawText> comparator = new SequenceComparator<>();
    //         EditList editList = new EditList();
    //         editList.addAll(comparator.compare(oldText, newText));

    //         // Check for conflicts
    //         if (editList.isEmpty()) {
    //             System.out.println("No changes detected.");
    //         } else {
    //             ByteArrayOutputStream out = new ByteArrayOutputStream();
    //             DiffFormatter formatter = new DiffFormatter(out);
    //             formatter.setRepository(repository);

    //             try {
    //                 formatter.format(editList, oldText, newText);
    //             } catch (IOException e) {
    //                 System.err.println("Failed to format the diff: " + e.getMessage());
    //                 return;
    //             }

    //             String diffOutput = new String(out.toByteArray(), StandardCharsets.UTF_8);
    //             System.out.println("Conflicts detected:");
    //             System.out.println(diffOutput);
    //         }

    //     } catch (IOException e) {
    //         System.err.println("Failed to initialize the repository: " + e.getMessage());
    //     }
    //     }

    private void detectMergeConflicts2(Git git, ObjectId newBranchId,List<ProjectFile> files) throws IOException, GitAPIException {
        // Get the Git repository
        Repository repository = git.getRepository();
        // Get the two different copies of the file
        // Get the two different copies of the file
    // ObjectId baseId = repository.resolve("HEAD^");
    ObjectId baseId = repository.resolve("HEAD");
    RevCommit baseCommit = repository.parseCommit(baseId);
    RevCommit ourCommit = repository.parseCommit(newBranchId);
    LOGGER.info("Base id: " + baseId);
    LOGGER.info("Our id: " + newBranchId);

    // Create a tree parser for the base tree
    CanonicalTreeParser ourTreeIter = new CanonicalTreeParser();
    try (ObjectReader reader = repository.newObjectReader()) {
        ourTreeIter.reset(reader, ourCommit.getTree().getId());
    }
    LOGGER.info("Our tree: " + ourTreeIter);

    CanonicalTreeParser baseTreeIter = new CanonicalTreeParser();
    try (ObjectReader reader = repository.newObjectReader()) {
        baseTreeIter.reset(reader, baseCommit.getTree().getId());
    }
    LOGGER.info("Base tree: " + baseTreeIter);
    // Create a tree parser for our tree
    // Get the diff between the two copies
    List<DiffEntry> diffEntries = new Git(repository).diff()
            .setOldTree(baseTreeIter)
            .setNewTree(ourTreeIter)
            .call();
    LOGGER.info("Diff entries: " + diffEntries);
    try (// Create a DiffFormatter to format the diff output
    DiffFormatter diffFormatter = new DiffFormatter(System.out)) {
        diffFormatter.setRepository(repository);
        // diffFormatter.setOldPrefix("<<<<<<< HEAD");
        // diffFormatter.setNewPrefix(">>>>>>> test/newBranch");
        // diffFormatter.setNewSuffix("");

        // Iterate over the diff entries and print out any conflicts
        for (DiffEntry diffEntry : diffEntries) {
            // if (diffEntry.getChangeType().name().equals("CONFLICT")) {
                // System.out.println("Conflict detected in file new " + diffEntry.getPath(DiffEntry.Side.NEW));
                // System.out.println("Conflict detected in file old " + diffEntry.getPath(DiffEntry.Side.OLD));
                diffFormatter.format(diffEntry);
                //store  diffFormatter.format(diffEntry) output in some variable
                

                System.out.println("Diff: " + diffEntry.getChangeType() + ": " +
                    (diffEntry.getOldPath().equals(diffEntry.getNewPath()) ? diffEntry.getNewPath() : diffEntry.getOldPath() + " -> " + diffEntry.getNewPath()));
        }  
    }

    getLastButOneCommit(git);
        // Map<String, String> fileNames = new HashMap<>();
        //    for (ProjectFile file : files) {
        //        fileNames.put("auth/"+file.getName(), file.getCode());

        String currentBranch = git.getRepository().getBranch();
        LOGGER.info("Current branch: " + currentBranch);

        //    }
           String remotePath = "newmain";
        //    MergeResult mergeResult = git.merge()
        //        .setStrategy(MergeStrategy.RESOLVE)
        //        .include(git.getRepository().resolve(remotePath))
        //        .call();
        // MergeResult mergeResult = git.merge();
        //         // .include(git.getRepository().findRef(remotePath))
        //         // .include(git.getRepository().findRef("main"))
        //         // .setStrategy(MergeStrategy.RECURSIVE)
        //         // .setBase(base)
        //         .call();

         // Create a new MergeCommand object.
         MergeCommand mergeCommand = git.merge();

         // Add the target branch to the merge command.
         LOGGER.info("our id: " + ourCommit);
         mergeCommand.include(ourCommit);
 
         // Call the merge command.
         MergeResult mergeResult = mergeCommand.call();
         
               Map<String,int[][]> allConflicts = mergeResult.getConflicts();
               LOGGER.info("Conflicts: " + mergeResult.getMergeStatus());
               if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)){
                   for (String path : allConflicts.keySet()) {
                       int[][] c = allConflicts.get(path);
                       System.out.println("Conflicts in file " + path);
                       for (int i = 0; i < c.length; ++i) {
                               System.out.println("  Conflict #" + i);
                               for (int j = 0; j < (c[i].length) - 1; ++j) {
                                       if (c[i][j] >= 0)
                                               System.out.println("    Chunk for "
                                                               + mergeResult.getMergedCommits()[j] + " starts on line #"
                                                               + c[i][j]);
                               }
                       }
                }
               }
        getLastButOneCommit(git);
   
            
    //     if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
    //         LOGGER.error("Merge conflicts detected, merge aborted.");
    //         Map<String, int[][]> conflicts = mergeResult.getConflicts();
    //         for (String path : conflicts.keySet()) {
    //             int[][] conflictA = conflicts.get(path);
    //             LOGGER.error("Conflict in file " + path + " starting at line " + conflictA[0][0] + conflictA[0][1] + ":");
    //             //display contents of conflictA array
    //             for (int[] conflict : conflictA) {
    //                 int startLine = conflict[0];
    //                 int endLine = conflict[1];
    //                 String[] content = readFileContents(fileNames.get(path), startLine, endLine);
    //                 LOGGER.error("Conflicting content: " + content);
    //             }
    //         }
    // }
}


    private void writeProjectToFolder(String folder, Project project, List<ProjectFile> files,String fileSelected) throws IOException {
        Files.createDirectories(Paths.get(folder, project.getProjectId()));
        LOGGER.info("Write files to path " + Paths.get(folder, project.getProjectId()));
        LOGGER.info("Write files for project " + project.getProjectId());
        // File folders = new File(folder);
        // File[] filess = folders.listFiles();
        // Map<String,String> fileNames = new HashMap<>();
        // for (File file : filess) {
        //     if (file.isFile()) {
        //         System.out.println(file.getName());
        //         fileNames.put(file.getName(),Files.readString(new File("file1.txt").toPath(), StandardCharsets.UTF_8));
                
        //     }
        // }
        LOGGER.info("Write files for project " + fileSelected);
        if(fileSelected.equals(".")){
            for (ProjectFile file : files) {
                LOGGER.info("Add file " + file.getName());
                Files.writeString(Paths.get(folder, project.getProjectId(), file.getName()), file.getCode());
            }
        }
        else{
            LOGGER.info("Write files for project  inside " + fileSelected);
            for (ProjectFile file : files) {
                if(file.getName().equals(fileSelected)){
                    Files.writeString(Paths.get(folder, project.getProjectId(), file.getName()), file.getCode());
                    LOGGER.info("Add file " + file.getName());
                }
            }
        }
        // files.forEach(file -> {
        //     try {
        //         Files.writeString(Paths.get(folder, project.getProjectId(), file.getName()), file.getCode());
        //     } catch (IOException e) {
        //         LOGGER.error("Error during file write", e);
        //     }
        // });
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
    // public RevCommit doCommit( List<ProjectFile> files,String folder, Git git, String branch, CredentialsProvider cred, String message) throws GitAPIException, IOException {
    //     //iterate files and create a map of file name and file content
    //     // Map<String, String> fileNames = new HashMap<>();
    //     // for (ProjectFile file : files) {
    //     //     // System.out.println("auth/"+file.getName()+"--------->" + file.getCode());
    //     //     fileNames.put("auth/"+file.getName(), file.getCode());
    //     // }
    //     LOGGER.info("Commit and push changes");
    //     LOGGER.info("Git add: " + git.add().addFilepattern(".").call());
    //     // git.add().addFilepattern(".").call();
    //     RevCommit commit = git.commit().setMessage("prev"+message).call();
    //     // fetch( git,cred,"main");
    //     // String remotePath = "origin/" + "main";
    //     // MergeResult mergeResult = git.merge()
    //     //     .setStrategy(MergeStrategy.RECURSIVE)
    //     //     .include(git.getRepository().resolve(remotePath))
    //     //     .call();
    //     // if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
    //     //     LOGGER.error("Merge conflicts detected, merge aborted.");
    //     //     Map<String, int[][]> conflicts = mergeResult.getConflicts();
    //     //     for (String path : conflicts.keySet()) {
    //     //         int[][] conflictA = conflicts.get(path);
    //     //         LOGGER.error("Conflict in file " + path + " starting at line " + conflictA[0][0] + conflictA[0][1] + ":");
    //     //         for (int[] conflict : conflictA) {
    //     //             int startLine = conflict[0];
    //     //             int endLine = conflict[1];
    //     //             String[] content = readFileContents(fileNames.get(path), startLine, endLine);
    //     //             LOGGER.error("Conflicting content: " + content);
    //     //         }
    //     //         }
    //     //     }
    //     LOGGER.info("Git prev commit: " + commit);
    //     Iterable<PushResult> result = git.push().add("test-branch").setRemote("origin").setCredentialsProvider(cred).call();
    //     LOGGER.info("Git push: " + result);
    //     return commit;
    // }

    public RevCommit commitAddedAndPush( ObjectId baseId,List<ProjectFile> files,String folder, Git git, String branch, CredentialsProvider cred, String message,String file) throws GitAPIException, IOException {
        //iterate files and create a map of file name and file content
        // Map<String, String> fileNames = new HashMap<>();
        // for (ProjectFile file : files) {
        //     // System.out.println("auth/"+file.getName()+"--------->" + file.getCode());
        //     fileNames.put("auth/"+file.getName(), file.getCode());
        // }
        LOGGER.info("Commit and push changes " + file);
        // LOGGER.info("Git add: " + git.add().addFilepattern("auth/"+file).call());
        LOGGER.info("Git add: " + git.add().addFilepattern(".").call());
        // git.add().addFilepattern(".").call();
        //log git status
        Status status = git.status().call();
        LOGGER.info("Git status after adding: " + status);
        RevCommit commit = git.commit().setMessage(message).call();
        status = git.status().call();
        LOGGER.info("Git status after committing: " + status);
        // fetch( git,cred,"main");
        // String remotePath = "origin/" + "main";
        // MergeResult mergeResult = git.merge()
        //     .setStrategy(MergeStrategy.RECURSIVE)
        //     .include(git.getRepository().resolve(remotePath))
        //     .call();
        // if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
        //     LOGGER.error("Merge conflicts detected, merge aborted.");
        //     Map<String, int[][]> conflicts = mergeResult.getConflicts();
        //     for (String path : conflicts.keySet()) {
        //         int[][] conflictA = conflicts.get(path);
        //         LOGGER.error("Conflict in file " + path + " starting at line " + conflictA[0][0] + conflictA[0][1] + ":");
        //         for (int[] conflict : conflictA) {
        //             int startLine = conflict[0];
        //             int endLine = conflict[1];
        //             String[] content = readFileContents(fileNames.get(path), startLine, endLine);
        //             LOGGER.error("Conflicting content: " + content);
        //         }
        //         }
        //     }
        LOGGER.info("Git commit: " + commit);
        String currentBranch = git.getRepository().getBranch();
        LOGGER.info("Current branch: " + currentBranch);
        getLastButOneCommit(git);
        Repository repository = git.getRepository();
        ObjectId newBranchId = repository.resolve("HEAD");
        // checkout(git, false, null, null, branch);
        currentBranch = git.getRepository().getBranch();
        LOGGER.info("Current branch: " + currentBranch);
        detectMergeConflicts2(git,newBranchId,files);
        // Iterable<PushResult> results = git.push().add(branch).setRemote("origin").setCredentialsProvider(cred).call();
        // Iterable<PushResult> results = git.push().add(branch).setRemote("origin").setCredentialsProvider(cred).call();
        // for (PushResult result : results) {
        //     for (RemoteRefUpdate update : result.getRemoteUpdates()) {
        //         if (update.getStatus() == RemoteRefUpdate.Status.OK) {
        //             LOGGER.info("Push to " + update.getRemoteName() + " was successful");
        //         } else if (update.getStatus() == RemoteRefUpdate.Status.REJECTED_NONFASTFORWARD) {
        //             LOGGER.error("Push to " + update.getRemoteName() + " was rejected as it is not a fast-forward");
        //         } else {
        //             LOGGER.error("Push to " + update.getRemoteName() + " returned an unknown status");
        //         }
        //     }
        
            // if (result.getMergeResult() != null && result.getMergeResult().getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
            //     LOGGER.error("Push resulted in merge conflicts");
            // }
        // }
        
        return commit;
    }


    private String[] readFileContents(String file, int startLine, int endLine) throws IOException {
        LOGGER.info("Read file contents from "  + " from line " + startLine + " to line " + endLine);
        // Stream<String> lines = Files.lines(path);
        // LOGGER.info("Lines: " + lines.toString());
        // if(startLine==0){
        //     startLine=1;
        // }
        String[] contents = file.split("/n");
        System.out.println("file contents are\n\n"+contents);
        String conflictContents = file.substring(startLine, endLine);
        System.out.println("file conflictContents are\n\n"+conflictContents);
        // lines.close();
        return contents;
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
        GitConfig gitConfig = getGitConfig("shash","shash","shash");
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
            // commitAddedAndPush(git, gitConfig.getBranch(), cred, commitMessage);
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
        System.out.println(git.toString());
        return git;
    }

    private void addRemote(Git git, String uri) throws URISyntaxException, GitAPIException {
        // add remote repo:
        RemoteAddCommand remoteAddCommand = git.remoteAdd();
        remoteAddCommand.setName("origin");
        remoteAddCommand.setUri(new URIish(uri));
        remoteAddCommand.call();
    }

    private void fetch(Git git, CredentialsProvider cred,String branch) throws GitAPIException {
        // fetch:
        FetchCommand fetchCommand = git.fetch();
        fetchCommand.setCredentialsProvider(cred);
        fetchCommand.setRemote("origin");
        fetchCommand.setRefSpecs(new RefSpec("+refs/heads/" + branch + ":refs/remotes/origin/" + branch ));
        FetchResult result = fetchCommand.call();
        System.out.println("this is fecth command okkk :" + result.getMessages());
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
}
