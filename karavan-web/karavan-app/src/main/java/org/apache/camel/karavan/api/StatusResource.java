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

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.CamelStatus;
import org.apache.camel.karavan.cache.model.CamelStatusValue;
import org.apache.camel.karavan.cache.model.DeploymentStatus;
import org.jboss.logging.Logger;

import java.util.List;

@Path("/api/status")
public class StatusResource {

    private static final Logger LOGGER = Logger.getLogger(StatusResource.class.getName());

    @Inject
    KaravanCacheService karavanCacheService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{name}/{env}")
    public Response getDeploymentStatus(@PathParam("name") String name, @PathParam("env") String env) {
        DeploymentStatus status = karavanCacheService.getDeploymentStatus(name, env);
        if (status != null) {
            return Response.ok(status).build();
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/camel/context")
    public List<CamelStatus> getCamelContextStatusByEnv() {
        if (karavanCacheService.isReady()) {
            return karavanCacheService.getCamelStatusesByEnv(CamelStatusValue.Name.context);
        } else {
            return List.of();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment")
    public Response deleteDeploymentStatuses() {
        if (karavanCacheService.isReady()) {
            karavanCacheService.deleteAllDeploymentsStatuses();
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container")
    public Response deleteContainerStatuses() {
        if (karavanCacheService.isReady()) {
            karavanCacheService.deleteAllContainersStatuses();
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/camel")
    public Response deleteCamelStatuses() {
        if (karavanCacheService.isReady()) {
            karavanCacheService.deleteAllCamelStatuses();
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/all")
    public Response deleteAllStatuses() {
        if (karavanCacheService.isReady()) {
            karavanCacheService.clearAllStatuses();
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }
}