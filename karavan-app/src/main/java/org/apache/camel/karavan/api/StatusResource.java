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
package org.apache.camel.karavan.api;

import io.quarkus.runtime.configuration.ProfileManager;
import io.smallrye.mutiny.Uni;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.ProjectEnvStatus;
import org.apache.camel.karavan.model.ProjectStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.eclipse.microprofile.faulttolerance.Asynchronous;
import org.eclipse.microprofile.faulttolerance.Fallback;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/status")
public class StatusResource {

    private static final Logger LOGGER = Logger.getLogger(StatusResource.class.getName());

    @Inject
    InfinispanService infinispanService;

    @Inject
    KaravanConfiguration configuration;

    @Inject
    Vertx vertx;

    WebClient webClient;

    public WebClient getWebClient() {
        if (webClient == null) {
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    @Timeout(value = 1000)
    @Retry(maxRetries = 0)
    @Asynchronous
    @Fallback(fallbackMethod = "fallbackStatus")
    public Uni<ProjectStatus> getStatus(@HeaderParam("username") String username, @PathParam("projectId") String projectId) throws Exception {
        ProjectStatus status = new ProjectStatus();
        status.setProjectId(projectId);
        status.setLastUpdate(System.currentTimeMillis());
        List<ProjectEnvStatus> statuses = new ArrayList<>(configuration.environments().size());
        configuration.environments().forEach(e -> {
            String url = ProfileManager.getActiveProfile().equals("dev")
                    ? String.format("http://%s-%s.%s/q/health", projectId, e.namespace(), e.cluster())
                    : String.format("http://%s.%s.%s/q/health", projectId, e.namespace(), e.cluster());
            // TODO: make it reactive
            try {
                HttpResponse<Buffer> result = getWebClient().getAbs(url).timeout(1000).send().subscribeAsCompletionStage().toCompletableFuture().get();
                if (result.bodyAsJsonObject().getString("status").equals("UP")) {
                    statuses.add(new ProjectEnvStatus(e.name(), ProjectEnvStatus.Status.UP));
                } else {
                    statuses.add(new ProjectEnvStatus(e.name(), ProjectEnvStatus.Status.DOWN));
                }
            } catch (Exception ex) {
                statuses.add(new ProjectEnvStatus(e.name(), ProjectEnvStatus.Status.DOWN));
                LOGGER.error(ex);
            }
        });
        status.setStatuses(statuses);
        LOGGER.info("Storing status in cache for " + projectId);
        infinispanService.saveProjectStatus(status);
        return Uni.createFrom().item(status);
    }

    public Uni<ProjectStatus> fallbackStatus(String username, String projectId) {
        LOGGER.info("Return cached status for " + projectId);
        ProjectStatus status = infinispanService.getProjectStatus(projectId);
        if (status != null){
            return Uni.createFrom().item(status);
        } else {
            return Uni.createFrom().item(new ProjectStatus(
                    projectId,
                    configuration.environments().stream().map(e -> new ProjectEnvStatus(e.name(), ProjectEnvStatus.Status.DOWN)).collect(Collectors.toList()),
                    Long.valueOf(0)
            ));
        }
    }
}