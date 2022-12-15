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
package org.apache.camel.karavan.operator.resource;

import io.fabric8.kubernetes.api.model.EnvVarBuilder;
import io.fabric8.kubernetes.api.model.EnvVarSourceBuilder;
import io.fabric8.kubernetes.api.model.Secret;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.client.DefaultTektonClient;
import io.fabric8.tekton.pipeline.v1beta1.ParamSpecBuilder;
import io.fabric8.tekton.pipeline.v1beta1.StepBuilder;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import io.fabric8.tekton.pipeline.v1beta1.TaskBuilder;
import io.fabric8.tekton.pipeline.v1beta1.WorkspaceDeclaration;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import io.javaoperatorsdk.operator.processing.dependent.workflow.Condition;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.CamelRuntime;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;
import org.eclipse.microprofile.config.ConfigProvider;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.stream.Collectors;

public class KaravanTektonTask extends CRUDKubernetesDependentResource<Task, Karavan>  implements Condition<Task, Karavan>  {

    private final boolean isOpenShift;
    private final CamelRuntime.Type runtime;

    public KaravanTektonTask(boolean isOpenShift, CamelRuntime.Type runtime) {
        super(Task.class);
        this.isOpenShift = isOpenShift;
        this.runtime = runtime;
    }

    private String getName(){
        return Constants.TASK_DEV + runtime.getName();
    }

    @Override
    @SuppressWarnings("unchecked")
    public Task desired(Karavan karavan, Context<Karavan> context) {
        String image = ConfigProvider.getConfig().getValue("karavan.build-image", String.class);
        String version = ConfigProvider.getConfig().getValue("karavan.version", String.class);
        String script = getScript(karavan);

        return new TaskBuilder()
                .withNewMetadata()
                .withName(getName())
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(getName(), Map.of()))
                .endMetadata()
                .withNewSpec()
                .withParams(new ParamSpecBuilder().withName("project").withType("string").withDescription("ProjectId").build())
                .withSteps(
                        new StepBuilder().withName("karavan-build-deploy")
                                .withScript(script)
                                .withImage(image + ":" + version)
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
                                                new EnvVarSourceBuilder().withNewSecretKeyRef().withName("karavan").withKey("image-registry").withOptional(true).and().build()).build()
                                )
                                .build()
                )
                .withWorkspaces(
                        new WorkspaceDeclaration("Maven Cache", "/root/.m2", Constants.PVC_M2_CACHE, false, false),
                        new WorkspaceDeclaration("JBang Cache", "/jbang/.jbang/cache", Constants.PVC_JBANG_CACHE, false, false)
                )
                .endSpec()
                .build();
    }

    @Override
    public ReconcileResult<Task> reconcile(Karavan karavan, Context<Karavan> context) {
        Task task = new DefaultTektonClient(getKubernetesClient()).v1beta1().tasks().inNamespace(karavan.getMetadata().getNamespace()).withName(getName()).get();
        if (task == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(task);
        }
    }

    protected String getScript(Karavan karavan) {
        String imageRegistry = getImageRegistry(karavan);
        String prefix = runtime.getName();
        try {
            InputStream inputStream = isOpenShift
                ? KaravanTektonTask.class.getResourceAsStream("/" + prefix + "-builder-script-openshift.sh")
                : KaravanTektonTask.class.getResourceAsStream("/" + prefix + "-builder-script-kubernetes.sh");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines()
                    .map(s -> {
                        if (s.contains("quarkus.container-image.registry")) {
                            return s.replace("${IMAGE_REGISTRY}", imageRegistry);
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

    protected String getImageRegistry(Karavan karavan) {
        String defaultValue = "${IMAGE_REGISTRY}";
        String key = "image-registry";
        try {
            KubernetesClient kubernetesClient = new DefaultKubernetesClient();
            boolean isOpenshift = kubernetesClient.isAdaptable(OpenShiftClient.class);
            Secret secret = kubernetesClient.secrets().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.NAME).get();
            if (secret != null && secret.getData().containsKey(key)) {
                return defaultValue;
            } else if (isOpenshift) {
                return "image-registry.openshift-image-registry.svc:5000";
            } else {
                return defaultValue;
            }
        } catch (Exception e) {
            return defaultValue;
        }
    }

    @Override
    public boolean isMet(Karavan karavan, Task task, Context<Karavan> context) {
        return false;
    }
}
