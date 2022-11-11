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
import org.apache.camel.karavan.service.InfinispanService;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/template")
public class TemplateResource {

    @Inject
    InfinispanService infinispanService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Project get() throws Exception {
        return infinispanService.getProject(Project.NAME_TEMPLATES);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/files")
    public List<ProjectFile> getFiles() throws Exception {
        return infinispanService.getProjectFiles(Project.NAME_TEMPLATES);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public ProjectFile save(ProjectFile file) throws Exception {
        if (file.getProjectId().equalsIgnoreCase(Project.NAME_TEMPLATES)){
            infinispanService.saveProjectFile(file);
        }
        return file;
    }
}