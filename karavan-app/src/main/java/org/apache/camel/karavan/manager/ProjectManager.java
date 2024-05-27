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
package org.apache.camel.karavan.manager;

import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.RegistryService;
import org.apache.camel.karavan.manager.docker.DockerForKaravan;
import org.apache.camel.karavan.manager.kubernetes.KubernetesManager;
import org.apache.camel.karavan.project.CodeService;
import org.apache.camel.karavan.project.GitService;
import org.apache.camel.karavan.project.model.DockerComposeService;
import org.apache.camel.karavan.project.model.Project;
import org.apache.camel.karavan.config.ConfigService;
import org.apache.camel.karavan.status.StatusCache;
import org.apache.camel.karavan.status.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.*;

import static org.apache.camel.karavan.status.StatusEvents.CONTAINER_UPDATED;

@Default
@ApplicationScoped
public class ProjectManager {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    StatusCache statusCache;

    @Inject
    KubernetesManager kubernetesManager;

    @Inject
    DockerForKaravan dockerForKaravan;

    @Inject
    RegistryService registryService;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @Inject
    EventBus eventBus;

    public String runProjectWithJBangOptions(Project project, String jBangOptions) throws Exception {
        String containerName = project.getProjectId();
        ContainerStatus status = statusCache.getDevModeContainerStatus(project.getProjectId(), environment);
        if (status == null) {
            status = ContainerStatus.createDevMode(project.getProjectId(), environment);
        }
        if (!Objects.equals(status.getState(), ContainerStatus.State.running.name())) {
            status.setInTransit(true);
            eventBus.publish(CONTAINER_UPDATED, JsonObject.mapFrom(status));

            Map<String, String> files = codeService.getProjectFilesForDevMode(project.getProjectId(), true);
            if (ConfigService.inKubernetes()) {
                kubernetesManager.runDevModeContainer(project, jBangOptions, files);
            } else {
                DockerComposeService dcs = codeService.getDockerComposeService(project.getProjectId());
                dockerForKaravan.runProjectInDevMode(project.getProjectId(), jBangOptions, dcs.getPortsMap(), files);
            }
            return containerName;
        } else {
            return null;
        }
    }

    public void buildProject(Project project, String tag) throws Exception {
        tag = tag != null && !tag.isEmpty() && !tag.isBlank()
                ? tag
                : Instant.now().toString().substring(0, 19).replace(":", "-");
        String script = codeService.getBuilderScript();
        List<String> env = getProjectEnvForBuild(project, tag);
        if (ConfigService.inKubernetes()) {
            kubernetesManager.runBuildProject(project, script, env, tag);
        } else {
            env.addAll(getConnectionsEnvForBuild());
            Map<String, String> sshFiles = getSshFiles();
            dockerForKaravan.runBuildProject(project, script, env, sshFiles, tag);
        }
    }

    private Map<String, String> getSshFiles() {
        Map<String, String> sshFiles = new HashMap<>(2);
        Tuple2<String,String> sshFileNames = gitService.getSShFiles();
        if (sshFileNames.getItem1() != null) {
            sshFiles.put("id_rsa", codeService.getFileString(sshFileNames.getItem1()));
        }
        if (sshFileNames.getItem2() != null) {
            sshFiles.put("known_hosts", codeService.getFileString(sshFileNames.getItem2()));
        }
        return sshFiles;
    }

    private List<String> getProjectEnvForBuild(Project project, String tag) {
        return new ArrayList<>(List.of(
                "PROJECT_ID=" + project.getProjectId(),
                "TAG=" + tag
        ));
    }

    private List<String> getConnectionsEnvForBuild() {
        List<String> env = new ArrayList<>();
        env.addAll(registryService.getEnvForBuild());
        env.addAll(gitService.getEnvForBuild());
        return env;
    }
}
