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
import org.apache.camel.karavan.service.GitService;
import org.apache.camel.karavan.service.InfinispanService;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.List;

@Path("/git")
public class GitResource {

    @Inject
    InfinispanService infinispanService;
    @Inject
    GitService gitService;

    private static final Logger LOGGER = Logger.getLogger(GitResource.class.getName());

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Project push(@HeaderParam("username") String username, Project project) throws Exception {
        Project p = infinispanService.getProject(project.getProjectId());
        List<ProjectFile> files = infinispanService.getProjectFiles(project.getProjectId());
        String commitId = gitService.commitAndPushProject(p, files);
        p.setLastCommit(commitId);
        infinispanService.saveProject(p);
        return p;
    }
}