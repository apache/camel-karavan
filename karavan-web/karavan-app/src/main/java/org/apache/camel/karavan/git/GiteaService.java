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

import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.git.model.GitConfig;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.jboss.logging.Logger;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class GiteaService {

    private static final Logger LOGGER = Logger.getLogger(GiteaService.class.getName());

    @Inject
    Vertx vertx;

    @Inject
    GitService gitService;

    String token;

    WebClient webClient;

    private WebClient getWebClient() {
        if (webClient == null) {
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }

    @Retry(maxRetries = 100, delay = 2000)
    public void install() throws Exception {
        LOGGER.info("Install Gitea");
        HttpResponse<Buffer> result = getWebClient().postAbs(getGiteaBaseUrl()).timeout(1000)
                .putHeader("Content-Type", "application/x-www-form-urlencoded")
                .sendBuffer(Buffer.buffer(
                        "db_type=sqlite3&db_host=localhost%3A3306&db_user=root&db_passwd=&db_name=gitea" +
                                "&ssl_mode=disable&db_schema=&db_path=%2Fvar%2Flib%2Fgitea%2Fdata%2Fgitea.db&app_name=Karavan" +
                                "&repo_root_path=%2Fvar%2Flib%2Fgitea%2Fgit%2Frepositories&lfs_root_path=%2Fvar%2Flib%2Fgitea%2Fgit%2Flfs&run_user=git" +
                                "&domain=localhost&ssh_port=2222&http_port=3000&app_url=http%3A%2F%2Flocalhost%3A3000%2F&log_root_path=%2Fvar%2Flib%2Fgitea%2Fdata%2Flog" +
                                "&smtp_addr=&smtp_port=&smtp_from=&smtp_user=&smtp_passwd=&enable_federated_avatar=on&enable_open_id_sign_in=on" +
                                "&enable_open_id_sign_up=on&default_allow_create_organization=on&default_enable_timetracking=on" +
                                "&no_reply_address=noreply.localhost&password_algorithm=pbkdf2&admin_name=&admin_email=&admin_passwd=&admin_confirm_passwd="
                ))
                .subscribeAsCompletionStage().toCompletableFuture().get();
        if (result.statusCode() != 200 && result.statusCode() != 405) {
            LOGGER.info("Gitea not ready");
            throw new Exception("Gitea not ready");
        }
        LOGGER.info("Installed Gitea");
    }

    @Retry(maxRetries = 100, delay = 2000)
    public void createRepository() throws Exception {
        LOGGER.info("Creating Gitea Repository");
        String token = generateToken();
        HttpResponse<Buffer> result = getWebClient().postAbs(getGiteaBaseUrl() + "/api/v1/user/repos").timeout(500)
                .putHeader("Content-Type", "application/json")
                .bearerTokenAuthentication(token)
                .sendJsonObject(new JsonObject(Map.of(
                        "auto_init", true,
                        "default_branch", "main",
                        "description", "karavan",
                        "name", "karavan",
                        "private", true
                )))
                .subscribeAsCompletionStage().toCompletableFuture().get();
        if (result.statusCode() == 409 && result.bodyAsJsonObject().getString("message").contains("already exists")) {
            JsonObject res = result.bodyAsJsonObject();
            deleteToken("karavan");
        } else if (result.statusCode() == 201) {
            JsonObject res = result.bodyAsJsonObject();
            deleteToken("karavan");
        } else {
            LOGGER.info("Error creating Gitea repository");
            throw new Exception("Error creating Gitea repository");
        }
        LOGGER.info("Created Gitea Repository");
    }

    @Retry(maxRetries = 100, delay = 2000)
    protected String generateToken() throws Exception {
        if (token != null) {
            return token;
        }
        LOGGER.info("Creating Gitea User Token");
        GitConfig config = gitService.getGitConfig();
        String uri = getGiteaBaseUrl() + "/api/v1/users/" + config.getUsername() + "/tokens";
        HttpResponse<Buffer> result = getWebClient().postAbs(uri).timeout(500)
                .putHeader("Content-Type", "application/json")
                .putHeader("accept", "application/json")
                .basicAuthentication(config.getUsername(), config.getPassword())
                .sendJsonObject(new JsonObject(
                        Map.of("name", "karavan", "scopes", List.of("write:repository", "write:user")))
                ).subscribeAsCompletionStage().toCompletableFuture().get();
        if (result.statusCode() == 400) {
            JsonObject res = result.bodyAsJsonObject();
            return res.getString("sha1");
        } else if (result.statusCode() == 201) {
            JsonObject res = result.bodyAsJsonObject();
            token = res.getString("sha1");
            LOGGER.info("Gitea User Token received");
            return token;
        } else {
            LOGGER.info("Error getting token");
            throw new Exception("Error getting token");
        }
    }

    protected void deleteToken(String token) throws Exception {
        LOGGER.info("Deleting Gitea User Token");
        GitConfig config = gitService.getGitConfig();
        HttpResponse<Buffer> result = getWebClient()
                .deleteAbs(getGiteaBaseUrl() + "/api/v1/users/" + config.getUsername() + "/tokens/" + token)
                .timeout(500)
                .putHeader("Content-Type", "application/json")
                .putHeader("accept", "application/json")
                .basicAuthentication(config.getUsername(), config.getPassword())
                .send().subscribeAsCompletionStage().toCompletableFuture().get();
        if (result.statusCode() == 204) {
            LOGGER.info("Deleted Gitea User Token");
        }
    }

    private String getGiteaBaseUrl() throws MalformedURLException {
        if (ConfigService.inDocker()) {
            return "http://gitea:3000";
        } else if (ConfigService.inKubernetes()) {
            String uri = gitService.getGitConfig().getUri();
            URL url = new URL(uri);
            String protocol = url.getProtocol();
            String host = url.getHost();
            int port = url.getPort();
            return protocol + "://" + host + (port > 0 ? ":" + port : "");
        } else {
            return "http://localhost:3000";
        }
    }
}