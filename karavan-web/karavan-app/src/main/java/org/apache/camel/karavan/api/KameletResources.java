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

import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.apache.camel.karavan.code.CodeService;
import org.yaml.snakeyaml.Yaml;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/kamelet")
public class KameletResources {

    @Inject
    InfinispanService infinispanService;

    @Inject
    CodeService codeService;

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String getKamelets() {
        StringBuilder kamelets = new StringBuilder(codeService.getResourceFile("/kamelets/kamelets.yaml"));
        if (infinispanService.isReady()) {
            List<ProjectFile> custom = infinispanService.getProjectFiles(Project.Type.kamelets.name());
            if (!custom.isEmpty()) {
                kamelets.append("\n---\n");
                kamelets.append(custom.stream()
                        .map(ProjectFile::getCode)
                        .collect(Collectors.joining("\n---\n")));
            }
        }
        return kamelets.toString();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/names")
    public List<String> getCustomNames() {
        if (infinispanService.isReady()) {
            Yaml yaml = new Yaml();
            return infinispanService.getProjectFiles(Project.Type.kamelets.name()).stream()
                    .map(projectFile -> projectFile.getName().replace(".kamelet.yaml", ""))
                    .collect(Collectors.toList());
        } else {
            return List.of();
        }
    }
}
