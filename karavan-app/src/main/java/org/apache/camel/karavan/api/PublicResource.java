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

import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesStatusService;
import org.apache.camel.karavan.loader.StartupLoader;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheckResponse;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Path("/public")
public class PublicResource {

    @Inject
    StartupLoader startupLoader;

    @Inject
    KubernetesStatusService kubernetesStatusService;

    @Inject
    DockerService dockerService;

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @GET
    @Path("/readiness")
    @PermitAll
    @Produces(MediaType.APPLICATION_JSON)
    public Response getConfiguration() throws Exception {
        var infraCheck = ConfigService.inKubernetes() ? kubernetesStatusService.call() : dockerService.call();

        List<HealthCheckResponse> list = List.of(
                infraCheck,
                startupLoader.call()
        );
        return Response.ok(Map.of(
                "status", list.stream().allMatch(h -> Objects.equals(h.getStatus(), HealthCheckResponse.Status.UP)),
                "checks", list,
                "environment", environment
        )).build();
    }
}