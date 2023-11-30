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

import io.quarkus.scheduler.Scheduled;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.CamelStatusValue;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.shared.Constants;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class CamelService {

    private static final Logger LOGGER = Logger.getLogger(CamelService.class.getName());
    public static final String CMD_COLLECT_CAMEL_STATUS = "collect-camel-status";
    public static final String RELOAD_PROJECT_CODE = "RELOAD_PROJECT_CODE";

    @Inject
    InfinispanService infinispanService;

    @Inject
    CodeService codeService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    ProjectService projectService;

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

    @Scheduled(every = "{karavan.camel.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void collectCamelStatuses() {
        if (infinispanService.isReady()) {
            infinispanService.getContainerStatuses(environment).stream()
                    .filter(cs ->
                            cs.getType() == ContainerStatus.ContainerType.project
                                    || cs.getType() == ContainerStatus.ContainerType.devmode
                    ).filter(cs -> Objects.equals(cs.getCamelRuntime(), Constants.CamelRuntime.CAMEL_MAIN.getValue()))
                    .forEach(cs -> {
                        CamelStatusRequest csr = new CamelStatusRequest(cs.getProjectId(), cs.getContainerName());
                        eventBus.publish(CMD_COLLECT_CAMEL_STATUS,
                                JsonObject.mapFrom(Map.of("containerStatus", cs, "camelStatusRequest", csr))
                        );
                    });
        }
    }

    @ConsumeEvent(value = RELOAD_PROJECT_CODE, blocking = true, ordered = true)
    public void reloadProjectCode(String projectId) {
        LOGGER.info("Reload project code " + projectId);
        try {
            Map<String, String> files = codeService.getProjectFilesForDevMode(projectId, true);
            files.forEach((name, code) -> putRequest(projectId, name, code, 1000));
            reloadRequest(projectId);
            ContainerStatus containerStatus = infinispanService.getDevModeContainerStatus(projectId, environment);
            containerStatus.setCodeLoaded(true);
            eventBus.send(ContainerStatusService.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public boolean putRequest(String containerName, String fileName, String body, int timeout) {
        try {
            String url = getContainerAddressForReload(containerName) + "/q/upload/" + fileName;
            HttpResponse<Buffer> result = getWebClient().putAbs(url)
                    .timeout(timeout).sendBuffer(Buffer.buffer(body)).subscribeAsCompletionStage().toCompletableFuture().get();
            return result.statusCode() == 200;
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
        return false;
    }

    public String reloadRequest(String containerName) {
        String url = getContainerAddressForReload(containerName) + "/q/dev/reload?reload=true";
        try {
            return result(url, 1000);
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public String getContainerAddressForReload(String containerName) {
        if (ConfigService.inKubernetes()) {
            return "http://" + containerName + "." + kubernetesService.getNamespace();
        } else if (ConfigService.inDocker()) {
            return "http://" + containerName + ":8080";
        } else {
            Integer port = projectService.getProjectPort(containerName);
            return "http://localhost:" + port;
        }
    }

    public String getContainerAddressForStatus(ContainerStatus containerStatus) {
        if (ConfigService.inKubernetes()) {
            String podIP = containerStatus.getPodIP().replace(".", "-");
            return "http://" + podIP + "." + kubernetesService.getNamespace() + ".pod.cluster.local:8080";
        } else if (ConfigService.inDocker()) {
            return "http://" + containerStatus.getContainerName() + ":8080";
        } else {
            Integer port = projectService.getProjectPort(containerStatus.getContainerName());
            return "http://localhost:" + port;
        }
    }

    public String getCamelStatus(ContainerStatus containerStatus, CamelStatusValue.Name statusName) {
        String url = getContainerAddressForStatus(containerStatus) + "/q/dev/" + statusName.name();
        try {
            return result(url, 500);
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    @ConsumeEvent(value = CMD_COLLECT_CAMEL_STATUS, blocking = true, ordered = true)
    public void collectCamelStatuses(JsonObject data) {
        CamelStatusRequest dms = data.getJsonObject("camelStatusRequest").mapTo(CamelStatusRequest.class);
        ContainerStatus containerStatus = data.getJsonObject("containerStatus").mapTo(ContainerStatus.class);
        String projectId = dms.getProjectId();
        String containerName = dms.getContainerName();
        List<CamelStatusValue> statuses = new ArrayList<>();
        Arrays.stream(CamelStatusValue.Name.values()).forEach(statusName -> {
            String status = getCamelStatus(containerStatus, statusName);
            if (status != null) {
                statuses.add(new CamelStatusValue(statusName, status));
                if (ConfigService.inKubernetes() && Objects.equals(statusName, CamelStatusValue.Name.context)) {
                    checkReloadRequired(containerStatus);
                }
            }
        });
        CamelStatus cs = new CamelStatus(projectId, containerName, statuses, environment);
        infinispanService.saveCamelStatus(cs);
    }

    private void checkReloadRequired(ContainerStatus cs) {
        if (ConfigService.inKubernetes()) {
            if (!Objects.equals(cs.getCodeLoaded(), true)
                    && Objects.equals(cs.getState(), ContainerStatus.State.running.name())
                    && Objects.equals(cs.getType(), ContainerStatus.ContainerType.devmode)) {
                eventBus.publish(RELOAD_PROJECT_CODE, cs.getProjectId());
            }
        }
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