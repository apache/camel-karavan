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
import com.github.dockerjava.api.model.HealthCheck;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.infinispan.model.GitConfig;
import org.apache.camel.karavan.service.GitService;
import org.apache.camel.karavan.service.GiteaService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

import static org.apache.camel.karavan.shared.Constants.LABEL_TYPE;

@ApplicationScoped
public class DockerForGitea {

    private static final Logger LOGGER = Logger.getLogger(DockerForGitea.class.getName());

    protected static final String GITEA_CONTAINER_NAME = "gitea";

    private static final List<String> giteaHealthCheckCMD = List.of("CMD", "curl", "-fss", "127.0.0.1:3000/api/healthz");

    @ConfigProperty(name = "karavan.gitea.image")
    String giteaImage;

    @Inject
    DockerService dockerService;

    @Inject
    GiteaService giteaService;

    @Inject
    GitService gitService;

    public void startGitea() {
        try {
            LOGGER.info("Gitea container is starting...");

            HealthCheck healthCheck = new HealthCheck().withTest(giteaHealthCheckCMD)
                    .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

            dockerService.createContainer(GITEA_CONTAINER_NAME, giteaImage,
                    List.of(), "3000:3000", false, List.of("3000"), healthCheck,
                    Map.of(LABEL_TYPE, ContainerStatus.ContainerType.internal.name()));

            dockerService.runContainer(GITEA_CONTAINER_NAME);

            LOGGER.info("Gitea container is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    protected void createGiteaInstance() {
        try {
            LOGGER.info("Creating Gitea Instance");
            Container gitea = dockerService.getContainerByName(GITEA_CONTAINER_NAME);
            ExecCreateCmdResponse instance = dockerService.execCreate(gitea.getId(),
                            "curl", "-X", "POST", "localhost:3000", "-d",
                            "db_type=sqlite3&db_host=localhost%3A3306&db_user=root&db_passwd=&db_name=gitea" +
                                    "&ssl_mode=disable&db_schema=&db_path=%2Fvar%2Flib%2Fgitea%2Fdata%2Fgitea.db&app_name=Gitea%3A+Git+with+a+cup+of+tea" +
                                    "&repo_root_path=%2Fvar%2Flib%2Fgitea%2Fgit%2Frepositories&lfs_root_path=%2Fvar%2Flib%2Fgitea%2Fgit%2Flfs&run_user=git" +
                                    "&domain=localhost&ssh_port=2222&http_port=3000&app_url=http%3A%2F%2Flocalhost%3A3000%2F&log_root_path=%2Fvar%2Flib%2Fgitea%2Fdata%2Flog" +
                                    "&smtp_addr=&smtp_port=&smtp_from=&smtp_user=&smtp_passwd=&enable_federated_avatar=on&enable_open_id_sign_in=on" +
                                    "&enable_open_id_sign_up=on&default_allow_create_organization=on&default_enable_timetracking=on" +
                                    "&no_reply_address=noreply.localhost&password_algorithm=pbkdf2&admin_name=&admin_email=&admin_passwd=&admin_confirm_passwd=",
                            "-H", "'Content-Type: application/x-www-form-urlencoded'");

            dockerService.execStart(instance.getId());
            LOGGER.info("Created Gitea Instance");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    protected void createGiteaUser() {
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
            giteaService.createRepository();
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    protected void checkGiteaInstance() {
        try {
            Container gitea = dockerService.getContainerByName(GITEA_CONTAINER_NAME);
            ExecCreateCmdResponse user = dockerService.execCreate(gitea.getId(),
                    "curl", "-Is", "localhost:3000/user/login");

            dockerService.execStart(user.getId(), new GiteaCheckCallback(o -> createGiteaUser(), o -> checkGiteaInstance()));
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void installGitea() {
        createGiteaInstance();
        checkGiteaInstance();
    }
}
