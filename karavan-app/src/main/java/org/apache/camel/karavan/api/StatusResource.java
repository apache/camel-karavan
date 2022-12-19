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

import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.model.CamelStatus;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.Environment;
import org.apache.camel.karavan.model.PipelineStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.StatusService;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api/status")
public class StatusResource {

    private static final Logger LOGGER = Logger.getLogger(StatusResource.class.getName());

    @Inject
    InfinispanService infinispanService;

    @Inject
    EventBus bus;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{projectId}/{env}")
    public Response getPipelineStatus(@PathParam("projectId") String projectId, @PathParam("env") String env) {
        PipelineStatus status = infinispanService.getPipelineStatus(projectId, env);
        if (status != null) {
            return Response.ok(status).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{name}/{env}")
    public Response getDeploymentStatus(@PathParam("name") String name, @PathParam("env") String env) {
        Optional<Environment> environment = infinispanService.getEnvironments().stream().filter(e -> e.getName().equals(env)).findFirst();
        if (environment.isPresent()){
            DeploymentStatus status = infinispanService.getDeploymentStatus(name, environment.get().getNamespace(), environment.get().getCluster());
            if (status != null) {
                return Response.ok(status).build();
            }
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/camel/{projectId}/{env}")
    public Response getCamelStatusByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) {
        bus.publish(StatusService.CMD_COLLECT_PROJECT_STATUS, new JsonObject(Map.of("projectId", projectId, "env", env)));
        CamelStatus status = infinispanService.getCamelStatus(projectId, env);
        if (status != null) {
            return Response.ok(status).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/camel/{env}")
    public List<CamelStatus> getCamelStatusByEnv(@PathParam("env") String env) {
        bus.publish(StatusService.CMD_COLLECT_ALL_STATUSES, "");
        return infinispanService.getCamelStatuses(env);
    }
}