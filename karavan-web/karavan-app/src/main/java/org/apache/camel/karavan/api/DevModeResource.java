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

import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.CamelService;
import org.apache.camel.karavan.shared.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Objects;
import java.util.Optional;

@Path("/api/devmode")
public class DevModeResource {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    CamelService camelService;

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{jBangOptions}")
    public Response runProjectWithJBangOptions(Project project, @PathParam("jBangOptions") String jBangOptions) throws InterruptedException {
        String containerName = project.getProjectId();
        ContainerStatus status = infinispanService.getDevModeContainerStatus(project.getProjectId(), environment);
        if (status == null) {
            status = ContainerStatus.createDevMode(project.getProjectId(), environment);
        }

        if (!Objects.equals(status.getState(), ContainerStatus.State.running.name())){
            status.setInTransit(true);
            infinispanService.saveContainerStatus(status);

            if (ConfigService.inKubernetes()) {
                kubernetesService.runDevModeContainer(project, "");
            } else {
                dockerService.runDevmodeContainer(project, "");
            }
            return Response.ok(containerName).build();
        }
        return Response.notModified().build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response runProject(Project project) throws InterruptedException {
        return runProjectWithJBangOptions(project, "");
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/reload/{projectId}")
    public Response reload(@PathParam("projectId") String projectId) {
        if (ConfigService.inKubernetes()) {
            camelService.reloadProjectCode(projectId);
        } else {
            infinispanService.sendCodeReloadCommand(projectId);
        }
        return Response.ok().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{deletePVC}")
    public Response deleteDevMode(@PathParam("projectId") String projectId, @PathParam("deletePVC") boolean deletePVC) {
        infinispanService.setContainerStatusTransit(projectId, environment, projectId);
        if (ConfigService.inKubernetes()) {
            kubernetesService.deleteRunner(projectId, deletePVC);
        } else {
            dockerService.deleteContainer(projectId);
        }
        return Response.accepted().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/{projectId}")
    public Response getPodStatus(@PathParam("projectId") String projectId) throws RuntimeException {
        if (infinispanService.isReady()) {
            ContainerStatus cs = infinispanService.getDevModeContainerStatus(projectId, environment);
            if (cs != null) {
                return Response.ok(cs).build();
            } else {
                return Response.noContent().build();
            }
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/status/{projectId}/{statusName}")
    public Response getCamelStatusByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("statusName") String statusName) {
        if (infinispanService.isReady()) {
            CamelStatus status = infinispanService.getCamelStatus(projectId, environment, statusName);
            if (status != null) {
                return Response.ok(status).build();
            } else {
                return Response.noContent().build();
            }
        } else {
            return Response.noContent().build();
        }
    }
}