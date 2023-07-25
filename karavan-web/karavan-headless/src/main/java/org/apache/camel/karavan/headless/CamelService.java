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
package org.apache.camel.karavan.headless;

import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

import static org.apache.camel.karavan.headless.EventService.*;

@ApplicationScoped
public class CamelService {

    private static final Logger LOGGER = Logger.getLogger(CamelService.class.getName());

    @Inject
    InfinispanService infinispanService;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    Vertx vertx;

    @Inject
    EventBus eventBus;

    WebClient webClient;

    public WebClient getWebClient() {
        if (webClient == null) {
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }

    public void reloadProjectCode(String projectId) {
        LOGGER.info("Reload project code " + projectId);
        try {
            infinispanService.getProjectFiles(projectId).forEach(projectFile ->
                    putRequest(projectId, projectFile.getName(), projectFile.getCode(), 1000));
            reloadRequest(projectId);
            ContainerStatus containerStatus = infinispanService.getDevModeContainerStatus(projectId, environment);
            containerStatus.setCodeLoaded(true);
            infinispanService.saveContainerStatus(containerStatus);
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public boolean putRequest(String containerName, String fileName, String body, int timeout) {
        try {
            String url = getContainerAddress(containerName) + "/q/upload/" + fileName;
            HttpResponse<Buffer> result = getWebClient().putAbs(url)
                    .timeout(timeout).sendBuffer(Buffer.buffer(body)).subscribeAsCompletionStage().toCompletableFuture().get();
            return result.statusCode() == 200;
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
        return false;
    }

    public void reloadRequest(String containerName) {
        String url = getContainerAddress(containerName) + "/q/dev/reload?reload=true";
        try {
            result(url, 1000);
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error(e.getMessage());
        }
    }

    public String getContainerAddress(String containerName) {
        return "http://" + containerName + ":8080";
    }

    public void collectCamelStatuses() {
        if (infinispanService.isReady()) {
            infinispanService.getContainerStatuses(environment).stream()
                    .filter(status -> status.getType().equals(ContainerStatus.ContainerType.devmode) || status.getType().equals(ContainerStatus.ContainerType.project))
                    .forEach(status -> {
                        CamelStatusRequest csr = new CamelStatusRequest(status.getProjectId(), status.getContainerName());
                        eventBus.publish(CMD_COLLECT_CAMEL_STATUS, JsonObject.mapFrom(csr));
                    });
        }
    }

    public void collectCamelStatus(JsonObject data) {
        CamelStatusRequest dms = data.mapTo(CamelStatusRequest.class);
        Arrays.stream(CamelStatus.Name.values()).forEach(statusName -> {
            String containerName = dms.getContainerName();
            String status = getCamelStatus(containerName, statusName);
            if (status != null) {
                CamelStatus cs = new CamelStatus(dms.getProjectId(), containerName, statusName, status, environment);
                infinispanService.saveCamelStatus(cs);
            }
        });
    }

    public String getCamelStatus(String containerName, CamelStatus.Name statusName) {
        String url = getContainerAddress(containerName) + "/q/dev/" + statusName.name();
        try {
            return result(url, 500);
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public String result(String url, int timeout) throws InterruptedException, ExecutionException {
        try {
            HttpResponse<Buffer> result = getWebClient().getAbs(url).putHeader("Accept", "application/json")
                    .timeout(timeout).send().subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.statusCode() == 200) {
                JsonObject res = result.bodyAsJsonObject();
                return res.encodePrettily();
            }
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
        return null;
    }

    public static class CamelStatusRequest {
        private String projectId;
        private String containerName;

        public CamelStatusRequest() {
        }

        public CamelStatusRequest(String projectId, String containerName) {
            this.projectId = projectId;
            this.containerName = containerName;
        }

        public String getProjectId() {
            return projectId;
        }

        public void setProjectId(String projectId) {
            this.projectId = projectId;
        }

        public String getContainerName() {
            return containerName;
        }

        public void setContainerName(String containerName) {
            this.containerName = containerName;
        }

    }
}