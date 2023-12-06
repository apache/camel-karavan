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
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.service.ProjectService;
import org.jboss.logging.Logger;

import java.util.HashMap;

@Path("/api/git")
public class ProjectGitResource {

    private static final Logger LOGGER = Logger.getLogger(ProjectGitResource.class.getName());

    @Inject
    ProjectService projectService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Project push(HashMap<String, String> params) throws Exception {
        return projectService.commitAndPushProject(params.get("projectId"), params.get("message"));
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