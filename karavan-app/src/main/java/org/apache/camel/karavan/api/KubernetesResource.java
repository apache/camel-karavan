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
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ServiceStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

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
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/kubernetes")
public class KubernetesResource {

    @Inject
    EventBus eventBus;

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    private static final Logger LOGGER = Logger.getLogger(KubernetesResource.class.getName());

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{env}")
    public Project createPipeline(@PathParam("env") String env, Project project) throws Exception {
        Project p = infinispanService.getProject(project.getProjectId());
        kubernetesService.createPipelineRun(project);
        return p;
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
        return infinispanService.getDeploymentStatuses().stream()
                .sorted(Comparator.comparing(DeploymentStatus::getName))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{env}")
    public List<DeploymentStatus> getDeploymentStatusesByEnv(@PathParam("env") String env) throws Exception {
        return infinispanService.getDeploymentStatuses(env).stream()
                .sorted(Comparator.comparing(DeploymentStatus::getName))
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
        return infinispanService.getServiceStatuses().stream()
                .sorted(Comparator.comparing(ServiceStatus::getName))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pod/{env}")
    public List<PodStatus> getPodStatusesByEnv(@PathParam("env") String env) throws Exception {
        return infinispanService.getPodStatuses(env).stream()
                .sorted(Comparator.comparing(PodStatus::getName))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pod/{projectId}/{env}")
    public List<PodStatus> getPodStatusesByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) throws Exception {
        return infinispanService.getPodStatuses(projectId, env).stream()
                .sorted(Comparator.comparing(PodStatus::getName))
                .collect(Collectors.toList());
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pod/{env}/{name}")
    public Response deletePod(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesService.deletePod(name, kubernetesService.getNamespace());
        return Response.ok().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/imagetag/{env}/{projectId}")
    public Response getProjectImageTags(@PathParam("env") String env, @PathParam("projectId") String projectId) throws Exception {
        return Response.ok(kubernetesService.getProjectImageTags(projectId, kubernetesService.getNamespace())).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/configmap/{env}")
    public Response getConfigMaps(@PathParam("env") String env) throws Exception {
        return Response.ok(kubernetesService.getConfigMaps(kubernetesService.getNamespace())).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/secret/{env}")
    public Response getSecrets(@PathParam("env") String env) throws Exception {
        return Response.ok(kubernetesService.getSecrets(kubernetesService.getNamespace())).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/service/{env}")
    public Response getServices(@PathParam("env") String env) throws Exception {
        return Response.ok(kubernetesService.getServices(kubernetesService.getNamespace())).build();
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