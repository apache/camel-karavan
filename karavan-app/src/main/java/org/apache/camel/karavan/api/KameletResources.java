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

import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.InfinispanService;
import org.yaml.snakeyaml.Yaml;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
        List<ProjectFile> custom = infinispanService.getProjectFiles(Project.NAME_KAMELETS);
        if (custom.size() > 0) {
            kamelets.append("\n---\n");
            kamelets.append(custom.stream()
                    .map(file -> file.getCode())
                    .collect(Collectors.joining("\n---\n")));
        }
        return kamelets.toString();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/names")
    public List<String> getCustomNames() {
        Yaml yaml = new Yaml();
        return infinispanService.getProjectFiles(Project.NAME_KAMELETS).stream()
                .map(projectFile -> {
                    Map<String, LinkedHashMap> obj = yaml.load(projectFile.getCode());
                    LinkedHashMap<String, Object> metadata = obj.get("metadata");
                    return metadata.get("name").toString();
                })
                .collect(Collectors.toList());
    }
}
