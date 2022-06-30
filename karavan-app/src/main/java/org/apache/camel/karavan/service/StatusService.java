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

import io.fabric8.tekton.pipeline.v1beta1.PipelineRun;
import io.quarkus.runtime.configuration.ProfileManager;
import io.quarkus.vertx.ConsumeEvent;
import io.smallrye.mutiny.tuples.Tuple4;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.ProjectEnvStatus;
import org.apache.camel.karavan.model.ProjectStatus;
import org.jboss.logging.Logger;


import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
public class StatusService {

    private static final Logger LOGGER = Logger.getLogger(StatusService.class.getName());
    public static final String CMD_COLLECT_STATUSES = "collect-statuses";

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    KaravanConfiguration configuration;

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
        if ((System.currentTimeMillis() - lastCollect) > configuration.statusThreshold()){
            getStatuses(projectId);
            lastCollect = System.currentTimeMillis();
        }
    }

    private void getStatuses(String projectId) throws Exception {
        LOGGER.info("Start to collect statuses for the project " + projectId);
        ProjectStatus old = infinispanService.getProjectStatus(projectId);
        ProjectStatus status = new ProjectStatus();
        status.setProjectId(projectId);
        status.setLastUpdate(System.currentTimeMillis());
        List<ProjectEnvStatus> statuses = new ArrayList<>(configuration.environments().size());
        configuration.environments().forEach(e -> {
            String url = ProfileManager.getActiveProfile().equals("dev")
                    ? String.format("http://%s-%s.%s/q/health", projectId, e.namespace(), e.cluster())
                    : String.format("http://%s.%s.%s/q/health", projectId, e.namespace(), e.cluster());
            ProjectEnvStatus pes = getProjectEnvStatus(url, e.name());
            DeploymentStatus ds = kubernetesService.getDeploymentStatus(projectId, e.namespace());
            Tuple4<Boolean, String, String, Long> pipeline = getProjectPipelineStatus(projectId, e.pipeline(), e.namespace());

            pes.setDeploymentStatus(ds);

            if (pipeline.getItem1()){
                pes.setLastPipelineRun(pipeline.getItem2());
                pes.setLastPipelineRunResult(pipeline.getItem3());
                pes.setLastPipelineRunTime(pipeline.getItem4());
            } else if (old != null){
                Optional<ProjectEnvStatus> opes = old.getStatuses().stream().filter(x -> x.getEnvironment().equals(e.name())).findFirst();
                if (opes.isPresent()) {
                    pes.setLastPipelineRun(opes.get().getLastPipelineRun());
                    pes.setLastPipelineRunResult(opes.get().getLastPipelineRunResult());
                }
            }
            statuses.add(pes);
        });
        status.setStatuses(statuses);

        LOGGER.info("Storing status in cache for " + projectId);
        infinispanService.saveProjectStatus(status);
    }

    private Tuple4<Boolean, String, String, Long> getProjectPipelineStatus(String projectId, String pipelineName, String namespace) {
        try {
            PipelineRun pipelineRun = kubernetesService.getLastPipelineRun(projectId, pipelineName, namespace);
            if (pipelineRun != null) {
                Instant create = Instant.parse(pipelineRun.getMetadata().getCreationTimestamp());
                Instant completion = pipelineRun.getStatus().getCompletionTime() != null
                        ? Instant.parse(pipelineRun.getStatus().getCompletionTime())
                        : Instant.now();

                long duration = completion.getEpochSecond() - create.getEpochSecond();
                return Tuple4.of(true, pipelineRun.getMetadata().getName(), pipelineRun.getStatus().getConditions().get(0).getReason(), duration);
            } else {
                return Tuple4.of(true,"","Undefined", 0L);
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return Tuple4.of(false, "", "Undefined", 0L);
        }
    }

    private ProjectEnvStatus getProjectEnvStatus(String url, String env) {
        // TODO: make it reactive
        try {
            HttpResponse<Buffer> result = getWebClient().getAbs(url).timeout(1000).send().subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.statusCode() == 200) {
                JsonObject res = result.bodyAsJsonObject();
                List<JsonObject> checks = res.getJsonArray("checks").stream().map(o -> (JsonObject)o).collect(Collectors.toList());

                JsonObject context = checks.stream().filter(o -> Objects.equals(o.getString("name"), "context")).findFirst().get();
                return new ProjectEnvStatus(
                        env,
                        res != null && res.containsKey("status") && res.getString("status").equals("UP") ? ProjectEnvStatus.Status.UP : ProjectEnvStatus.Status.DOWN,
                        getStatus(checks, "context"),
                        getStatus(checks, "camel-consumers"),
                        getStatus(checks, "camel-routes"),
                        getStatus(checks, "camel-registry"),
                        context.getJsonObject("data").getString("context.version"),
                "",
                "",
                0L,
                new DeploymentStatus()
                );
            } else {
                return new ProjectEnvStatus(env);
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
//            ex.printStackTrace();
            return new ProjectEnvStatus(env);
        }
    }

    private ProjectEnvStatus.Status getStatus(List<JsonObject> checks, String name){
        try {
            JsonObject res = checks.stream().filter(o -> o.getString("name").equals(name)).findFirst().get();
            return res.getString("status").equals("UP") ? ProjectEnvStatus.Status.UP : ProjectEnvStatus.Status.DOWN;
        } catch (Exception e){
            return ProjectEnvStatus.Status.NA;
        }
    }

}