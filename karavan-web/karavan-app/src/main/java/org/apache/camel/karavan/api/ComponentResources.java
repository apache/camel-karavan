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
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.Set;

import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.infinispan.InfinispanService;

@Path("/api/component")
public class ComponentResources {

    @Inject
    InfinispanService infinispanService;

    @Inject
    CodeService codeService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String getJson() {
        return codeService.getResourceFile("/components/components.json");
    }

    @GET
    @Path("/blocklist")
    public Set<String> blocklist() {
        return infinispanService.getBlockedComponents();
    }

    @PUT
    @Path("/block")
    public void blockComponent(String componentName) {
        infinispanService.blockComponent(componentName);
    }

    @PUT
    @Path("/unblock")
    public void unblockComponent(String componentName) {
        infinispanService.unblockComponent(componentName);
    }
}
