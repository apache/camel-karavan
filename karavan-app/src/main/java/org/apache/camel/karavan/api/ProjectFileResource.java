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
import io.vertx.core.json.JsonObject;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFileCommited;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Path("/ui/file")
public class ProjectFileResource {

    @Inject
    KaravanCache karavanCache;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public List<ProjectFile> getProjectFilesByName(@PathParam("projectId") String projectId, @QueryParam("filename") String filename) throws Exception {
        if (filename == null) {
            return karavanCache.getProjectFiles(projectId).stream()
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(ProjectFile::getName))
                    .collect(Collectors.toList());
        } else {
            var file = karavanCache.getProjectFile(projectId, filename);
            if (file != null) {
                return List.of(file);
            } else {
                return List.of();
            }
        }
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public List<ProjectFile> getFileByName(@QueryParam("filename") String filename) {
        return karavanCache.getProjectFilesByName(filename);
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/commited/{projectId}")
    public List<ProjectFileCommited> getCommitedFiles(@PathParam("projectId") String projectId) {
        return karavanCache.getProjectFilesCommited(projectId).stream()
                .map(f -> new ProjectFileCommited(f.getName(), "", f.getProjectId(), f.getCommitId(), f.getCommitTime()))
                .collect(Collectors.toList());
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/commited/{projectId}/{filename}")
    public ProjectFileCommited getCommitedFile(@PathParam("projectId") String projectId, @PathParam("filename") String filename) {
        return karavanCache.getProjectFileCommited(projectId, filename);
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/diff/{projectId}")
    public Map<String, String> getChanged(@PathParam("projectId") String projectId) {
        Map<String, String> result = new HashMap<>();
        List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
        List<ProjectFileCommited> filesCommited = karavanCache.getProjectFilesCommited(projectId);
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

    @POST
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(ProjectFile file) throws Exception {
        file.setLastUpdate(Instant.now().getEpochSecond() * 1000L);
        boolean projectFileExists = karavanCache.getProjectFile(file.getProjectId(), file.getName()) != null;
        if (projectFileExists) {
            return Response.serverError().entity("File with given name already exists " + file.getName() + " in project " + file.getProjectId()).build();
        } else {
            karavanCache.saveProjectFile(file, null, true);
            return Response.ok(file).build();
        }
    }

    @PUT
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public ProjectFile update(ProjectFile file) throws Exception {
        file.setLastUpdate(Instant.now().getEpochSecond() * 1000L);
        karavanCache.saveProjectFile(file, null, true);
        return file;
    }

    @PATCH
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}/{filename}")
    public Response rename(@PathParam("projectId") String projectId,
                           @PathParam("filename") String filename,
                           JsonObject copy) throws Exception {
        try {
            var newName = copy.getString("newName");
            var fromFile = karavanCache.getProjectFile(projectId, filename);
            var toFile = karavanCache.getProjectFile(projectId, newName);
            if (toFile != null) {
                return Response.status(Response.Status.CONFLICT).entity("File Already Exists!").build();
            } else {
                var file = new ProjectFile();
                file.setName(newName);
                file.setProjectId(fromFile.getProjectId());
                file.setCode(fromFile.getCode());
                file.setLastUpdate(fromFile.getLastUpdate());
                file.setProjectId(fromFile.getProjectId());
                karavanCache.saveProjectFile(file, null, true);
                karavanCache.deleteProjectFile(projectId, filename);
                karavanCache.deleteProjectFileCommited(projectId, filename);
                return Response.ok(file).build();
            }
        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}/{filename}")
    public void delete(@PathParam("project") String project,
                       @PathParam("filename") String filename) throws Exception {
        karavanCache.deleteProjectFile(
                URLDecoder.decode(project, StandardCharsets.UTF_8),
                URLDecoder.decode(filename, StandardCharsets.UTF_8)
        );
    }

    @POST
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/copy")
    public Response copy(JsonObject copy) throws Exception {
        var fromProjectId = copy.getString("fromProjectId");
        var fromFilename = copy.getString("fromFilename");
        var toProjectId = copy.getString("toProjectId");
        var toFilename = copy.getString("toFilename");
        var overwrite = copy.getBoolean("overwrite", false);
        var tofile = karavanCache.getProjectFile(toProjectId, toFilename);
        if (overwrite || tofile == null) {
            var file = karavanCache.getProjectFile(fromProjectId, fromFilename);
            var copyFile = file.copy();
            copyFile.setProjectId(toProjectId);
            copyFile.setName(toFilename);
            karavanCache.saveProjectFile(copyFile, null, true);
            return Response.ok().build();
        } else {
            return Response.notModified().build();
        }
    }
}