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

import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Optional;

@Path("/tekton")
public class TektonResource {

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    KaravanConfiguration configuration;

    private static final Logger LOGGER = Logger.getLogger(TektonResource.class.getName());

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{environment}")
    public Project push(@HeaderParam("username") String username, @PathParam("environment") String environment, Project project) throws Exception {
        Project p = infinispanService.getProject(project.getProjectId());
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            kubernetesService.createPipelineRun(project, env.get().pipeline(), env.get().namespace());
        }
        return p;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{environment}/{name}")
    public Response get(@HeaderParam("username") String username, @PathParam("environment") String environment,
                        @PathParam("name") String name) throws Exception {
        Optional<KaravanConfiguration.Environment> env = configuration.environments().stream().filter(e -> e.name().equals(environment)).findFirst();
        if (env.isPresent()) {
            return Response.ok(kubernetesService.getPipelineRun(name, env.get().namespace())).build();
        } else {
            return Response.noContent().build();
        }
    }
}