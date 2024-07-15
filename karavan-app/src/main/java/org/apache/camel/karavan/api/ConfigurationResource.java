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

import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.service.ConfigService;

import java.util.HashMap;

import static org.apache.camel.karavan.KaravanEvents.CMD_SHARE_CONFIGURATION;

@Path("/ui/configuration")
public class ConfigurationResource {

    @Inject
    ConfigService configService;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getConfiguration() throws Exception {
        return Response.ok(configService.getConfiguration(null)).build();
    }

    @GET
    @Path("/info")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getInfo() throws Exception {
        if (ConfigService.inKubernetes()) {
            return Response.ok().build();
        } else {
            return Response.ok(dockerService.getInfo()).build();
        }
    }

    @POST
    @Path("/share/")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response share(HashMap<String, String> params)  {
        try {
            eventBus.publish(CMD_SHARE_CONFIGURATION, JsonObject.mapFrom(params));
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}