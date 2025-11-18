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

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.service.CodeService;

import java.util.List;
import java.util.stream.Collectors;

@Path("/ui/metadata")
public class MetadataResources {
    
    @Inject
    CodeService codeService;

    @Inject
    KaravanCache karavanCache;

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/kamelets")
    @Authenticated
    public String getKamelets() {
        StringBuilder kamelets = new StringBuilder(codeService.getResourceFile("/metadata/kamelets.yaml"));
//        List<ProjectFile> custom = karavanCache.getProjectFiles(Project.Type.kamelets.name());
//        if (!custom.isEmpty()) {
//            kamelets.append("\n---\n");
//            kamelets.append(custom.stream()
//                    .map(ProjectFile::getCode)
//                    .collect(Collectors.joining("\n---\n")));
//        }
        return kamelets.toString();
    }

    @GET
    @Authenticated
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/kamelets/{projectId}")
    public String getKameletsForProject(@PathParam("projectId") String projectId) {
//        StringBuilder kamelets = new StringBuilder(getKamelets());
        StringBuilder kamelets = new StringBuilder();
        List<ProjectFile> projectKamelets = karavanCache.getProjectFiles(projectId).stream()
                .filter(f -> f.getName().endsWith(".kamelet.yaml")).toList();

        if (!projectKamelets.isEmpty()) {
//            kamelets.append("\n---\n");
            kamelets.append(projectKamelets.stream()
                    .map(ProjectFile::getCode)
                    .collect(Collectors.joining("\n---\n")));
        }
        return kamelets.toString();
    }

    @GET
    @Authenticated
    @Path("/components")
    @Produces(MediaType.APPLICATION_JSON)
    public String getComponents() {
        return codeService.getResourceFile("/metadata/components.json");
    }

    @GET
    @Authenticated
    @Path("/beans")
    @Produces(MediaType.APPLICATION_JSON)
    public String getSpiBeans() {
        return codeService.getResourceFile("/metadata/spiBeans.json");
    }

    @GET
    @Authenticated
    @Path("/mainConfiguration")
    @Produces(MediaType.APPLICATION_JSON)
    public String getMainConfiguration() {
        return codeService.getResourceFile("/metadata/camel-main-configuration-metadata.json");
    }

    @GET
    @Authenticated
    @Path("/jbangConfiguration")
    @Produces(MediaType.APPLICATION_JSON)
    public String getJbangConfiguration() {
        return codeService.getResourceFile("/metadata/camel-jbang-configuration-metadata.json");
    }

    @GET
    @Authenticated
    @Path("/jibConfiguration")
    @Produces(MediaType.APPLICATION_JSON)
    public String getJibConfiguration() {
        return codeService.getResourceFile("/metadata/jib-configuration-metadata.json");
    }

    @GET
    @Authenticated
    @Path("/jkubeConfiguration")
    @Produces(MediaType.APPLICATION_JSON)
    public String getJkubeConfiguration() {
        return codeService.getResourceFile("/metadata/jkube-configuration-metadata.json");
    }

    @GET
    @Authenticated
    @Path("/configurationChanges")
    @Produces(MediaType.APPLICATION_JSON)
    public String getConfigurationChanges() {
        return codeService.getResourceFile("/metadata/camel-configuration-changes.json");
    }
}
