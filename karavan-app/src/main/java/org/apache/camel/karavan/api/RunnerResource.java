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
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.RunnerStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
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
import java.util.Optional;

import static org.apache.camel.karavan.service.RunnerService.RUNNER_SUFFIX;

@Path("/api/runner")
public class RunnerResource {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    RunnerService runnerServices;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    InfinispanService infinispanService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String runProject(Project project) {
        String runnerName = project.getProjectId() + "-" + RUNNER_SUFFIX;
        String status = infinispanService.getRunnerStatus(runnerName, RunnerStatus.NAME.context);
        if (status != null) {
            JsonObject js = new JsonObject(status);
        }
        Project p = infinispanService.getProject(project.getProjectId());
        return kubernetesService.tryCreateRunner(p, runnerName);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/reload/{projectId}")
    public Response reload(@PathParam("projectId") String projectId) {
        runnerServices.reload(projectId);
        return Response.ok().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{name}/{deletePVC}")
    public Response deleteRunner(@PathParam("name") String name, @PathParam("deletePVC") boolean deletePVC) {
        kubernetesService.deleteRunner(name, deletePVC);
        infinispanService.deleteRunnerStatuses(name);
        return Response.accepted().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pod/{projectId}/{name}")
    public Response getPodStatus(@PathParam("projectId") String projectId, @PathParam("name") String name) {
        Optional<PodStatus> ps =  infinispanService.getPodStatuses(projectId, environment).stream()
                .filter(podStatus -> podStatus.getName().equals(name))
                .findFirst();
        if (ps.isPresent()) {
            return Response.ok(ps.get()).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/console/{statusName}/{projectId}")
    public Response getCamelStatusByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("statusName") String statusName) {
        String name = projectId + "-" + RUNNER_SUFFIX;
        String status = infinispanService.getRunnerStatus(name, RunnerStatus.NAME.valueOf(statusName));
        if (status != null) {
            return Response.ok(status).build();
        } else {
            return Response.noContent().build();
        }
    }
}