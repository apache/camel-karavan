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
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Optional;

@Path("/kubernetes")
public class KubernetesResource {

    @Inject
    EventBus eventBus;

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    KaravanConfiguration configuration;

    private static final Logger LOGGER = Logger.getLogger(KubernetesResource.class.getName());

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{environment}")
    public Project createPipeline(@HeaderParam("username") String username, @PathParam("environment") String environment, Project project) throws Exception {
        Project p = infinispanService.getProject(project.getProjectId());
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            kubernetesService.createPipelineRun(project, env.get().pipeline(), env.get().namespace());
        }
        return p;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pipeline/{environment}/{name}")
    public Response getPipeline(@HeaderParam("username") String username, @PathParam("environment") String environment,
                        @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getPipelineRun(name, env.get().namespace())).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/pipeline/log/{environment}/{name}")
    public Response getPipelineLog(@HeaderParam("username") String username, @PathParam("environment") String environment,
                        @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getPipelineRunLog(name, env.get().namespace())).build();
        } else {
            return Response.noContent().build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/container/log/{environment}/{name}")
    public Response getContainerLog(@HeaderParam("username") String username, @PathParam("environment") String environment,
                                   @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getContainerLog(name, env.get().namespace())).build();
        } else {
            return Response.noContent().build();
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/deployment/rollout/{environment}/{name}")
    public Response rollout(@HeaderParam("username") String username, @PathParam("environment") String environment, @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            kubernetesService.rolloutDeployment(name, env.get().namespace());
            return Response.ok().build();
        }
        return Response.noContent().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/deployment/{environment}/{name}")
    public Response deleteDeployment(@HeaderParam("username") String username, @PathParam("environment") String environment, @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            kubernetesService.deleteDeployment(name, env.get().namespace());
            return Response.ok().build();
        }
        return Response.noContent().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/pod/{environment}/{name}")
    public Response deletePod(@HeaderParam("username") String username, @PathParam("environment") String environment, @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            kubernetesService.deletePod(name, env.get().namespace());
            return Response.ok().build();
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/imagetag/{environment}/{projectId}")
    public Response getProjectImageTags(@HeaderParam("username") String username, @PathParam("environment") String environment, @PathParam("projectId") String projectId) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getProjectImageTags(projectId, env.get().namespace())).build();
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/configmap/{environment}")
    public Response getConfigMaps(@HeaderParam("username") String username, @PathParam("environment") String environment) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getConfigMaps(env.get().namespace())).build();
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/secret/{environment}")
    public Response getSecrets(@HeaderParam("username") String username, @PathParam("environment") String environment) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getSecrets(env.get().namespace())).build();
        }
        return Response.noContent().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/service/{environment}")
    public Response getServices(@HeaderParam("username") String username, @PathParam("environment") String environment) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getServices(env.get().namespace())).build();
        }
        return Response.noContent().build();
    }

    // TODO: implement log watch
    @GET
    @Path("/container/log/watch/{environment}/{name}")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<String> getContainerLogWatch(@HeaderParam("username") String username, @PathParam("environment") String environment, @PathParam("name") String name){
        LOGGER.info("Start sourcing");
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
//            eventBus.publish(podName + "-" + namespace, new String(is.readNBytes(i)));
//            kubernetesService.startContainerLogWatch(name, env.get().namespace());
        }
        return eventBus.<String>consumer(name + "-" + env.get().namespace()).toMulti().map(Message::body);
    }
}