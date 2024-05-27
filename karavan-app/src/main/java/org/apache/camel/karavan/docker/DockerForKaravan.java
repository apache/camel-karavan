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
package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.HealthCheck;
import com.github.dockerjava.api.model.RestartPolicy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.project.ProjectService;
import org.apache.camel.karavan.status.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.apache.camel.karavan.shared.Constants.*;

@ApplicationScoped
public class DockerForKaravan {

    private static final Logger LOGGER = Logger.getLogger(DockerForKaravan.class.getName());

    @ConfigProperty(name = "karavan.devmode.image")
    String devmodeImage;

    @Inject
    DockerAPI dockerAPI;

    @Inject
    ProjectService projectService;

    public void runProjectInDevMode(String projectId, String jBangOptions, Map<Integer, Integer> ports,
                                    Map<String, String> files) throws Exception {
        Container c = createDevmodeContainer(projectId, jBangOptions, ports, new HashMap<>());
        dockerAPI.runContainer(projectId);
        dockerAPI.copyFiles(c.getId(), "/karavan/code", files, true);
    }

    protected Container createDevmodeContainer(String projectId, String jBangOptions, Map<Integer, Integer> ports, Map<String, String> volumes) throws InterruptedException {
        LOGGER.infof("DevMode starting for %s with JBANG_OPTIONS=%s", projectId, jBangOptions);

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        List<String> env = jBangOptions != null && !jBangOptions.trim().isEmpty()
                ? List.of(ENV_VAR_JBANG_OPTIONS + "=" + jBangOptions)
                : List.of();

        DockerComposeService composeService = projectService.getProjectDockerComposeService(projectId);

        return dockerAPI.createContainer(projectId, devmodeImage,
                env, ports, healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devmode.name(),
                        LABEL_PROJECT_ID, projectId,
                        LABEL_CAMEL_RUNTIME, CamelRuntime.CAMEL_MAIN.getValue()
                ),
                volumes, null, RestartPolicy.noRestart(), false,
                composeService.getCpus(), composeService.getCpu_percent(), composeService.getMem_limit(), composeService.getMem_reservation());

    }

    public void runBuildProject(Project project, String script, List<String> env, Map<String, String> sshFiles, String tag) throws Exception {
        String containerName = project.getProjectId() + BUILDER_SUFFIX;
        dockerAPI.deleteContainer(containerName);
        Container c = createBuildContainer(containerName, project, env, new HashMap<>(0), tag);
        dockerAPI.copyExecFile(c.getId(), "/karavan/builder", "build.sh", script);
        sshFiles.forEach((name, text) -> {
            dockerAPI.copyExecFile(c.getId(), "/karavan/.ssh", name, text);
        });
        dockerAPI.runContainer(c);
    }

    protected Container createBuildContainer(String containerName, Project project, List<String> env, Map<String, String> volumes, String tag) throws InterruptedException {
        LOGGER.infof("Starting Build Container ", containerName);

        return dockerAPI.createContainer(containerName, devmodeImage,
                env, Map.of(), new HealthCheck(),
                Map.of(
                        LABEL_TYPE, ContainerStatus.ContainerType.build.name(),
                        LABEL_PROJECT_ID, project.getProjectId(),
                        LABEL_TAG, tag
                ),
                volumes, null,RestartPolicy.noRestart(), false, 
                null, null, null, null,
                "/karavan/builder/build.sh");
    }
}