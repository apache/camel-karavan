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
package org.apache.camel.karavan.cli.resources;

import io.fabric8.kubernetes.api.model.EnvVarBuilder;
import io.fabric8.kubernetes.api.model.EnvVarSourceBuilder;
import io.fabric8.tekton.pipeline.v1beta1.*;
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanConfig;
import org.apache.camel.karavan.cli.ResourceUtils;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.stream.Collectors;

public class KaravanTekton {

    public static Task getTask(KaravanConfig config, String runtime) {
        String taskName = Constants.TASK_DEV + runtime;
        String buildImage = config.getBaseBuilderImage();
        String script = getScript(config, runtime);

        return new TaskBuilder()
                .withNewMetadata()
                .withName(taskName)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(taskName, config.getVersion(), Map.of()))
                .endMetadata()
                .withNewSpec()
                .withParams(new ParamSpecBuilder().withName("project").withType("string").withDescription("ProjectId").build())
                .withSteps(
                        new StepBuilder().withName("karavan-build-deploy")
                                .withScript(script)
                                .withImage(buildImage + ":" + config.getVersion())
                                .withEnv(
                                        new EnvVarBuilder().withName("GIT_REPOSITORY").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("git-repository").and().build()).build(),
                                        new EnvVarBuilder().withName("GIT_USERNAME").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("git-username").and().build()).build(),
                                        new EnvVarBuilder().withName("GIT_PASSWORD").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("git-password").and().build()).build(),
                                        new EnvVarBuilder().withName("GIT_BRANCH").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("git-branch").and().build()).build(),
                                        new EnvVarBuilder().withName("IMAGE_REGISTRY").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("image-registry").withOptional(true).and().build()).build(),
                                        new EnvVarBuilder().withName("IMAGE_GROUP").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("image-group").withOptional(true).and().build()).build(),
                                        new EnvVarBuilder().withName("IMAGE_REGISTRY_USERNAME").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("image-registry-username").withOptional(true).and().build()).build(),
                                        new EnvVarBuilder().withName("IMAGE_REGISTRY_PASSWORD").withValueFrom(
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("image-registry-password").withOptional(true).and().build()).build()
                                )
                                .build()
                )
                .withWorkspaces(
                        new WorkspaceDeclaration("Maven Settings", "/karavan/maven-settings.xml", Constants.PVC_MAVEN_SETTINGS, false, false),
                        new WorkspaceDeclaration("Maven Cache", "/root/.m2", Constants.PVC_M2_CACHE, false, false),
                        new WorkspaceDeclaration("JBang Cache", "/jbang/.jbang/cache", Constants.PVC_JBANG_CACHE, false, false)
                )
                .endSpec()
                .build();
    }

    private static String getScript(KaravanConfig config, String runtime) {
        try {
            InputStream inputStream = config.isOpenShift()
                    ? KaravanTekton.class.getResourceAsStream("/" + runtime + "-builder-script-openshift.sh")
                    : KaravanTekton.class.getResourceAsStream("/" + runtime + "-builder-script-kubernetes.sh");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines()
                    .map(s -> {
                        if (s.contains("quarkus.container-image.registry")) {
                            return s.replace("${IMAGE_REGISTRY}", config.getImageRegistry());
                        } else {
                            return s;
                        }
                    })
                    .collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    public static Pipeline getPipeline(KaravanConfig config, String runtime) {
        String taskName = Constants.TASK_DEV + runtime;
        String pipelineName = Constants.PIPELINE_DEV + runtime;

        return new PipelineBuilder()
                .withNewMetadata()
                .withName(pipelineName)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(pipelineName, config.getVersion(),  Map.of()))
                .endMetadata()
                .withNewSpec()
                .withParams(new ParamSpecBuilder().withName("PROJECT_ID").withType("string").withDescription("ProjectId").build())
                .withTasks(
                        new PipelineTaskBuilder().withName(taskName)
                                .withParams(new ParamBuilder().withName("project").withNewValue("$(params.PROJECT_ID)").build())
                                .withTaskRef(new TaskRefBuilder().withKind("Task").withName(taskName).build())
                                .withWorkspaces(
                                        new WorkspacePipelineTaskBinding(Constants.PVC_MAVEN_SETTINGS, "", Constants.PVC_MAVEN_SETTINGS),
                                        new WorkspacePipelineTaskBinding(Constants.PVC_M2_CACHE, "", Constants.PVC_M2_CACHE),
                                        new WorkspacePipelineTaskBinding(Constants.PVC_JBANG_CACHE, "", Constants.PVC_JBANG_CACHE)
                                )
                                .build()
                )
                .withWorkspaces(
                        new PipelineWorkspaceDeclaration("Maven Settings", Constants.PVC_MAVEN_SETTINGS, false),
                        new PipelineWorkspaceDeclaration("Maven Cache", Constants.PVC_M2_CACHE, false),
                        new PipelineWorkspaceDeclaration("JBang Cache", Constants.PVC_JBANG_CACHE, false)
                )
                .endSpec()
                .build();
    }

}
