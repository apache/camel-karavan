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

import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.*;
import org.apache.camel.karavan.service.RunnerService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.time.Instant;
import java.util.Optional;

import static org.apache.camel.karavan.service.RunnerService.RUNNER_SUFFIX;
import static org.apache.camel.karavan.service.RunnerService.STATUS_NEED_INITIAL_LOAD;

@Path("/api/runner")
public class RunnerResource {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    RunnerService runnerServices;

    @Inject
    DatagridService datagridService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{jBangOptions}")
    public Response runProjectWithJBangOptions(Project project, @PathParam("jBangOptions") String jBangOptions) {
        String runnerName = project.getProjectId() + "-" + RUNNER_SUFFIX;
        PodStatus status = datagridService.getDevModePodStatuses(runnerName, environment);
        if (status == null) {
            datagridService.saveDevModeStatus(new DevModeStatus(project.getProjectId(), null, false));
            datagridService.sendDevModeCommand(project.getProjectId(), new DevModeCommand(CommandName.DELETE, Instant.now().toEpochMilli()));
            return Response.ok(runnerName).build();
        }
        return Response.notModified().build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response runProject(Project project) {
        return runProjectWithJBangOptions(project, "");
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/reload/{projectId}")
    public Response reload(@PathParam("projectId") String projectId) {
        runnerServices.reloadProjectCode(projectId);
        return Response.ok().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{deletePVC}")
    public Response deleteRunner(@PathParam("projectId") String projectId, @PathParam("deletePVC") boolean deletePVC) {
        datagridService.sendDevModeCommand(projectId, new DevModeCommand(CommandName.DELETE, Instant.now().toEpochMilli()));
        return Response.accepted().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pod/{projectId}")
    public Response getPodStatus(@PathParam("projectId") String projectId) {
        String runnerName = projectId + "-" + RUNNER_SUFFIX;
        Optional<PodStatus> ps =  datagridService.getPodStatuses(projectId, environment).stream()
                .filter(podStatus -> podStatus.getName().equals(runnerName))
                .findFirst();
        if (ps.isPresent()) {
            return Response.ok(ps.get()).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/console/{projectId}/{statusName}")
    public Response getCamelStatusByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("statusName") String statusName) {
        String name = projectId + "-" + RUNNER_SUFFIX;
        CamelStatus status = datagridService.getCamelStatus(name, statusName, environment);
        if (status != null) {
            return Response.ok(status).build();
        } else {
            return Response.noContent().build();
        }
    }
}