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
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerComposeConverter;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.ProjectService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_UPDATED;

@Path("/ui/container")
public class ContainerResource {

    @Inject
    EventBus eventBus;

    @Inject
    KaravanCache karavanCache;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    ProjectService projectService;

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    private static final Logger LOGGER = Logger.getLogger(ContainerResource.class.getName());

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<PodContainerStatus> getAllContainerStatuses() throws Exception {
        return karavanCache.getPodContainerStatuses().stream()
                .sorted(Comparator.comparing(PodContainerStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{type}/{name}")
    public Response manageContainer(@PathParam("projectId") String projectId, @PathParam("type") String type, @PathParam("name") String name, JsonObject command) {
        try {
            if (ConfigService.inKubernetes()) {
                if (command.getString("command").equalsIgnoreCase("delete")) {
                    kubernetesService.deletePod(name);
                    return Response.ok().build();
                }
            } else {
                // set container statuses
                setContainerStatusTransit(projectId, name, type);
                // exec docker commands
                if (command.containsKey("command")) {
                    if (command.getString("command").equalsIgnoreCase("deploy")) {
                        deployContainer(projectId, type, command);
                    } else if (command.getString("command").equalsIgnoreCase("run")) {
                        dockerService.runContainer(name);
                    } else if (command.getString("command").equalsIgnoreCase("stop")) {
                        dockerService.stopContainer(name);
                    } else if (command.getString("command").equalsIgnoreCase("pause")) {
                        dockerService.pauseContainer(name);
                    } else if (command.getString("command").equalsIgnoreCase("delete")) {
                        dockerService.deleteContainer(name);
                    }
                    return Response.ok().build();
                }
            }
            return Response.ok().build();
        } catch (Exception e) {
            var error = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            var result = "Error while executing command " + command + " on " + projectId + ": "+ error;
            LOGGER.error(result);
            return Response.serverError().entity(result).build();
        }
    }

    private void deployContainer(String projectId, String type, JsonObject command) throws InterruptedException {
        if (Objects.equals(type, PodContainerStatus.ContainerType.devservice.name())) {
            String code = projectService.getDevServiceCode();
            DockerComposeService dockerComposeService = DockerComposeConverter.fromCode(code, projectId);
            if (dockerComposeService != null) {
                Map<String, String> labels = new HashMap<>();
                labels.put(LABEL_TYPE, PodContainerStatus.ContainerType.devservice.name());
                labels.put(LABEL_CAMEL_RUNTIME, CamelRuntime.CAMEL_MAIN.getValue());
                labels.put(LABEL_PROJECT_ID, projectId);
                dockerService.createContainerFromCompose(dockerComposeService, labels, needPull(command));
                dockerService.runContainer(dockerComposeService.getContainer_name());
            }
        } else if (Objects.equals(type, PodContainerStatus.ContainerType.project.name())) {
            DockerComposeService dockerComposeService = projectService.getProjectDockerComposeService(projectId);
            if (dockerComposeService != null) {
                Map<String, String> labels = new HashMap<>();
                labels.put(LABEL_TYPE, PodContainerStatus.ContainerType.project.name());
                labels.put(LABEL_CAMEL_RUNTIME, CamelRuntime.CAMEL_MAIN.getValue());
                labels.put(LABEL_PROJECT_ID, projectId);
                dockerService.createContainerFromCompose(dockerComposeService, labels, needPull(command));
                dockerService.runContainer(dockerComposeService.getContainer_name());
            }
        } else if (Objects.equals(type, PodContainerStatus.ContainerType.devmode.name())) {
//                        TODO: merge with DevMode service
//                        dockerForKaravan.createDevmodeContainer(name, "");
//                        dockerService.runContainer(name);
        }
    }

    private DockerService.PULL_IMAGE needPull(JsonObject command) {
        try {
            return DockerService.PULL_IMAGE.valueOf(command.getString("pullImage"));
        } catch (Exception ignored) {}
        return DockerService.PULL_IMAGE.never;
    }

    private void setContainerStatusTransit(String projectId, String name, String type) {
        PodContainerStatus status = karavanCache.getPodContainerStatus(projectId, environment, name);
        if (status == null) {
            status = PodContainerStatus.createByType(projectId, environment, PodContainerStatus.ContainerType.valueOf(type));
        }
        status.setInTransit(true);
        eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(status));
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{env}")
    public List<PodContainerStatus> getContainerStatusesByEnv(@PathParam("env") String env) throws Exception {
        return karavanCache.getPodContainerStatuses(env).stream()
                .sorted(Comparator.comparing(PodContainerStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{env}")
    public List<PodContainerStatus> getContainerStatusesByProjectAndEnv(@PathParam("projectId") String projectId, @PathParam("env") String env) throws Exception {
        return karavanCache.getPodContainerStatuses(projectId, env).stream()
                .sorted(Comparator.comparing(PodContainerStatus::getContainerName))
                .collect(Collectors.toList());
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{type}/{name}")
    public Response deleteContainer(@PathParam("projectId") String projectId, @PathParam("type") String type, @PathParam("name") String name) {
        // set container statuses
        setContainerStatusTransit(projectId, name, type);
        try {
            if (ConfigService.inKubernetes()) {
                kubernetesService.deletePod(name);
            } else {
                dockerService.deleteContainer(name);
            }
            return Response.accepted().build();
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
            return Response.notModified().build();
        }
    }

    // TODO: implement log watch
    @GET
    @Path("/log/watch/{env}/{name}")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<String> getContainerLogWatch(@PathParam("env") String env, @PathParam("name") String name) {
        LOGGER.info("Start sourcing");
        return eventBus.<String>consumer(name + "-" + kubernetesService.getNamespace()).toMulti().map(Message::body);
    }
}