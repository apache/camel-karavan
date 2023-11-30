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
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.git.GitService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.CamelStatusValue;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.ProjectService;
import org.jboss.logging.Logger;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

@Path("/api/project")
public class ProjectResource {
    private static final Logger LOGGER = Logger.getLogger(ProjectResource.class.getName());

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    GitService gitService;

    @Inject
    ProjectService projectService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Project> getAll(@QueryParam("type") String type) {
        return projectService.getAllProjects(type);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}")
    public Project get(@PathParam("project") String project) throws Exception {
        return infinispanService.getProject(project);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Project save(Project project) throws Exception {
        return projectService.save(project);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}")
    public void delete(@HeaderParam("username") String username,
                          @PathParam("project") String project) throws Exception {
        String projectId = URLDecoder.decode(project, StandardCharsets.UTF_8);
        gitService.deleteProject(projectId, infinispanService.getProjectFiles(projectId));
        infinispanService.getProjectFiles(projectId).forEach(file -> infinispanService.deleteProjectFile(projectId, file.getName()));
        infinispanService.deleteProject(projectId);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/build/{tag}")
    public Response build(Project project, @PathParam("tag") String tag) throws Exception {
        try {
            projectService.buildProject(project, tag);
            return Response.ok().entity(project).build();
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/build/{env}/{buildName}")
    public Response deleteBuild(@HeaderParam("username") String username,
                       @PathParam("env") String env, @PathParam("buildName") String buildName) {
        buildName = URLDecoder.decode(buildName, StandardCharsets.UTF_8);
        if (ConfigService.inKubernetes()) {
            kubernetesService.deletePod(buildName);
            return Response.ok().build();
        } else {
            dockerService.deleteContainer(buildName);
            return Response.ok().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/status/camel/{projectId}/{env}")
    public Response getCamelStatusForProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) {
        List<CamelStatus> statuses = infinispanService.getCamelStatusesByProjectAndEnv(projectId, env)
                .stream().map(camelStatus -> {
                    var stats = camelStatus.getStatuses().stream().filter(s -> !Objects.equals(s.getName(), CamelStatusValue.Name.trace)).toList();
                    camelStatus.setStatuses(stats);
                    return camelStatus;
                }).toList();
        if (statuses != null && !statuses.isEmpty()) {
            return Response.ok(statuses).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/traces/{projectId}/{env}")
    public Response getCamelTracesForProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) {
        List<CamelStatus> statuses = infinispanService.getCamelStatusesByProjectAndEnv(projectId, env)
                .stream().map(camelStatus -> {
                    var stats = camelStatus.getStatuses().stream().filter(s -> Objects.equals(s.getName(), CamelStatusValue.Name.trace)).toList();
                    camelStatus.setStatuses(stats);
                    return camelStatus;
                }).toList();
        if (statuses != null && !statuses.isEmpty()) {
            return Response.ok(statuses).build();
        } else {
            return Response.noContent().build();
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/copy/{sourceProject}")
    public Project copy(@PathParam("sourceProject") String sourceProject, Project project) throws Exception {
        return projectService.copy(sourceProject, project);
    }
}