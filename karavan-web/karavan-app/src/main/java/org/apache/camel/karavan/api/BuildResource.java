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
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.kubernetes.KubernetesService;

@Path("/api/build")
public class BuildResource {

    @Inject
    KaravanCacheService karavanCacheService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    CodeService codeService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/update-config-map")
    public Response updateConfigMaps() {
        if (karavanCacheService.isReady()) {
            String script = codeService.getBuilderScript();
            kubernetesService.createBuildScriptConfigmap(script, true);
            return Response.ok().build();
        } else {
            return Response.noContent().build();
        }
    }

}