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

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.kubernetes.KubernetesManager;

import org.apache.camel.karavan.ConfigService;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.kubernetes.KubernetesStatusService;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.ServiceStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Path("/ui/infrastructure")
public class InfrastructureResource {

    @Inject
    KaravanCache karavanCache;

    @Inject
    KubernetesManager kubernetesManager;

    @Inject
    KubernetesStatusService kubernetesStatusService;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    private static final Logger LOGGER = Logger.getLogger(InfrastructureResource.class.getName());

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment")
    public List<DeploymentStatus> getAllDeploymentStatuses() throws Exception {
        return karavanCache.getDeploymentStatuses().stream()
                .sorted(Comparator.comparing(DeploymentStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/{env}")
    public List<DeploymentStatus> getDeploymentStatusesByEnv(@PathParam("env") String env) throws Exception {
        return karavanCache.getDeploymentStatuses(env).stream()
                .sorted(Comparator.comparing(DeploymentStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/deployment/rollout/{env}/{name}")
    public Response rollout(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesManager.rolloutDeployment(name, kubernetesManager.getNamespace());
        return Response.ok().build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/deployment/{env}/{name}")
    public Response deleteDeployment(@PathParam("env") String env, @PathParam("name") String name) throws Exception {
        kubernetesManager.deleteDeployment(name, kubernetesManager.getNamespace());
        return Response.ok().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/service")
    public List<ServiceStatus> getAllServiceStatuses() throws Exception {
        return karavanCache.getServiceStatuses().stream()
                .sorted(Comparator.comparing(ServiceStatus::getProjectId))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/configmaps")
    public Response getConfigMaps() throws Exception {
        if (ConfigService.inKubernetes()) {
            return Response.ok(kubernetesManager.getConfigMaps(kubernetesManager.getNamespace())).build();
        } else {
            return Response.ok(List.of()).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/secrets")
    public Response getSecrets() throws Exception {
        if (ConfigService.inKubernetes()) {
            return Response.ok(kubernetesManager.getSecrets(kubernetesManager.getNamespace())).build();
        } else {
            return Response.ok(List.of()).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/services")
    public Response getServices() throws Exception {
        if (ConfigService.inKubernetes()) {
            return Response.ok(kubernetesManager.getServices(kubernetesManager.getNamespace())).build();
        } else {
            List<String> list = karavanCache.getContainerStatuses(environment).stream()
                    .filter(ci -> ci.getPorts() != null && !ci.getPorts().isEmpty())
                    .map(ci -> ci.getPorts().stream().map(i -> ci.getContainerName() + "|" + ci.getContainerName() + ":" + i.getPrivatePort()).collect(Collectors.toList()))
                    .flatMap(List::stream).collect(Collectors.toList());
            return Response.ok(list).build();
        }
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/informers")
    public Response restartInformers() {
        if (ConfigService.inKubernetes()) {
            kubernetesStatusService.startInformers();
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }
}