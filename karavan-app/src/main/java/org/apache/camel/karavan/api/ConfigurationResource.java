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
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.RestResponse;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/configuration")
public class ConfigurationResource {

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.mode")
    String mode;

    @Inject
    KaravanConfiguration configuration;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public RestResponse<Map<String, Object>> getConfiguration() throws Exception {
        return RestResponse.ResponseBuilder.ok(
                Map.of(
                        "version", version,
                        "mode", mode,
                        "environments", configuration.environments().stream().map(e -> e.name()).collect(Collectors.toList()),
                        "defaultRuntime", configuration.defaultRuntime(),
                        "groupId", configuration.groupId()
                )
        ).build();
    }

}