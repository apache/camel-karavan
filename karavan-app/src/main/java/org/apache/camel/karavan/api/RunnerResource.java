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

import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.service.KubernetesService.RUNNER_SUFFIX;

@Path("/api/runner")
public class RunnerResource {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    InfinispanService infinispanService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String runProject(Project project) {
        Project p = infinispanService.getProject(project.getProjectId());
        return kubernetesService.tryCreatePod(p);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/status/{projectId}/{name}")
    public Response getPodStatus(@PathParam("projectId") String projectId, @PathParam("name") String name) {
        Optional<PodStatus> ps =  infinispanService.getPodStatuses(projectId, environment).stream()
                .filter(podStatus -> podStatus.getName().equals(name))
                .findFirst();
        if (ps.isPresent()) {
            return Response.ok(ps.get()).build();
        } else {
            return Response.noContent().build();
        }
    }
}