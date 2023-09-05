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
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.core.eventbus.Message;
import org.apache.camel.karavan.docker.DockerForKaravan;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.docker.model.DockerComposeService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.infinispan.model.DeploymentStatus;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.infinispan.model.ServiceStatus;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ProjectService;
import org.apache.camel.karavan.shared.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.EventType.CONTAINER_STATUS;

@Path("/api/infrastructure")
public class InfrastructureResource {

    @Inject
    EventBus eventBus;

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    DockerService dockerService;

    @Inject
    ProjectService projectService;

    @Inject
    CodeService codeService;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    private static final Logger LOGGER = Logger.getLogger(InfrastructureResource.class.getName());

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{env}")
    public String createPipeline(@PathParam("env") String env, Project project) throws Exception {
        Project p = infinispanService.getProject(project.getProjectId());
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
        if (infinispanService.isReady()) {
            return infinispanService.getDeploymentStatuses().stream()
                    .sorted(Comparator.comparing(DeploymentStatus::getProjectId))
                    .collect(Collectors.toList());
        } else {
            return List.of();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{env}")
    public List<DeploymentStatus> getDeploymentStatusesByEnv(@PathParam("env") String env) throws Exception {
        if (infinispanService.isReady()) {
        return infinispanService.getDeploymentStatuses(env).stream()
                .sorted(Comparator.comparing(DeploymentStatus::getProjectId))
                .collect(Collectors.toList());
        } else {
            return List.of();
        }
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
        if (infinispanService.isReady()) {
            return infinispanService.getServiceStatuses().stream()
                    .sorted(Comparator.comparing(ServiceStatus::getProjectId))
                    .collect(Collectors.toList());
        } else {
            return List.of();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container")
    public List<ContainerStatus> getAllContainerStatuses() throws Exception {
        if (infinispanService.isReady()) {
            return infinispanService.getContainerStatuses().stream()
                    .sorted(Comparator.comparing(ContainerStatus::getProjectId))
                    .collect(Collectors.toList());
        } else {
            return List.of();
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/container/{env}/{type}/{name}")
    public Response manageContainer(@PathParam("env") String env, @PathParam("type") String type, @PathParam("name") String name, JsonObject command) throws Exception {
        if (infinispanService.isReady()) {
            // set container statuses
            setContainerStatusTransit(name, type);
            // exec docker commands
            if (command.containsKey("command")) {
                if (command.getString("command").equalsIgnoreCase("run")) {
                    if (Objects.equals(type, ContainerStatus.ContainerType.devservice.name())) {
                        String code = projectService.getDevServiceCode();
                        DockerComposeService dockerComposeService = codeService.convertToDockerComposeService(code, name);
                        if (dockerComposeService != null) {
                            dockerForKaravan.createDevserviceContainer(dockerComposeService);
                            dockerService.runContainer(dockerComposeService.getContainer_name());
                        }
                    } else if (Objects.equals(type, ContainerStatus.ContainerType.devmode.name())) {
//                        TODO: merge with DevMode service
//                        dockerForKaravan.createDevmodeContainer(name, "");
//                        dockerService.runContainer(name);
                    }
                    return Response.ok().build();
                } else if (command.getString("command").equalsIgnoreCase("stop")) {
                    dockerService.stopContainer(name);
                    return Response.ok().build();
                } else if (command.getString("command").equalsIgnoreCase("pause")) {
                    dockerService.pauseContainer(name);
                    return Response.ok().build();
                }
            }
        }
        return Response.notModified().build();
    }

    private void setContainerStatusTransit(String name, String type){
        ContainerStatus status = infinispanService.getContainerStatus(name, environment, name);
        if (status == null) {
            status = ContainerStatus.createByType(name, environment, ContainerStatus.ContainerType.valueOf(type));
        }
        status.setInTransit(true);
        eventBus.send(CONTAINER_STATUS, JsonObject.mapFrom(status));
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/{env}")
    public List<ContainerStatus> getContainerStatusesByEnv(@PathParam("env") String env) throws Exception {
        return infinispanService.getContainerStatuses(env).stream()
                .sorted(Comparator.comparing(ContainerStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/{projectId}/{env}")
    public List<ContainerStatus> getContainerStatusesByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) throws Exception {
        return infinispanService.getContainerStatuses(projectId, env).stream()
                .filter(podStatus -> Objects.equals(podStatus.getType(), ContainerStatus.ContainerType.project))
                .sorted(Comparator.comparing(ContainerStatus::getContainerName))
                .collect(Collectors.toList());
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/container/{env}/{type}/{name}")
    public Response deleteContainer(@PathParam("env") String env, @PathParam("type") String type, @PathParam("name") String name) {
        if (infinispanService.isReady()) {
            // set container statuses
            setContainerStatusTransit(name, type);
            try {
                if (ConfigService.inKubernetes()) {
                    kubernetesService.deletePod(name, kubernetesService.getNamespace());
                } else {
                    dockerService.deleteContainer(name);
                }
                return Response.accepted().build();
            } catch (Exception e) {
                LOGGER.error(e.getMessage());
                return Response.notModified().build();
            }
        }
        return Response.notModified().build();
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
        if (ConfigService.inKubernetes()) {
            return Response.ok(kubernetesService.getConfigMaps(kubernetesService.getNamespace())).build();
        } else {
            return Response.ok(List.of()).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/secrets")
    public Response getSecrets() throws Exception {
        if (ConfigService.inKubernetes()) {
            return Response.ok(kubernetesService.getSecrets(kubernetesService.getNamespace())).build();
        } else {
            return Response.ok(List.of()).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/services")
    public Response getServices() throws Exception {
        if (infinispanService.isReady()) {
            if (ConfigService.inKubernetes()) {
                return Response.ok(kubernetesService.getServices(kubernetesService.getNamespace())).build();
            } else {
                List<String> list = infinispanService.getContainerStatuses(environment).stream()
                        .map(ci -> ci.getPorts().stream().map(i -> ci.getContainerName() + ":" + i).collect(Collectors.toList()))
                        .flatMap(List::stream).collect(Collectors.toList());
                return Response.ok(list).build();
            }
        } else {
            return Response.ok(List.of()).build();
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