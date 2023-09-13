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
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.*;
import org.jboss.logging.Logger;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Optional;

@Path("/api/status")
public class StatusResource {

    private static final Logger LOGGER = Logger.getLogger(StatusResource.class.getName());

    @Inject
    InfinispanService infinispanService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{name}/{env}")
    public Response getDeploymentStatus(@PathParam("name") String name, @PathParam("env") String env) {
        DeploymentStatus status = infinispanService.getDeploymentStatus(name, env);
        if (status != null) {
            return Response.ok(status).build();
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/camel/context/{env}")
    public List<CamelStatus> getCamelContextStatusByEnv(@PathParam("env") String env) {
        if (infinispanService.isReady()) {
            return infinispanService.getCamelStatusesByEnv(env, CamelStatusValue.Name.context);
        } else {
            return List.of();
        }
    }
}