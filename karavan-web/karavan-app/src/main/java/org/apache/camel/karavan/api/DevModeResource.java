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
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.ContainerStatus;
import org.apache.camel.karavan.cache.model.Project;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.CamelService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.ProjectService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.service.ContainerStatusService.CONTAINER_STATUS;

@Path("/api/devmode")
public class DevModeResource {

    private static final Logger LOGGER = Logger.getLogger(DevModeResource.class.getName());

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    CamelService camelService;

    @Inject
    KaravanCacheService karavanCacheService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

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
        if (karavanCacheService.isReady()) {
            camelService.reloadProjectCode(projectId);
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{deletePVC}")
    public Response deleteDevMode(@PathParam("projectId") String projectId, @PathParam("deletePVC") boolean deletePVC) {
        setContainerStatusTransit(projectId, ContainerStatus.ContainerType.devmode.name());
        if (ConfigService.inKubernetes()) {
            kubernetesService.deleteDevModePod(projectId, deletePVC);
        } else {
            dockerService.deleteContainer(projectId);
        }
        return Response.accepted().build();
    }

    private void setContainerStatusTransit(String name, String type) {
        ContainerStatus status = karavanCacheService.getContainerStatus(name, environment, name);
        if (status == null) {
            status = ContainerStatus.createByType(name, environment, ContainerStatus.ContainerType.valueOf(type));
        }
        status.setInTransit(true);
        eventBus.publish(CONTAINER_STATUS, JsonObject.mapFrom(status));
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/{projectId}")
    public Response getPodStatus(@PathParam("projectId") String projectId) throws RuntimeException {
        if (karavanCacheService.isReady()) {
            ContainerStatus cs = karavanCacheService.getDevModeContainerStatus(projectId, environment);
            if (cs != null) {
                return Response.ok(cs).build();
            } else {
                return Response.noContent().build();
            }
        } else {
            return Response.noContent().build();
        }
    }
}