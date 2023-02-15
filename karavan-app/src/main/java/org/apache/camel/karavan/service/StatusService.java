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

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.configuration.ProfileManager;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.model.CamelStatus;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.Environment;
import org.apache.camel.karavan.model.Project;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@ApplicationScoped
public class StatusService {

    private static final Logger LOGGER = Logger.getLogger(StatusService.class.getName());
    public static final String CMD_COLLECT_PROJECT_STATUS = "collect-project-status";
    public static final String CMD_COLLECT_ALL_STATUSES = "collect-all-statuses";
    public static final String CMD_SAVE_STATUS = "save-statuses";

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @ConfigProperty(name = "karavan.camel-status-threshold")
    int threshold;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    private Map<String, Long> lastCollect = new HashMap<>();
    private ObjectMapper mapper = new ObjectMapper();
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

    @ConsumeEvent(value = CMD_COLLECT_PROJECT_STATUS, blocking = true, ordered = true)
    public void collectProjectStatus(JsonObject data) {
        String projectId = data.getString("projectId");
        String env = data.getString("env");
        Optional<Environment> environment = infinispanService.getEnvironments().stream().filter(e -> e.getName().equals(env)).findFirst();
        if (environment.isPresent()){
            DeploymentStatus status = infinispanService.getDeploymentStatus(projectId, environment.get().getNamespace(), environment.get().getCluster());
            if (status != null && status.getReadyReplicas() > 0) {
                if ((System.currentTimeMillis() - lastCollect.getOrDefault(projectId, 0L)) > threshold) {
                    collectStatusesForProject(projectId);
                    lastCollect.put(projectId, System.currentTimeMillis());
                }
            }
        }
    }

    @ConsumeEvent(value = CMD_COLLECT_ALL_STATUSES, blocking = true, ordered = true)
    public void collectAllStatuses(String data) {
        String all = "ALL_PROJECTS";
        if ((System.currentTimeMillis() - lastCollect.getOrDefault(all, 0L)) > threshold) {
            infinispanService.getDeploymentStatuses().forEach(d -> {
                eventBus.publish(CMD_COLLECT_PROJECT_STATUS, new JsonObject(Map.of("projectId", d.getName(), "env", d.getEnv())));
            });
            lastCollect.put(all, System.currentTimeMillis());
        }
    }

    @ConsumeEvent(value = CMD_SAVE_STATUS, blocking = true)
    public void saveStatus(String status) {
        try {
            CamelStatus cs = mapper.readValue(status, CamelStatus.class);
            infinispanService.saveCamelStatus(cs);
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    private void collectStatusesForProject(String projectId) {
        LOGGER.info("Collect Camel status for project " + projectId);
        Project project = infinispanService.getProject(projectId);
        String runtime = project.getRuntime();
        String path = runtime.equalsIgnoreCase("quarkus") ? "/q/health" : "/actuator/health";
        String separator = ProfileManager.getActiveProfile().equals("dev") ? "-" : ".";
        String cluster = ProfileManager.getActiveProfile().equals("dev") ? kubernetesService.getCluster() : "svc.cluster.local";
        String url = "http://" + projectId + separator + kubernetesService.getNamespace() + "." + cluster + path;
        CamelStatus cs = getCamelStatus(projectId, url, runtime);
        try {
            String data = mapper.writeValueAsString(cs);
            eventBus.send(CMD_SAVE_STATUS, data);
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    @Retry(maxRetries = 6, maxDuration=100)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public HttpResponse<Buffer> bufferResult(String url, int timeout) throws InterruptedException, ExecutionException {
        HttpResponse<Buffer> result = getWebClient().getAbs(url).timeout(timeout).send().subscribeAsCompletionStage().toCompletableFuture().get();
        return result;
    }


    private CamelStatus getCamelStatus(String projectId, String url, String runtime) {
        // TODO: make it reactive
        try {
            HttpResponse<Buffer> result = bufferResult(url, 1000);
            if (result.statusCode() == 200) {
                JsonObject res = result.bodyAsJsonObject();
                if (runtime.equalsIgnoreCase("quarkus")) {
                    List<JsonObject> checks = res.getJsonArray("checks").stream().map(o -> (JsonObject) o).collect(Collectors.toList());

                    JsonObject context = checks.stream().filter(o -> Objects.equals(o.getString("name"), "context")).findFirst().get();
                    return new CamelStatus(
                            projectId,
                            getQuarkusStatus(checks, "context"),
                            getQuarkusStatus(checks, "camel-consumers"),
                            getQuarkusStatus(checks, "camel-routes"),
                            getQuarkusStatus(checks, "camel-registry"),
                            context.getJsonObject("data").getString("context.version"),
                            environment
                    );
                } else {
                    JsonObject components = res.getJsonObject("components");
                    JsonObject camelHealth = components.getJsonObject("camelHealth");
                    JsonObject details = camelHealth.getJsonObject("details");

                    return new CamelStatus(
                            projectId,
                            getSpringStatus(details, "context"),
                            getSpringStatus(details, "consumer"),
                            getSpringStatus(details, "route"),
                            CamelStatus.Status.UNDEFINED,
                            null,
                            environment
                    );
                }
            } else {
                return new CamelStatus(projectId, environment);
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new CamelStatus(projectId, environment);
        }
    }
    private CamelStatus.Status getSpringStatus(JsonObject object, String name){
        try {
            String res = object.getString(name);
            if (res == null) {
                Optional<String> fname = object.fieldNames().stream().filter(fn -> fn.startsWith(name)).findFirst();
                if (fname.isPresent()) {
                    res = object.getString(fname.get());
                }
            }
            return res.equals("UP") ? CamelStatus.Status.UP : CamelStatus.Status.DOWN;
        } catch (Exception e){
            return CamelStatus.Status.UNDEFINED;
        }
    }


    private CamelStatus.Status getQuarkusStatus(List<JsonObject> checks, String name){
        try {
            JsonObject res = checks.stream().filter(o -> o.getString("name").equals(name)).findFirst().get();
            return res.getString("status").equals("UP") ? CamelStatus.Status.UP : CamelStatus.Status.DOWN;
        } catch (Exception e){
            return CamelStatus.Status.UNDEFINED;
        }
    }
}