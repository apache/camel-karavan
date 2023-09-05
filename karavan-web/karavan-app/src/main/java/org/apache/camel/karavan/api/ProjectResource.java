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
import org.apache.camel.karavan.infinispan.model.GroupedKey;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.GitService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.apache.camel.karavan.service.ProjectService;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Path("/api/project")
public class ProjectResource {

    @Inject
    InfinispanService infinispanService;

    @Inject
    GitService gitService;

    @Inject
    ProjectService projectService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Project> getAll(@QueryParam("type") String type) {
        if (infinispanService.isReady()) {
            return infinispanService.getProjects().stream()
                    .filter(p -> type == null || Objects.equals(p.getType().name(), type))
                    .sorted(Comparator.comparing(Project::getProjectId))
                    .collect(Collectors.toList());
        } else {
            return List.of();
        }
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
        return projectService.save(project);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{project}")
    public void delete(@HeaderParam("username") String username,
                          @PathParam("project") String project) throws Exception {
        String projectId = URLDecoder.decode(project, StandardCharsets.UTF_8);
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
        infinispanService.saveProject(project);
//        Copy files
        Map<GroupedKey, ProjectFile> map = infinispanService.getProjectFilesMap(sourceProject).entrySet().stream()
                .collect(Collectors.toMap(
                        e -> new GroupedKey(project.getProjectId(), e.getKey().getEnv(), e.getKey().getKey()),
                        e -> {
                            ProjectFile file = e.getValue();
                            file.setProjectId(project.getProjectId());
                            return file;
                        })
                );
        infinispanService.saveProjectFiles(map);
        return project;
    }
}