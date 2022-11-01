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
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    public void collectProjectStatus(String projectId) {
        if ((System.currentTimeMillis() - lastCollect.getOrDefault(projectId, 0L)) > threshold) {
            collectStatusesForProject(projectId);
            lastCollect.put(projectId, System.currentTimeMillis());
        }
    }

    @ConsumeEvent(value = CMD_COLLECT_ALL_STATUSES, blocking = true, ordered = true)
    public void collectAllStatuses(String data) {
        String all = "ALL_PROJECTS";
        if ((System.currentTimeMillis() - lastCollect.getOrDefault(all, 0L)) > threshold) {
            infinispanService.getDeploymentStatuses().forEach(d -> eventBus.publish(CMD_COLLECT_PROJECT_STATUS, d.getName()));
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
        String url = ProfileManager.getActiveProfile().equals("dev")
                ? String.format("http://%s-%s.%s/q/health", projectId, kubernetesService.getNamespace(), kubernetesService.getCluster())
                : String.format("http://%s.%s.%s/q/health", projectId, kubernetesService.getNamespace(), "svc.cluster.local");
        CamelStatus cs = getCamelStatus(projectId, url);
        try {
            String data = mapper.writeValueAsString(cs);
            eventBus.send(CMD_SAVE_STATUS, data);
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    private CamelStatus getCamelStatus(String projectId, String url) {
        // TODO: make it reactive
        try {
            HttpResponse<Buffer> result = getWebClient().getAbs(url).timeout(1000).send().subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.statusCode() == 200) {
                JsonObject res = result.bodyAsJsonObject();
                List<JsonObject> checks = res.getJsonArray("checks").stream().map(o -> (JsonObject)o).collect(Collectors.toList());

                JsonObject context = checks.stream().filter(o -> Objects.equals(o.getString("name"), "context")).findFirst().get();
                return new CamelStatus(
                        projectId,
                        getStatus(checks, "context"),
                        getStatus(checks, "camel-consumers"),
                        getStatus(checks, "camel-routes"),
                        getStatus(checks, "camel-registry"),
                        context.getJsonObject("data").getString("context.version"),
                        environment
                );
            } else {
                return new CamelStatus(projectId, environment);
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new CamelStatus(projectId, environment);
        }
    }

    private CamelStatus.Status getStatus(List<JsonObject> checks, String name){
        try {
            JsonObject res = checks.stream().filter(o -> o.getString("name").equals(name)).findFirst().get();
            return res.getString("status").equals("UP") ? CamelStatus.Status.UP : CamelStatus.Status.DOWN;
        } catch (Exception e){
            return CamelStatus.Status.UNDEFINED;
        }
    }
}