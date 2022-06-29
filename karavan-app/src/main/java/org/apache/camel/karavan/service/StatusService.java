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
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectEnvStatus;
import org.apache.camel.karavan.model.ProjectStatus;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;

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

    @ConsumeEvent(value = CMD_COLLECT_STATUSES, blocking = true)
    public void collectStatuses(String projectId) throws Exception {
        LOGGER.info("Event received to collect statuses for the project " + projectId);
        if (System.currentTimeMillis() - lastCollect > configuration.statusThreshold()){
            getStatuses(projectId);
            lastCollect = System.currentTimeMillis();
        }
    }

    private void getStatuses(String projectId) throws Exception {
        LOGGER.info("Start to collect statuses for the project " + projectId);
        ProjectStatus status = new ProjectStatus();
        status.setProjectId(projectId);
        status.setLastUpdate(System.currentTimeMillis());
        List<ProjectEnvStatus> statuses = new ArrayList<>(configuration.environments().size());
        configuration.environments().forEach(e -> {
            String url = ProfileManager.getActiveProfile().equals("dev")
                    ? String.format("http://%s-%s.%s/q/health", projectId, e.namespace(), e.cluster())
                    : String.format("http://%s.%s.%s/q/health", projectId, e.namespace(), e.cluster());
            Tuple2<Boolean, ProjectEnvStatus> s = getProjectEnvStatus(url, e.name());
            if (s.getItem1()) statuses.add(s.getItem2());
        });
        status.setStatuses(statuses);

        Project project = infinispanService.getProject(projectId);
        Tuple2<Boolean, String> p = getProjectPipelineStatus(project.getLastPipelineRun());
        System.out.println(p.getItem2());
        if (p.getItem1()) status.setPipeline(p.getItem2());

        LOGGER.info("Storing status in cache for " + projectId);
        infinispanService.saveProjectStatus(status);
    }

    private Tuple2<Boolean, String> getProjectPipelineStatus(String lastPipelineRun) {
        try {
            PipelineRun pipelineRun = kubernetesService.getPipelineRun(lastPipelineRun, configuration.environments().get(0).namespace());
            if (pipelineRun != null) {
                return Tuple2.of(true, pipelineRun.getStatus().getConditions().get(0).getReason());
            } else {
                return Tuple2.of(true,"Undefined");
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return Tuple2.of(false, "Undefined");
        }
    }

    private Tuple2<Boolean, ProjectEnvStatus> getProjectEnvStatus(String url, String env) {
        // TODO: make it reactive
        try {
            HttpResponse<Buffer> result = getWebClient().getAbs(url).timeout(1000).send().subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.bodyAsJsonObject().getString("status").equals("UP")) {
                return Tuple2.of(true, new ProjectEnvStatus(env, ProjectEnvStatus.Status.UP));
            } else {
                return Tuple2.of(true, new ProjectEnvStatus(env, ProjectEnvStatus.Status.DOWN));
            }
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return Tuple2.of(false, new ProjectEnvStatus(env, ProjectEnvStatus.Status.DOWN));
        }
    }

}