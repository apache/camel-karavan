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
import org.apache.camel.karavan.service.ProjectService;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.HashMap;
import java.util.Map;

@Path("/api/git")
public class ProjectGitResource {

    @Inject
    ProjectService projectService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Map<String,String> push(HashMap<String, String> params) throws Exception {
        Map<String,String> result = projectService.commitAndPushProject(params.get("projectId"), params.get("message"),params.get("username"),params.get("accessToken"),params.get("repoUri"),params.get("branch"),params.get("file"),params.get("isConflictResolved"));
        // System.out.println("sending push request"+result.toString());
         return result;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{projectId}")
    public Project pull(@PathParam("projectId") String projectId) throws Exception {
        return projectService.importProject(projectId);
    }
}