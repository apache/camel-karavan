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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.model.ContainerImage;
import org.apache.camel.karavan.model.RegistryConfig;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.ProjectService;
import org.apache.camel.karavan.service.RegistryService;
import org.jose4j.base64url.Base64;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;

import static org.apache.camel.karavan.KaravanEvents.CMD_PULL_IMAGES;

@Path("/ui/image")
public class ImagesResource extends AbstractApiResource {

    @Inject
    DockerService dockerService;

    @Inject
    RegistryService registryService;

    @Inject
    ProjectService projectService;

    @Inject
    EventBus eventBus;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/project/{projectId}")
    public List<ContainerImage> getImagesForProject(@PathParam("projectId") String projectId) {
        if (ConfigService.inKubernetes()) {
            return List.of();
        } else {
            RegistryConfig registryConfig = registryService.getRegistryConfig();
            String pattern = registryConfig.getGroup() + "/" + projectId + ":";
            return dockerService.getImages()
                    .stream().filter(s -> s.getTag().contains(pattern))
                    .sorted(Comparator.comparing(ContainerImage::getCreated).reversed().thenComparing(ContainerImage::getTag))
                    .toList();
        }
    }

    @POST
    @Path("/project/{projectId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response setProjectImage(JsonObject data, @PathParam("projectId") String projectId, @Context SecurityContext securityContext) throws Exception {
        try {
            var identity = getIdentity(securityContext);
            data.put("authorName", identity.get("name"));
            data.put("authorEmail", identity.get("email"));
            projectService.setProjectImage(projectId, data);
            return Response.ok().entity(data.getString("imageName")).build();
        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/project/{imageName}")
    public Response deleteImage(@PathParam("imageName") String imageName) {
        imageName= new String(Base64.decode(imageName));
        if (ConfigService.inKubernetes()) {
            return Response.ok().build();
        } else {
            dockerService.deleteImage(imageName);
            return Response.ok().build();
        }
    }

    @POST
    @Path("/pull/")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response share(HashMap<String, String> params)  {
        try {
            eventBus.publish(CMD_PULL_IMAGES, JsonObject.mapFrom(params));
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}