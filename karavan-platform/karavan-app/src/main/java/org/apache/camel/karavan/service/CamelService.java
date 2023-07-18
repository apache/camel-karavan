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

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.DevModeStatus;
import org.apache.camel.karavan.infinispan.model.PodStatus;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.shared.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

import static org.apache.camel.karavan.shared.ConfigService.DEVMODE_SUFFIX;

@ApplicationScoped
public class CamelService {

    private static final Logger LOGGER = Logger.getLogger(CamelService.class.getName());
    public static final String CMD_COLLECT_CAMEL_STATUS = "collect-camel-status";
    public static final String CMD_DELETE_CAMEL_STATUS = "delete-camel-status";

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

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
        String containerName = projectId + DEVMODE_SUFFIX;
        try {
            PodStatus podStatus = infinispanService.getDevModePodStatuses(projectId, environment);
            Integer exposedPort = podStatus.getExposedPort();
            infinispanService.getProjectFiles(projectId).forEach(projectFile -> putRequest(containerName,exposedPort, projectFile.getName(), projectFile.getCode(), 1000));
            reloadRequest(containerName, exposedPort);
            DevModeStatus dms = infinispanService.getDevModeStatus(projectId);
            dms.setCodeLoaded(true);
            infinispanService.saveDevModeStatus(dms);
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public boolean putRequest(String containerName, Integer exposedPort, String fileName, String body, int timeout) {
        try {
            String url = getContainerAddress(containerName, exposedPort) + "/q/upload/" + fileName;
            HttpResponse<Buffer> result = getWebClient().putAbs(url)
                    .timeout(timeout).sendBuffer(Buffer.buffer(body)).subscribeAsCompletionStage().toCompletableFuture().get();
            return result.statusCode() == 200;
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
        return false;
    }

    public String reloadRequest(String containerName, Integer exposedPort) {
        String url = getContainerAddress(containerName, exposedPort) + "/q/dev/reload?reload=true";
        try {
            return result(url, 1000);
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public String getContainerAddress(String containerName, Integer exposedPort) {
        if (ConfigService.inKubernetes()) {
            return "http://" + containerName + "." + kubernetesService.getNamespace() + ".svc.cluster.local";
        } else {
            return "http://localhost:" + exposedPort;
        }
    }

    public void collectCamelStatuses() {
        if (infinispanService.isReady()) {
            infinispanService.getPodStatuses(environment).forEach(pod -> {
                CamelStatusRequest csr = new CamelStatusRequest(pod.getProjectId(), pod.getName(), pod.getExposedPort());
                eventBus.publish(CMD_COLLECT_CAMEL_STATUS, JsonObject.mapFrom(csr));
            });
        }
    }

    @ConsumeEvent(value = CMD_COLLECT_CAMEL_STATUS, blocking = true, ordered = true)
    public void collectCamelStatuses(JsonObject data) {
        CamelStatusRequest dms = data.mapTo(CamelStatusRequest.class);
        Arrays.stream(CamelStatus.Name.values()).forEach(statusName -> {
            String containerName = dms.getContainerName();
            Integer exposedPort = dms.getExposedPort();
            String status = getCamelStatus(containerName, exposedPort, statusName);
            if (status != null) {
                CamelStatus cs = new CamelStatus(dms.getProjectId(), containerName, statusName, status, environment);
                infinispanService.saveCamelStatus(cs);
            }
        });
    }

    public void cleanupDevModeStatuses() {
        if (infinispanService.isReady()) {
            infinispanService.getDevModeStatuses().forEach(dms -> {
                PodStatus pod = infinispanService.getDevModePodStatuses(dms.getProjectId(), environment);
                if (pod == null) {
                    eventBus.publish(CMD_DELETE_CAMEL_STATUS, JsonObject.mapFrom(dms));
                }
            });
        }
    }

    @ConsumeEvent(value = CMD_DELETE_CAMEL_STATUS, blocking = true, ordered = true)
    public void cleanupDevModeStatus(JsonObject data) {
        DevModeStatus dms = data.mapTo(DevModeStatus.class);
        Arrays.stream(CamelStatus.Name.values()).forEach(name -> {
            infinispanService.deleteCamelStatus(dms.getProjectId(), name.name(), environment);
        });
    }

    private void reloadCode(String podName, String oldContext, String newContext) {
        String projectName = podName.replace(DEVMODE_SUFFIX, "");
        String newState = getContextState(newContext);
        String oldState = getContextState(oldContext);
        if (newContext != null && !Objects.equals(newState, oldState) && "Started".equals(newState)) {
            reloadProjectCode(projectName);
        }
    }

    private String getContextState(String context) {
        if (context != null) {
            JsonObject obj = new JsonObject(context);
            return obj.getJsonObject("context").getString("state");
        } else {
            return null;
        }
    }

    public String getCamelStatus(String podName, Integer exposedPort, CamelStatus.Name statusName) {
        String url = getContainerAddress(podName, exposedPort) + "/q/dev/" + statusName.name();
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
        private Integer exposedPort;

        public CamelStatusRequest() {
        }

        public CamelStatusRequest(String projectId, String containerName, Integer exposedPort) {
            this.projectId = projectId;
            this.containerName = containerName;
            this.exposedPort = exposedPort;
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

        public Integer getExposedPort() {
            return exposedPort;
        }

        public void setExposedPort(Integer exposedPort) {
            this.exposedPort = exposedPort;
        }
    }
}