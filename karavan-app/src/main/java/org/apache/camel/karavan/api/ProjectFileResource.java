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
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.apache.camel.karavan.service.CodeService;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Path("/ui/file")
public class ProjectFileResource {

    @Inject
    KaravanCache karavanCache;

    @Inject
    CodeService codeService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public List<ProjectFile> get(@PathParam("projectId") String projectId) throws Exception {
        return karavanCache.getProjectFiles(projectId).stream()
                .sorted(Comparator.comparing(ProjectFile::getName))
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/commited/{projectId}/{filename}")
    public ProjectFile getCommited(@PathParam("projectId") String projectId, @PathParam("filename") String filename) {
        return karavanCache.getProjectFileCommited(projectId, filename);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/diff/{projectId}")
    public Map<String, String> getChanged(@PathParam("projectId") String projectId) {
        Map<String, String> result = new HashMap<>();
        List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
        List<ProjectFile> filesCommited = karavanCache.getProjectFilesCommited(projectId);
        files.forEach(pf -> {
            var pfc = filesCommited.stream().filter(f -> Objects.equals(f.getName(), pf.getName())).findFirst();
            if (pfc.isPresent()) {
                if (!Objects.equals(pfc.get().getCode(), pf.getCode())){
                    result.put(pf.getName(), "CHANGED");
                }
            } else {
                result.put(pf.getName(), "NEW");
            }
        });
        filesCommited.forEach(pfc -> {
            var pf = files.stream().filter(f -> Objects.equals(f.getName(), pfc.getName())).findFirst();
            if (pf.isEmpty()) {
                result.put(pfc.getName(), "DELETED");
            }
        });
        return result;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/templates/beans")
    public List<ProjectFile> getBeanTemplates() throws Exception {
        return  codeService.getBeanTemplateNames().stream()
                .map(s -> karavanCache.getProjectFile(Project.Type.templates.name(), s))
                .toList();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(ProjectFile file) throws Exception {
        file.setLastUpdate(Instant.now().toEpochMilli());
        boolean projectFileExists = karavanCache.getProjectFile(file.getProjectId(), file.getName()) != null;
        if (projectFileExists) {
            return Response.serverError().entity("File with given name already exists").build();
        } else {
            karavanCache.saveProjectFile(file, false, false);
            return Response.ok(file).build();
        }
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public ProjectFile update(ProjectFile file) throws Exception {
        file.setLastUpdate(Instant.now().toEpochMilli());
        karavanCache.saveProjectFile(file, false, false);
        return file;
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}/{filename}")
    public void delete(@PathParam("project") String project,
                       @PathParam("filename") String filename) throws Exception {
        karavanCache.deleteProjectFile(
                URLDecoder.decode(project, StandardCharsets.UTF_8),
                URLDecoder.decode(filename, StandardCharsets.UTF_8),
                false
        );
    }
}