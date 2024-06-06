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
import org.apache.camel.karavan.StartupLoader;
import org.apache.camel.karavan.kubernetes.KubernetesStatusService;
import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheckResponse;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Path("/public")
public class AuthResource {

    @Inject
    StartupLoader startupLoader;

    @Inject
    KubernetesStatusService kubernetesStatusService;

    @ConfigProperty(name = "quarkus.security.users.embedded.realm-name", defaultValue = "")
    Optional<String> realm;

    @ConfigProperty(name = "quarkus.security.users.embedded.users")
    Optional<Map<String,String>> users;

    public static String getMd5Hash(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(input.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    @Path("/auth")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public Response authenticateUser(@FormParam("username") String username, @FormParam("password") String password) {
        try {
            if (users.isPresent() && users.get().containsKey(username)) {
                var pwdStored = users.get().get(username);
                var pwdReceived = new String(Base64.getDecoder().decode(password));
                var pwdString = username + ":" + realm.orElse("") + ":" + pwdReceived;
                String pwdToCheck = getMd5Hash(pwdString);
                if (Objects.equals(pwdToCheck, pwdStored)) {
                    return Response.ok().build();
                }
            }
            return Response.status(Response.Status.FORBIDDEN).entity("Incorrect Username and/or Password!").build();
        } catch (Exception e) {
            return Response.status(Response.Status.FORBIDDEN).entity(e.getMessage()).build();
        }
    }

    @GET
    @Path("/auth")
    @Produces(MediaType.TEXT_PLAIN)
    public Response authType() throws Exception {
        String authType = ConfigProvider.getConfig().getValue("karavan.auth", String.class);
        return Response.ok(authType).build();
    }

    @GET
    @Path("/sso-config")
    @Produces(MediaType.APPLICATION_JSON)
    public Response ssoConfig() throws Exception {
        Map<String, String> getSsoConfig = Map.of(
                "url", ConfigProvider.getConfig().getValue("karavan.keycloak.url", String.class),
                "realm", ConfigProvider.getConfig().getValue("karavan.keycloak.realm", String.class),
                "clientId", ConfigProvider.getConfig().getValue("karavan.keycloak.frontend.clientId", String.class)
        );
        return Response.ok(getSsoConfig).build();
    }

    @GET
    @Path("/readiness")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getConfiguration() throws Exception {
        List<HealthCheckResponse> list = List.of(
                kubernetesStatusService.call(),
                startupLoader.call()
        );
        return Response.ok(Map.of(
                "status", list.stream().allMatch(h -> Objects.equals(h.getStatus(), HealthCheckResponse.Status.UP)),
                "checks", list
        )).build();
    }
}