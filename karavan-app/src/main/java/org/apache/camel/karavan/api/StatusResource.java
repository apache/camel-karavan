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

import io.vertx.core.eventbus.EventBus;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.ProjectEnvStatus;
import org.apache.camel.karavan.model.ProjectStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.StatusService;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/status")
public class StatusResource {

    private static final Logger LOGGER = Logger.getLogger(StatusResource.class.getName());

    @Inject
    InfinispanService infinispanService;

    @Inject
    KaravanConfiguration configuration;

    @Inject
    EventBus bus;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/project/{projectId}")
    public ProjectStatus getStatus(@HeaderParam("username") String username, @PathParam("projectId") String projectId) {
        bus.publish(StatusService.CMD_COLLECT_STATUSES, projectId);
        ProjectStatus status = infinispanService.getProjectStatus(projectId);
        if (status != null){
            return status;
        } else {
            return new ProjectStatus( projectId,
                    configuration.environments()
                            .stream().map(e -> new ProjectEnvStatus(e.name()))
                            .collect(Collectors.toList()),
                    Long.valueOf(0));
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/projects")
    public Map<String, Map> getSimpleStatus(@HeaderParam("username") String username) throws Exception {
        Map<String, Map> result = new HashMap<>();
        infinispanService.getProjects().forEach(project -> {
            ProjectStatus ps = getStatus(username, project.getProjectId());
            Map<String, String> statuses = new HashMap<>();
            ps.getStatuses().forEach(pes -> {
                if (pes.getLastPipelineRunResult() == null || pes.getDeploymentStatus() == null || pes.getContextStatus() == null){
                    statuses.put(pes.getEnvironment(), "N/A");
                } else {
                    boolean pipelineOK = pes.getLastPipelineRunResult().equals("Succeeded");
                    System.out.println(pes.getLastPipelineRunResult());
                    boolean deploymentOK = pes.getDeploymentStatus().getReadyReplicas() == pes.getDeploymentStatus().getReplicas() && pes.getDeploymentStatus().getUnavailableReplicas() == 0;
                    boolean camelOK = pes.getContextStatus().equals(ProjectEnvStatus.Status.UP) && pes.getConsumerStatus().equals(ProjectEnvStatus.Status.UP) && pes.getRoutesStatus().equals(ProjectEnvStatus.Status.UP);
                    String status = (pipelineOK && deploymentOK && camelOK) ? "UP" : "DOWN";
                    statuses.put(pes.getEnvironment(), status);
                }
            });
            result.put(project.getProjectId(), statuses);
        });

        return result;
    }
}