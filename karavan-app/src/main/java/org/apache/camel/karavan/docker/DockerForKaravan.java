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
import org.apache.camel.karavan.model.ContainerType;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.DockerComposeVolume;
import org.apache.camel.karavan.model.Project;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.*;

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

    public void runProjectInDevMode(String projectId, Boolean verbose, Boolean compile, DockerComposeService composeService,
                                    Map<String, String> files, String projectDevmodeImage, Map<String, String> labels, Map<String, String> envVars) throws Exception {
        Container c = createDevmodeContainer(projectId, verbose, compile, composeService, projectDevmodeImage, labels, envVars);
        dockerService.runContainer(projectId);
        dockerService.copyFiles(c.getId(), "/karavan/code", files, true);
        dockerService.copyFiles(c.getId(), "/tmp", Map.of(".karavan.done", "done"), true);
    }

    protected Container createDevmodeContainer(String projectId, Boolean verbose, Boolean compile, DockerComposeService compose,
                                               String projectDevmodeImage, Map<String, String> labels, Map<String, String> envVars) throws InterruptedException {
        LOGGER.infof("DevMode starting for %s with verbose=%s", projectId, verbose);

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        List<String> env = new ArrayList<>(compose.getEnvironmentList());
        envVars.forEach((k,v) -> env.add(k + "=" + v));
        if (verbose) {
            env.add(ENV_VAR_VERBOSE_OPTION_NAME + "=" + ENV_VAR_VERBOSE_OPTION_VALUE);
        }
        if (compile) {
            env.add(RUN_IN_COMPILE_MODE + "=true");
        }

        if (createM2.orElse(false)) {
            compose.getVolumes().add(new DockerComposeVolume(MountType.VOLUME.name(), projectId+ "-m2-repository", "/karavan/.m2/repository"));
        }

        var imageName = projectDevmodeImage != null ? projectDevmodeImage : devmodeImage;

        var containerLabels = new HashMap<>(labels);
        if (compose.getLabels() != null) {
            containerLabels.putAll(compose.getLabels());
        }
        containerLabels.put(LABEL_TYPE, ContainerType.devmode.name());
        containerLabels.put(LABEL_PROJECT_ID, projectId);
        containerLabels.put(LABEL_CAMEL_RUNTIME, CamelRuntime.CAMEL_MAIN.getValue());

        return dockerService.createContainer(projectId,
                (imageName),
                env, compose.getPortsMap(), healthCheck,
                containerLabels,
                compose.getVolumes(), null, RestartPolicy.noRestart(), DockerService.PULL_IMAGE.ifNotExists,
                compose.getCpus(), compose.getCpu_percent(), compose.getMem_limit(), compose.getMem_reservation());
    }

    public void runBuildProject(Project project, String script, DockerComposeService compose, Map<String, String> sshFiles, String tag) throws Exception {
        String containerName = project.getProjectId() + BUILDER_SUFFIX;
        dockerService.deleteContainer(containerName);
        if (createM2.orElse(false)) {
            compose.getVolumes().add(new DockerComposeVolume(MountType.VOLUME.name(), project.getProjectId() + "-build-m2-repository", "/karavan/.m2/repository"));
        }
        compose.addEnvironment(RUN_IN_BUILD_MODE, "true");
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
                        LABEL_TYPE, ContainerType.build.name(),
                        LABEL_PROJECT_ID, project.getProjectId(),
                        LABEL_TAG, tag
                ),
                volumes, null,RestartPolicy.noRestart(), DockerService.PULL_IMAGE.ifNotExists,
                null, null, null, null,
                "/karavan/builder/build.sh");
    }
}