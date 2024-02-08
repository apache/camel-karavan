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
package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.model.Container;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.git.GitService;
import org.apache.camel.karavan.git.model.GitConfig;
import org.apache.camel.karavan.cache.model.ContainerStatus;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DockerForGitea {

    private static final Logger LOGGER = Logger.getLogger(DockerForGitea.class.getName());

    protected static final String GITEA_CONTAINER_NAME = "gitea";

    @Inject
    DockerService dockerService;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    public void startGitea() {
        try {
            LOGGER.info("Gitea container is starting...");
            var compose = codeService.getInternalDockerComposeService(GITEA_CONTAINER_NAME);
            Container c = dockerService.createContainerFromCompose(compose, ContainerStatus.ContainerType.internal, false);
            dockerService.runContainer(GITEA_CONTAINER_NAME);
            LOGGER.info("Gitea container is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void createGiteaUser() {
        try {
            LOGGER.info("Creating Gitea User");
            GitConfig config = gitService.getGitConfig();
            Container gitea = dockerService.getContainerByName(GITEA_CONTAINER_NAME);
            ExecCreateCmdResponse user = dockerService.execCreate(gitea.getId(),
                            "/app/gitea/gitea", "admin", "user", "create",
                            "--config", "/etc/gitea/app.ini",
                            "--username", config.getUsername(),
                            "--password", config.getPassword(),
                            "--email", config.getUsername() + "@karavan.space",
                            "--admin");
            dockerService.execStart(user.getId(), new LoggerCallback());
            LOGGER.info("Created Gitea User");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }
}