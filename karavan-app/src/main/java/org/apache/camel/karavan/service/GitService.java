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

import io.vertx.core.Vertx;
import org.eclipse.jgit.api.*;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefNotAdvertisedException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;

@ApplicationScoped
public class GitService {

    @ConfigProperty(name = "karavan.folder.integrations")
    String integrations;

    @ConfigProperty(name = "karavan.git.uri")
    String uri;

    @ConfigProperty(name = "karavan.git.username")
    String username;

    @ConfigProperty(name = "karavan.git.password")
    String password;

    @ConfigProperty(name = "karavan.git.main")
    String mainBranch;

    @Inject
    Vertx vertx;

    @Inject
    FileSystemService fileSystemService;

    private static final Logger LOGGER = Logger.getLogger(GitService.class.getName());

    public void cloneRepo() throws GitAPIException {
        LOGGER.info("Cloning repository...");
        try (Git git = Git.cloneRepository().setDirectory(Path.of(integrations).toFile()).setURI(uri).call()) {
            LOGGER.info("Git status: " + git.status().call());
        }
    }

    public static void main(String[] args) throws GitAPIException, IOException, URISyntaxException {
        GitService g = new GitService();
        g.save("cameleer", "xxx.yaml", "yaml");
    }

    public void save(String branch, String fileName, String yaml) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Save " + fileName);
        String dir = vertx.fileSystem().createTempDirectoryBlocking(branch);
        Git git = null;
        try {
            git = clone(branch, dir);
            checkout(git, branch, false, null, null);
        } catch (RefNotFoundException e) {
            LOGGER.error("New repository");
            git = init(branch, dir);
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
        fileSystemService.saveFile(dir, fileName, yaml);
        commitAddedAndPush(git, branch, fileName);
    }

    public void publish(String branch, String fileName) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Publish " + fileName);
        String dir = vertx.fileSystem().createTempDirectoryBlocking(branch);
        Git git = clone(mainBranch, dir);
        checkout(git, mainBranch, false, null, null);
        checkout(git, branch, true, fileName, "origin/" + branch);
        commitAddedAndPush(git, mainBranch, fileName);
    }

    public void delete(String branch, String fileName) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Delete " + fileName);
        String dir = pullIntegrations(branch);
        Git git = Git.open(Path.of(dir).toFile());
        fileSystemService.delete(dir, fileName);
        commitDeletedAndPush(git, branch, fileName);
    }

    public void commitAddedAndPush(Git git, String branch, String fileName) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push changes for " + fileName);
        LOGGER.info("Git add: " + git.add().addFilepattern(fileName).call());
        LOGGER.info("Git commit: " + git.commit().setMessage(LocalDate.now().toString()).call());
        LOGGER.info("Git push: " + git.push().add(branch).setRemote("origin").setCredentialsProvider(new UsernamePasswordCredentialsProvider(username, password)).call());
    }

    public void commitDeletedAndPush(Git git, String branch, String fileName) throws GitAPIException, IOException, URISyntaxException {
        LOGGER.info("Commit and push changes for " + fileName);
        LOGGER.info("Git add: " + git.add().addFilepattern(fileName).call());
        LOGGER.info("Git commit: " + git.commit().setAll(true).setMessage(LocalDate.now().toString()).call());
        LOGGER.info("Git push: " + git.push().add(branch).setRemote("origin").setCredentialsProvider(new UsernamePasswordCredentialsProvider(username, password)).call());
    }

    public String pullIntegrations(String branch) throws GitAPIException {
        String dir = vertx.fileSystem().createTempDirectoryBlocking(branch);
        LOGGER.info("Pulling into " + dir);
        try {
            Git git = clone(branch, dir);
            LOGGER.info("Git pull branch : " + git.pull().call());
            if (fileSystemService.getIntegrationList(dir).isEmpty()) {
                LOGGER.info("Git pull remote branch : " + git.pull().setRemoteBranchName(mainBranch).call());
            }
        } catch (RefNotAdvertisedException e) {
            LOGGER.error("New repository");
        } catch (Exception e) {
            LOGGER.error("Error", e);
        }
        return dir;
    }

    private Git init(String branch, String dir) throws GitAPIException, IOException, URISyntaxException {
        Git git = Git.init().setInitialBranch(mainBranch).setDirectory(Path.of(dir).toFile()).call();
        Files.writeString(Path.of(dir).resolve("README.md"), "#Karavan");
        git.add().addFilepattern("README.md").call();
        git.commit().setMessage("initial commit").call();
        addRemote(git);
        push(git);
        checkout(git, branch, true, null, null);
        return git;
    }

    private Git clone(String branch, String dir) throws GitAPIException {
        CloneCommand cloneCommand = Git.cloneRepository();
        cloneCommand.setDirectory(Paths.get(dir).toFile());
        cloneCommand.setURI(uri);
        cloneCommand.setBranch(branch);
        return cloneCommand.call();
    }

    private void addRemote(Git git) throws URISyntaxException, GitAPIException {
        // add remote repo:
        RemoteAddCommand remoteAddCommand = git.remoteAdd();
        remoteAddCommand.setName("origin");
        remoteAddCommand.setUri(new URIish(uri));
        remoteAddCommand.call();
    }

    private void checkout(Git git, String branch, boolean create, String path, String startPoint) throws GitAPIException {
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

    private void createBranch(Git git, String branch) throws GitAPIException {
        // create branch:
        CreateBranchCommand branchCreate = git.branchCreate();
        branchCreate.setName(branch);
        branchCreate.call();
    }

    private void push(Git git) throws GitAPIException {
        // push to remote:
        PushCommand pushCommand = git.push();
        pushCommand.setCredentialsProvider(new UsernamePasswordCredentialsProvider(username, password));
        pushCommand.call();
    }

    private void pull(Git git) throws GitAPIException {
        // push to remote:
        PullCommand pullCommand = git.pull();
        pullCommand.setCredentialsProvider(new UsernamePasswordCredentialsProvider(username, password));
        pullCommand.call();
    }
}
