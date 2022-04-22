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

import org.apache.camel.karavan.service.FileSystemService;
import org.apache.camel.karavan.service.GeneratorService;
import org.apache.camel.karavan.service.GitService;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.io.IOException;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/openapi")
public class OpenApiResource {

    private static final String GITOPS_MODE = "gitops";
    private static final String SERVERLESS_MODE = "serverless";

    @ConfigProperty(name = "karavan.mode", defaultValue = "local")
    String mode;

    @Inject
    FileSystemService fileSystemService;

    @Inject
    GeneratorService generatorService;

    @Inject
    GitService gitService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> getList(@HeaderParam("username") String username) throws GitAPIException {
        if (mode.endsWith(GITOPS_MODE)) {
            String dir = gitService.pullIntegrations(username);
            return fileSystemService.getOpenApiList(dir).stream().collect(Collectors.toMap(s -> s, s-> ""));
        } else {
            return fileSystemService.getOpenApiList().stream().collect(Collectors.toMap(s -> s, s-> ""));
        }
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/{name}")
    public String getJson(@HeaderParam("username") String username, @PathParam("name") String name) throws GitAPIException {
        switch (mode){
            case GITOPS_MODE:
                String dir = gitService.pullIntegrations(username);
                return fileSystemService.getFile(dir, name);
            default:
                return fileSystemService.getIntegrationsFile(name);
        }
    }

    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.TEXT_PLAIN)
    @Path("/{name}/{generateRest}/{generateRoutes}/{integrationName}")
    public String save(@HeaderParam("username") String username,
                       @PathParam("name") String name,
                       @PathParam("integrationName") String integrationName,
                       @PathParam("generateRest") boolean generateRest,
                       @PathParam("generateRoutes") boolean generateRoutes,
                       String json) throws Exception {
        fileSystemService.saveIntegrationsFile(name, json);
        if (generateRest) {
            String yaml = generatorService.generate(json, generateRoutes);
            fileSystemService.saveIntegrationsFile(integrationName, yaml);
            return yaml;
        }
        return json;
    }
}