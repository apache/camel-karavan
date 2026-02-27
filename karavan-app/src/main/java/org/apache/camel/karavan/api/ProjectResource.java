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

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.apache.camel.karavan.cache.*;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.GitService;
import org.apache.camel.karavan.service.ProjectService;
import org.jboss.logging.Logger;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

@Path("/ui/project")
public class ProjectResource extends AbstractApiResource {
    private static final Logger LOGGER = Logger.getLogger(ProjectResource.class.getName());

    @Inject
    KaravanCache karavanCache;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    GitService gitService;

    @Inject
    DevModeResource devModeResource;

    @Inject
    ContainerResource containerResource;

    @Inject
    InfrastructureResource infrastructureResource;

    @Inject
    ProjectService projectService;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public List<ProjectFolder> getAll(@QueryParam("type") String type, @Context SecurityContext ctx) {
        return projectService.getAllProjects(type);
    }

    @GET
    @Authenticated
    @Path("/commited/all")
    @Produces(MediaType.APPLICATION_JSON)
    public List<ProjectFolderCommited> getAllCommited() {
        return karavanCache.getFoldersCommited();
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public ProjectFolder get(@PathParam("projectId") String projectId) throws Exception {
        return karavanCache.getProject(projectId);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(ProjectFolder projectFolder) {
        try {
            return Response.ok(projectService.create(projectFolder)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.CONFLICT).entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}")
    public void delete(@PathParam("project") String project, @QueryParam("deleteContainers") boolean deleteContainers, @Context SecurityContext securityContext) throws Exception {
        String projectId = URLDecoder.decode(project, StandardCharsets.UTF_8);
        if (deleteContainers) {
            LOGGER.info("Deleting containers");
            Response res1 = devModeResource.deleteDevMode(projectId, true);
            Response res2 = containerResource.deleteContainer(projectId, ContainerType.devmode.name(), projectId);
            Response res3 = containerResource.deleteContainer(projectId, ContainerType.packaged.name(), projectId);
            LOGGER.info("Deleting deployments");
            Response res4 = infrastructureResource.deleteDeployment(null, projectId);
        }
        var identity = getIdentity();
        // delete from cache
        karavanCache.getProjectFiles(projectId).forEach(file -> karavanCache.deleteProjectFile(projectId, file.getName()));
        karavanCache.getProjectFilesCommited(projectId).forEach(file -> karavanCache.deleteProjectFileCommited(projectId, file.getName()));
        karavanCache.deleteProject(projectId);
        karavanCache.deleteProjectCommited(projectId);
        // delete from git
        gitService.deleteProject(projectId, identity.getString("username"), identity.getString("email"));
        LOGGER.info("Project deleted");
    }

    @POST
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/build/{tag}")
    public Response build(ProjectFolder projectFolder, @PathParam("tag") String tag) throws Exception {
        try {
            projectService.buildProject(projectFolder, tag);
            return Response.ok().entity(projectFolder).build();
        } catch (Exception e) {
            LOGGER.error(e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/build/{env}/{buildName}")
    public Response deleteBuild(@PathParam("env") String env, @PathParam("buildName") String buildName) {
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
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/status/camel/{projectId}/{env}")
    public Response getCamelStatusForProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) {
        List<CamelStatus> statuses = karavanCache.getCamelStatusesByProjectAndEnv(projectId, env)
                .stream().filter(Objects::nonNull).peek(camelStatus -> {
                    var stats = List.copyOf(camelStatus.getStatuses()).stream().filter(s -> !Objects.equals(s.getName(), CamelStatusValue.Name.trace)).toList();
                    camelStatus.setStatuses(stats);
                }).toList();
        if (!statuses.isEmpty()) {
            return Response.ok(statuses).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/traces/{projectId}/{env}")
    public Response getCamelTracesForProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) {
        List<CamelStatus> statuses = karavanCache.getCamelStatusesByProjectAndEnv(projectId, env)
                .stream().peek(camelStatus -> {
                    var stats = List.copyOf(camelStatus.getStatuses()).stream().filter(s -> Objects.equals(s.getName(), CamelStatusValue.Name.trace)).toList();
                    camelStatus.setStatuses(stats);
                }).toList();
        if (!statuses.isEmpty()) {
            return Response.ok(statuses).build();
        } else {
            return Response.noContent().build();
        }
    }

    @POST
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/copy/{sourceProject}")
    public Response copy(@PathParam("sourceProject") String sourceProject, ProjectFolder projectFolder) {
        try {
            return Response.ok(projectService.copy(sourceProject, projectFolder)).build();
        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }
}