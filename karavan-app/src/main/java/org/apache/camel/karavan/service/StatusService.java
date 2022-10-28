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

import io.quarkus.runtime.configuration.ProfileManager;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.model.CamelStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@ApplicationScoped
public class StatusService {

    private static final Logger LOGGER = Logger.getLogger(StatusService.class.getName());
    public static final String CMD_COLLECT_STATUSES = "collect-statuses";

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @ConfigProperty(name = "karavan.camel-status-threshold")
    int threshold;

    private long lastCollect = 0;

    @Inject
    Vertx vertx;

    WebClient webClient;

    public WebClient getWebClient() {
        if (webClient == null) {
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }


    @ConsumeEvent(value = CMD_COLLECT_STATUSES, blocking = true, ordered = true)
    public void collectStatuses(String projectId) throws Exception {
        if ((System.currentTimeMillis() - lastCollect) > threshold) {
            collectStatusesForProject(projectId);
            lastCollect = System.currentTimeMillis();
        }
    }

    private void collectStatusesForProject(String projectId) {
        String url = ProfileManager.getActiveProfile().equals("dev")
                ? String.format("http://%s-%s.%s/q/health", projectId, kubernetesService.getNamespace(), kubernetesService.getCluster())
                : String.format("http://%s.%s.%s/q/health", projectId, kubernetesService.getNamespace(), kubernetesService.getCluster());
        CamelStatus cs = getCamelStatus(projectId, url);
        infinispanService.saveCamelStatus(cs);
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
                        kubernetesService.environment
                );
            } else {
                return new CamelStatus(projectId, kubernetesService.environment);
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new CamelStatus(projectId, kubernetesService.environment);
        }
    }

    private CamelStatus.Status getStatus(List<JsonObject> checks, String name){
        try {
            JsonObject res = checks.stream().filter(o -> o.getString("name").equals(name)).findFirst().get();
            return res.getString("status").equals("UP") ? CamelStatus.Status.UP : CamelStatus.Status.DOWN;
        } catch (Exception e){
            return CamelStatus.Status.NA;
        }
    }
}