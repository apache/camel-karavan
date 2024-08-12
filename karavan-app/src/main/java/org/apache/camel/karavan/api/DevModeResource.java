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

import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.ProjectService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.KaravanEvents.CMD_DELETE_CONTAINER;
import static org.apache.camel.karavan.KaravanEvents.CMD_RELOAD_PROJECT_CODE;

@Path("/ui/devmode")
public class DevModeResource {

    private static final Logger LOGGER = Logger.getLogger(DevModeResource.class.getName());

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    KaravanCache karavanCache;

    @Inject
    ProjectService projectService;

    @Inject
    EventBus eventBus;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{jBangOptions}")
    public Response runProjectWithJBangOptions(Project project, @PathParam("jBangOptions") String jBangOptions) {
        try {
            String containerName = projectService.runProjectWithJBangOptions(project, jBangOptions);
            if (containerName != null) {
                return Response.ok(containerName).build();
            } else {
                return Response.notModified().build();
            }
        } catch (Exception e) {
            LOGGER.error(e);
            return Response.serverError().entity(e).build();
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response runProject(Project project) throws Exception {
        return runProjectWithJBangOptions(project, "");
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/reload/{projectId}")
    public Response reload(@PathParam("projectId") String projectId) {
        eventBus.publish(CMD_RELOAD_PROJECT_CODE, projectId);
        return Response.ok().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{deletePVC}")
    public Response deleteDevMode(@PathParam("projectId") String projectId, @PathParam("deletePVC") boolean deletePVC) {
        eventBus.publish(CMD_DELETE_CONTAINER, projectId);
        return Response.accepted().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/{projectId}")
    public Response getPodStatus(@PathParam("projectId") String projectId) throws RuntimeException {
        PodContainerStatus cs = karavanCache.getDevModePodContainerStatus(projectId, environment);
        if (cs != null) {
            return Response.ok(cs).build();
        } else {
            return Response.noContent().build();
        }
    }
}