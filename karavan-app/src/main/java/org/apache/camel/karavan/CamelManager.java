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
package org.apache.camel.karavan;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.kubernetes.KubernetesManager;
import org.apache.camel.karavan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.ExecutionException;

import static org.apache.camel.karavan.KaravanEvents.CONTAINER_UPDATED;

@ApplicationScoped
public class CamelManager {

    private static final Logger LOGGER = Logger.getLogger(CamelManager.class.getName());
    public static final String RELOAD_PROJECT_CODE = "RELOAD_PROJECT_CODE";

    @Inject
    KaravanCache karavanCache;

    @Inject
    CodeService codeService;

    @Inject
    KubernetesManager kubernetesManager;

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

    @ConsumeEvent(value = RELOAD_PROJECT_CODE, blocking = true, ordered = true)
    public void reloadProjectCode(String projectId) {
        LOGGER.debug("Reload project code " + projectId);
        try {
            ContainerStatus containerStatus = karavanCache.getDevModeContainerStatus(projectId, environment);
            deleteRequest(containerStatus);
            Map<String, String> files = codeService.getProjectFilesForDevMode(projectId, true);
            files.forEach((name, code) -> putRequest(containerStatus, name, code, 1000));
            reloadRequest(containerStatus);
            containerStatus.setCodeLoaded(true);
            eventBus.publish(CONTAINER_UPDATED, JsonObject.mapFrom(containerStatus));
        } catch (Exception ex) {
            LOGGER.error("ReloadProjectCode " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public boolean putRequest(ContainerStatus containerStatus, String fileName, String body, int timeout) {
        try {
            String url = getContainerAddressForReload(containerStatus) + "/q/upload/" + fileName;
            HttpResponse<Buffer> result = getWebClient().putAbs(url)
                    .timeout(timeout).sendBuffer(Buffer.buffer(body)).subscribeAsCompletionStage().toCompletableFuture().get();
            return result.statusCode() == 200;
        } catch (Exception ex) {
            LOGGER.error("putRequest " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return false;
    }

    public String deleteRequest(ContainerStatus containerStatus) throws Exception {
        String url = getContainerAddressForReload(containerStatus) + "/q/upload/*";
        try {
            return deleteResult(url, 1000);
        } catch (InterruptedException | ExecutionException ex) {
            LOGGER.error("deleteRequest " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return null;
    }

    public String reloadRequest(ContainerStatus containerStatus) throws Exception {
        String url = getContainerAddressForReload(containerStatus) + "/q/dev/reload?reload=true";
        try {
            return getResult(url, 1000);
        } catch (InterruptedException | ExecutionException ex) {
            LOGGER.error("reloadRequest " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return null;
    }

    public String getContainerAddressForReload(ContainerStatus containerStatus) throws Exception {
        if (ConfigService.inKubernetes()) {
            return "http://" + containerStatus.getProjectId() + "." + kubernetesManager.getNamespace();
        } else if (ConfigService.inDocker()) {
            return "http://" + containerStatus.getProjectId() + ":8080";
        } else if (containerStatus.getPorts() != null && !containerStatus.getPorts().isEmpty()) {
            Integer port = containerStatus.getPorts().get(0).getPublicPort();
            if (port != null) {
                return "http://localhost:" + port;
            }
        }
        throw new Exception("No port configured for project " + containerStatus.getContainerName());
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public String getResult(String url, int timeout) throws InterruptedException, ExecutionException {
        try {
            HttpResponse<Buffer> result = getWebClient().getAbs(url).putHeader("Accept", "application/json")
                    .timeout(timeout).send().subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.statusCode() == 200) {
                JsonObject res = result.bodyAsJsonObject();
                return res.encodePrettily();
            }
        } catch (Exception ex) {
            LOGGER.error("getResult " + url);
            LOGGER.error("getResult " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return null;
    }

    public String deleteResult(String url, int timeout) throws InterruptedException, ExecutionException {
        try {
            HttpResponse<Buffer> result = getWebClient().deleteAbs(url)
                    .timeout(timeout).send().subscribeAsCompletionStage().toCompletableFuture().get();
            JsonObject res = result.bodyAsJsonObject();
            return res.encodePrettily();
        } catch (Exception ex) {
            LOGGER.error("deleteResult " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return null;
    }
}