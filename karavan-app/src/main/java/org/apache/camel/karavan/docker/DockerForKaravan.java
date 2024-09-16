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
import com.github.dockerjava.api.model.MountType;
import com.github.dockerjava.api.model.RestartPolicy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.service.CodeService.BUILD_SCRIPT_FILENAME;

@ApplicationScoped
public class DockerForKaravan {

    private static final Logger LOGGER = Logger.getLogger(DockerForKaravan.class.getName());

    @ConfigProperty(name = DEVMODE_IMAGE)
    String devmodeImage;

    @ConfigProperty(name = "karavan.devmode.createm2", defaultValue = "false")
    Optional<Boolean> createM2;

    @Inject
    DockerService dockerService;

    public void runProjectInDevMode(String projectId, String jBangOptions, DockerComposeService composeService,
                                    Map<String, String> files, String projectDevmodeImage) throws Exception {
        Container c = createDevmodeContainer(projectId, jBangOptions, composeService, projectDevmodeImage);
        dockerService.runContainer(projectId);
        dockerService.copyFiles(c.getId(), "/karavan/code", files, true);
    }

    protected Container createDevmodeContainer(String projectId, String jBangOptions, DockerComposeService compose,
                                               String projectDevmodeImage) throws InterruptedException {
        LOGGER.infof("DevMode starting for %s with JBANG_OPTIONS=%s", projectId, jBangOptions);

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        List<String> env = new ArrayList<>(compose.getEnvironmentList());

        if (jBangOptions != null && !jBangOptions.trim().isEmpty()) {
            env.add(ENV_VAR_JBANG_OPTIONS + "=" + jBangOptions);
        }

        if (createM2.orElse(false)) {
            compose.getVolumes().add(new DockerComposeVolume(MountType.VOLUME.name(), projectId+ "-m2-repository", "/karavan/.m2/repository"));
        }

        var imageName = projectDevmodeImage != null ? projectDevmodeImage : devmodeImage;

        return dockerService.createContainer(projectId,
                (imageName),
                env, compose.getPortsMap(), healthCheck,
                Map.of(LABEL_TYPE, PodContainerStatus.ContainerType.devmode.name(),
                        LABEL_PROJECT_ID, projectId,
                        LABEL_CAMEL_RUNTIME, CamelRuntime.CAMEL_MAIN.getValue()
                ),
                compose.getVolumes(), null, RestartPolicy.noRestart(), DockerService.PULL_IMAGE.ifNotExists,
                compose.getCpus(), compose.getCpu_percent(), compose.getMem_limit(), compose.getMem_reservation());
    }

    public void runBuildProject(Project project, String script, DockerComposeService compose, Map<String, String> sshFiles, String tag) throws Exception {
        String containerName = project.getProjectId() + BUILDER_SUFFIX;
        dockerService.deleteContainer(containerName);
        Container c = createBuildContainer(containerName, project, compose.getEnvironmentList(), compose.getVolumes(), tag);
        dockerService.copyExecFile(c.getId(), "/karavan/builder", BUILD_SCRIPT_FILENAME, script);
        sshFiles.forEach((name, text) -> {
            dockerService.copyExecFile(c.getId(), "/karavan/.ssh", name, text);
        });
        dockerService.runContainer(c);
    }

    protected Container createBuildContainer(String containerName, Project project, List<String> env, List<DockerComposeVolume> volumes, String tag) throws InterruptedException {
        LOGGER.infof("Starting Build Container ", containerName);

        return dockerService.createContainer(containerName, devmodeImage,
                env, Map.of(), new HealthCheck(),
                Map.of(
                        LABEL_TYPE, PodContainerStatus.ContainerType.build.name(),
                        LABEL_PROJECT_ID, project.getProjectId(),
                        LABEL_TAG, tag
                ),
                volumes, null,RestartPolicy.noRestart(), DockerService.PULL_IMAGE.ifNotExists,
                null, null, null, null,
                "/karavan/builder/build.sh");
    }
}