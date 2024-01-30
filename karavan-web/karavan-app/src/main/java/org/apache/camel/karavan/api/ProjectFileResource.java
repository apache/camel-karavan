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
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.apache.camel.karavan.validation.project.ProjectFileCreateValidator;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/file")
public class ProjectFileResource {

    @Inject
    InfinispanService infinispanService;

    @Inject
    CodeService codeService;

    @Inject
    ProjectFileCreateValidator projectFileCreateValidator;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public List<ProjectFile> get(@HeaderParam("username") String username,
                                 @PathParam("projectId") String projectId) throws Exception {
        return infinispanService.getProjectFiles(projectId).stream()
                .sorted(Comparator.comparing(ProjectFile::getName))
                .collect(Collectors.toList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public ProjectFile create(ProjectFile file) throws Exception {
        file.setLastUpdate(Instant.now().toEpochMilli());
        projectFileCreateValidator.validate(file).failOnError();
        infinispanService.saveProjectFile(file);
        return file;
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public ProjectFile update(ProjectFile file) throws Exception {
        file.setLastUpdate(Instant.now().toEpochMilli());
        infinispanService.saveProjectFile(file);
        return file;
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}/{filename}")
    public void delete(@HeaderParam("username") String username,
                       @PathParam("project") String project,
                       @PathParam("filename") String filename) throws Exception {
        infinispanService.deleteProjectFile(
                URLDecoder.decode(project, StandardCharsets.UTF_8.toString()),
                URLDecoder.decode(filename, StandardCharsets.UTF_8.toString())
        );
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/openapi/{generateRest}/{generateRoutes}/{integrationName}")
    public ProjectFile saveOpenapi(@HeaderParam("username") String username,
                                   @PathParam("integrationName") String integrationName,
                                   @PathParam("generateRest") boolean generateRest,
                                   @PathParam("generateRoutes") boolean generateRoutes, ProjectFile file) throws Exception {
        infinispanService.saveProjectFile(file);
        if (generateRest) {
            String yaml = codeService.generate(file.getName(), file.getCode(), generateRoutes);
            ProjectFile integration = new ProjectFile(integrationName, yaml, file.getProjectId(), Instant.now().toEpochMilli());
            infinispanService.saveProjectFile(integration);
            return file;
        }
        return file;
    }
}