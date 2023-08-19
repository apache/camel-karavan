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

import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.model.GitConfig;
import org.apache.camel.karavan.shared.EventType;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class GiteaService {

    private static final Logger LOGGER = Logger.getLogger(GiteaService.class.getName());

    @Inject
    Vertx vertx;

    @Inject
    EventBus eventBus;

    @Inject
    GitService gitService;

    WebClient webClient;

    private WebClient getWebClient() {
        if (webClient == null) {
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }

    public void createRepository() {
        try {
            LOGGER.info("Creating Gitea Repository");
            String token = generateToken();
            HttpResponse<Buffer> result = getWebClient().postAbs("http://localhost:3000/api/v1/user/repos").timeout(500)
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
            if (result.statusCode() == 201) {
                JsonObject res = result.bodyAsJsonObject();
                eventBus.publish(EventType.START_INFINISPAN_IN_DOCKER, null);
            }
            LOGGER.info("Created Gitea Repository");
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
    }

    private String generateToken() {
        try {
            LOGGER.info("Creating Gitea User Token");
            GitConfig config = gitService.getGitConfig();
            HttpResponse<Buffer> result = getWebClient().postAbs("http://localhost:3000/api/v1/users/" + config.getUsername() + "/tokens").timeout(500)
                    .putHeader("Content-Type", "application/json")
                    .putHeader("accept", "application/json")
                    .basicAuthentication(config.getUsername(), config.getPassword())
                    .sendJsonObject(new JsonObject(Map.of("name", "karavan", "scopes", List.of("write:repository", "write:user"))))
                    .subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.statusCode() == 201) {
                JsonObject res = result.bodyAsJsonObject();
                return res.getString("sha1");
            }
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
        return null;
    }
}