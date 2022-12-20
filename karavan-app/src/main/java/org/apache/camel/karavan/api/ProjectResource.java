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

import org.apache.camel.karavan.model.GroupedKey;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.GitService;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/api/project")
public class ProjectResource {

    @Inject
    InfinispanService infinispanService;

    @Inject
    GitService gitService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Project> getAll() throws Exception {
        return infinispanService.getProjects().stream()
                .sorted((p1, p2) -> {
                    if (p1.getProjectId().equalsIgnoreCase(Project.NAME_TEMPLATES)) return 1;
                    if (p2.getProjectId().equalsIgnoreCase(Project.NAME_TEMPLATES)) return 1;
                    if (p1.getProjectId().equalsIgnoreCase(Project.NAME_KAMELETS)) return 1;
                    if (p2.getProjectId().equalsIgnoreCase(Project.NAME_KAMELETS)) return 1;
                    return (p1.getProjectId().compareTo(p2.getProjectId()));
                })
                .collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}")
    public Project get(@PathParam("project") String project) throws Exception {
        return infinispanService.getProject(project);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Project save(Project project) throws Exception {
        infinispanService.saveProject(project, false);
        return project;
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}")
    public void delete(@HeaderParam("username") String username,
                          @PathParam("project") String project) throws Exception {
        String projectId = URLDecoder.decode(project, StandardCharsets.UTF_8.toString());
        gitService.deleteProject(projectId, infinispanService.getProjectFiles(projectId));
        infinispanService.getProjectFiles(projectId).forEach(file -> infinispanService.deleteProjectFile(projectId, file.getName()));
        infinispanService.deleteProject(projectId);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/copy/{sourceProject}")
    public Project copy(@PathParam("sourceProject") String sourceProject, Project project) throws Exception {
//        Save project
        Project s = infinispanService.getProject(sourceProject);
        project.setRuntime(s.getRuntime());
        infinispanService.saveProject(project, false);
//        Copy files
        Map<GroupedKey, ProjectFile> map = infinispanService.getProjectFiles(sourceProject).stream()
                .collect(Collectors.toMap(f -> new GroupedKey(project.getProjectId(), f.getName()), f -> f));
        infinispanService.saveProjectFiles(map);
        return project;
    }
}