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
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.registry.RegistryConfig;
import org.apache.camel.karavan.registry.RegistryService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.ProjectService;
import org.jose4j.base64url.Base64;

import java.util.Comparator;
import java.util.List;

@Path("/api/image")
public class ImagesResource {

    @Inject
    DockerService dockerService;

    @Inject
    RegistryService registryService;

    @Inject
    ProjectService projectService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public List<String> getImagesForProject(@HeaderParam("username") String username,
                                 @PathParam("projectId") String projectId) {

        RegistryConfig registryConfig = registryService.getRegistryConfig();
        String pattern = registryConfig.getGroup() + "/" + projectId;
        if (ConfigService.inKubernetes()) {
            return List.of();
        } else {
            return dockerService.getImages()
                    .stream().filter(s -> s.contains(pattern)).sorted(Comparator.reverseOrder()).toList();
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public Response build(JsonObject data, @PathParam("projectId") String projectId) throws Exception {
        try {
            projectService.setProjectImage(projectId, data);
            return Response.ok().entity(data.getString("imageName")).build();
        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{imageName}")
    public Response deleteImage(@PathParam("imageName") String imageName) {
        imageName= new String(Base64.decode(imageName));
        if (ConfigService.inKubernetes()) {
            return Response.ok().build();
        } else {
            dockerService.deleteImage(imageName);
            return Response.ok().build();
        }
    }
}