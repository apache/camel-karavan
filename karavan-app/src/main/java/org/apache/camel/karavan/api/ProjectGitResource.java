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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.apache.camel.karavan.service.ProjectService;
import org.jboss.logging.Logger;

import java.util.HashMap;

import static org.apache.camel.karavan.KaravanEvents.CMD_PUSH_PROJECT;

@Path("/ui/git")
public class ProjectGitResource extends AbstractApiResource {

    private static final Logger LOGGER = Logger.getLogger(ProjectGitResource.class.getName());

    @Inject
    ProjectService projectService;

    @Inject
    EventBus eventBus;


    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HashMap<String, String> push(HashMap<String, String> params, @Context SecurityContext securityContext) throws Exception {
        var identity = getIdentity(securityContext);
        var data = JsonObject.mapFrom(params);
        data.put("authorName", identity.get("name"));
        data.put("authorEmail", identity.get("email"));
        eventBus.publish(CMD_PUSH_PROJECT, data);
        return params;
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public Response pull(@PathParam("projectId") String projectId) {
        try {
            projectService.importProject(projectId);
            return Response.ok().build();
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
            return Response.serverError().entity(e.getMessage()).build();
        }

    }
}