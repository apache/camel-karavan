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

import io.smallrye.mutiny.Multi;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.core.eventbus.Message;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.DeploymentStatus;
import org.apache.camel.karavan.datagrid.model.PodStatus;
import org.apache.camel.karavan.datagrid.model.Project;
import org.apache.camel.karavan.datagrid.model.ServiceStatus;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/infrastructure")
public class InfrastructureResource {

    @Inject
    EventBus eventBus;

    @Inject
    DatagridService datagridService;

    @Inject
    KubernetesService kubernetesService;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    private static final Logger LOGGER = Logger.getLogger(InfrastructureResource.class.getName());

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{env}")
    public String createPipeline(@PathParam("env") String env, Project project) throws Exception {
        Project p = datagridService.getProject(project.getProjectId());
        return kubernetesService.createPipelineRun(project);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{env}/{name}")
    public Response getPipeline(@PathParam("env") String env,
                                @PathParam("name") String name) throws Exception {
        return Response.ok(kubernetesService.getPipelineRun(name, kubernetesService.getNamespace())).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pipeline/log/{env}/{name}")
    public Response getPipelineLog(@PathParam("env") String env,
                                   @PathParam("name") String name) throws Exception {
        return Response.ok(kubernetesService.getPipelineRunLog(name, kubernetesService.getNamespace())).build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pipelinerun/{env}/{name}")
    public Response stopPipelineRun(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesService.stopPipelineRun(name, kubernetesService.getNamespace());
        return Response.ok().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/log/{env}/{name}")
    public Response getContainerLog(@PathParam("env") String env,
                                    @PathParam("name") String name) throws Exception {
        return Response.ok(kubernetesService.getContainerLog(name, kubernetesService.getNamespace())).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment")
    public List<DeploymentStatus> getAllDeploymentStatuses() throws Exception {
        return datagridService.getDeploymentStatuses().stream()
                .sorted(Comparator.comparing(DeploymentStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{env}")
    public List<DeploymentStatus> getDeploymentStatusesByEnv(@PathParam("env") String env) throws Exception {
        return datagridService.getDeploymentStatuses(env).stream()
                .sorted(Comparator.comparing(DeploymentStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/rollout/{env}/{name}")
    public Response rollout(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesService.rolloutDeployment(name, kubernetesService.getNamespace());
        return Response.ok().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/deployment/{env}/{name}")
    public Response deleteDeployment(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesService.deleteDeployment(name, kubernetesService.getNamespace());
        return Response.ok().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/service")
    public List<ServiceStatus> getAllServiceStatuses() throws Exception {
        return datagridService.getServiceStatuses().stream()
                .sorted(Comparator.comparing(ServiceStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pod/{env}")
    public List<PodStatus> getPodStatusesByEnv(@PathParam("env") String env) throws Exception {
        return datagridService.getPodStatuses(env).stream()
                .sorted(Comparator.comparing(PodStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pod/{projectId}/{env}")
    public List<PodStatus> getPodStatusesByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) throws Exception {
        return datagridService.getPodStatuses(projectId, env).stream()
                .filter(podStatus -> !podStatus.getInDevMode())
                .sorted(Comparator.comparing(PodStatus::getName))
                .collect(Collectors.toList());
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pod/{env}/{name}")
    public Response deletePod(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesService.deletePod(name, kubernetesService.getNamespace());
        return Response.accepted().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/imagetag/{env}/{projectId}")
    public Response getProjectImageTags(@PathParam("env") String env, @PathParam("projectId") String projectId) throws Exception {
        return Response.ok(kubernetesService.getProjectImageTags(projectId, kubernetesService.getNamespace())).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/configmaps")
    public Response getConfigMaps() throws Exception {
        if (kubernetesService.inKubernetes()) {
            return Response.ok(kubernetesService.getConfigMaps(kubernetesService.getNamespace())).build();
        } else {
            return Response.ok(List.of()).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/secrets")
    public Response getSecrets() throws Exception {
        if (kubernetesService.inKubernetes()) {
            return Response.ok(kubernetesService.getSecrets(kubernetesService.getNamespace())).build();
        } else {
            return Response.ok(List.of()).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/services")
    public Response getServices() throws Exception {
        if (kubernetesService.inKubernetes()) {
            return Response.ok(kubernetesService.getServices(kubernetesService.getNamespace())).build();
        } else {
            List<String> list = datagridService.getContainerInfos(environment).stream()
                    .map(ci -> ci.getPorts().stream().map(i -> ci.getContainerName() + ":" + i).collect(Collectors.toList()))
                    .flatMap(List::stream).collect(Collectors.toList());
            return Response.ok(list).build();
        }
    }

    // TODO: implement log watch
    @GET
    @Path("/container/log/watch/{env}/{name}")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<String> getContainerLogWatch(@PathParam("env") String env, @PathParam("name") String name) {
        LOGGER.info("Start sourcing");
        return eventBus.<String>consumer(name + "-" + kubernetesService.getNamespace()).toMulti().map(Message::body);
    }
}