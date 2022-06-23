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

import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.ProjectStatus;
import org.apache.camel.karavan.service.InfinispanService;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Path("/status")
public class StatusResource {

    @Inject
    InfinispanService infinispanService;

    @Inject
    KaravanConfiguration configuration;

    @Inject
    Vertx vertx;

    WebClient webClient;

    public WebClient getWebClient() {
        if (webClient == null){
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public ProjectStatus getStatus(@HeaderParam("username") String username, @PathParam("projectId") String projectId) throws Exception {
        ProjectStatus status = new ProjectStatus();
        status.setProjectId(projectId);
        status.setLastUpdate(System.currentTimeMillis());
        Map<String, ProjectStatus.Status> statuses = new HashMap<>(configuration.environments().size());
        Map<String, Future> responses = new HashMap<>(configuration.environments().size());
        configuration.environments().forEach(e -> {
            String url = String.format("http://%s.%s.%s/q/health", projectId, e.namespace(), e.cluster());
            responses.put(e.name(), getWebClient().getAbs(url).timeout(3000).send());
        });
        CompositeFuture.join(new ArrayList<>(responses.values())).onComplete(e -> {
            responses.forEach((env, event) -> {
                System.out.println(env + " : " + event.toString());
                if (event.succeeded()
                        && event.result() instanceof HttpResponse
                        && ((HttpResponse) event.result()).bodyAsJsonObject().getString("status").equals("UP")){
                            statuses.put(env, ProjectStatus.Status.UP);
                        } else {
                            statuses.put(env, ProjectStatus.Status.DOWN);
                        }
            });
        });
        status.setStatuses(statuses);
        return status;
    }
}