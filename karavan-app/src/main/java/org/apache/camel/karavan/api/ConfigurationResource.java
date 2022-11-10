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

import org.apache.camel.karavan.service.InfinispanService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/api/configuration")
public class ConfigurationResource {

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @ConfigProperty(name = "karavan.default-runtime")
    String runtime;

    @ConfigProperty(name = "karavan.runtimes")
    List<String> runtimes;

    @Inject
    InfinispanService infinispanService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getConfiguration() throws Exception {
        return Response.ok(
                Map.of(
                        "version", version,
                        "environment", environment,
                        "environments", infinispanService.getEnvironments().stream()
                                .map(e -> e.getName())
                                        .sorted((o1, o2) -> {
                                            if (o1.startsWith("dev") && o2.startsWith("test")) return -1;
                                            if (o1.startsWith("test") && o2.startsWith("dev")) return 1;
                                            if (o1.startsWith("test") && o2.startsWith("prod")) return -1;
                                            if (o1.startsWith("prod") && o2.startsWith("test")) return 1;
                                            return o1.compareTo(o2);
                                        })
                                .collect(Collectors.toList()),
                        "runtime", runtime,
                        "runtimes", runtimes
                )
        ).build();
    }

}