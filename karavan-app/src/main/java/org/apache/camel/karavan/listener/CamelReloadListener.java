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
package org.apache.camel.karavan.listener;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.apache.camel.karavan.KaravanEvents.CMD_RELOAD_PROJECT_CODE;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_UPDATED;

@ApplicationScoped
public class CamelReloadListener {

    private static final Logger LOGGER = Logger.getLogger(CamelReloadListener.class.getName());

    @Inject
    KaravanCache karavanCache;

    @Inject
    CodeService codeService;

    @Inject
    KubernetesService kubernetesService;

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
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

    @ConsumeEvent(value = CMD_RELOAD_PROJECT_CODE, blocking = true, ordered = true)
    void reloadProjectCode(String projectId) {
        LOGGER.debug("Reload project code " + projectId);
        try {
            PodContainerStatus podContainerStatus = karavanCache.getDevModePodContainerStatus(projectId, environment);
            deleteRequest(podContainerStatus);
            Map<String, String> files = codeService.getProjectFilesForDevMode(projectId, true);
            files.forEach((name, code) -> putRequest(podContainerStatus, name, code, 1000));
            reloadRequest(podContainerStatus);
            podContainerStatus.setCodeLoaded(true);
            eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(podContainerStatus));
        } catch (Exception ex) {
            LOGGER.error("ReloadProjectCode " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
     boolean putRequest(PodContainerStatus podContainerStatus, String fileName, String body, int timeout) {
        try {
            String url = getContainerAddressForReload(podContainerStatus) + "/q/upload/" + fileName;
            HttpResponse<Buffer> result = getWebClient().putAbs(url)
                    .timeout(timeout).sendBuffer(Buffer.buffer(body)).subscribeAsCompletionStage().toCompletableFuture().get();
            return result.statusCode() == 200;
        } catch (Exception ex) {
            LOGGER.error("putRequest " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return false;
    }

     String deleteRequest(PodContainerStatus podContainerStatus) throws Exception {
        String url = getContainerAddressForReload(podContainerStatus) + "/q/upload/*";
        try {
            return deleteResult(url, 1000);
        } catch (InterruptedException | ExecutionException ex) {
            LOGGER.error("deleteRequest " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return null;
    }

     String reloadRequest(PodContainerStatus podContainerStatus) throws Exception {
        String url = getContainerAddressForReload(podContainerStatus) + "/q/dev/reload?reload=true";
        try {
            return getResult(url, 1000);
        } catch (InterruptedException | ExecutionException ex) {
            LOGGER.error("reloadRequest " + (ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage()));
        }
        return null;
    }

     String getContainerAddressForReload(PodContainerStatus podContainerStatus) throws Exception {
        if (ConfigService.inKubernetes()) {
            return "http://" + podContainerStatus.getProjectId() + "." + kubernetesService.getNamespace();
        } else if (ConfigService.inDocker()) {
            return "http://" + podContainerStatus.getProjectId() + ":8080";
        } else if (podContainerStatus.getPorts() != null && !podContainerStatus.getPorts().isEmpty()) {
            Integer port = podContainerStatus.getPorts().get(0).getPublicPort();
            if (port != null) {
                return "http://localhost:" + port;
            }
        }
        throw new Exception("No port configured for project " + podContainerStatus.getContainerName());
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
     String getResult(String url, int timeout) throws InterruptedException, ExecutionException {
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

     String deleteResult(String url, int timeout) throws InterruptedException, ExecutionException {
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