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
package org.apache.camel.karavan.cli;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.pipeline.v1beta1.Pipeline;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import org.apache.camel.karavan.cli.resources.*;

import java.util.Arrays;
import java.util.Objects;

public class CommandUtils {
    private static final Pipeline pipeline = new Pipeline();
    private static final Task task = new Task();

    public static void installKaravan(KaravanConfig config) {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            OpenShiftClient oClient = client.adapt(OpenShiftClient.class);
            if (oClient.isSupported()) {
                System.out.println("⭕ Installing Karavan to OpenShift");
                config.setOpenShift(true);
            } else {
                System.out.println("\u2388 Installing Karavan to Kubernetes");
                config.setOpenShift(false);
            }
            install(config, client);
        }
    }

    private static void install(KaravanConfig config, KubernetesClient client) {
        // Check and install Tekton
        if (!isTektonInstalled(client)) {
            log("Tekton is not installed");
            installTekton(config, client);
        }
        log("Tekton is installed");

        // Create namespace
        if (client.namespaces().withName(config.getNamespace()).get() == null) {
            Namespace ns = new NamespaceBuilder().withNewMetadata().withName(config.getNamespace()).endMetadata().build();
            ns = client.namespaces().resource(ns).create();
            log("Namespace " + ns.getMetadata().getName() + " created");
        } else {
            log("Namespace " + config.getNamespace() + " already exists");
        }

        // Check secrets
        if (!checkKaravanSecrets(config, client)) {
            logError("Karavan secrets  not found. Apply secrets before installation");
            System.exit(0);
        }
        log("Karavan secrets found");

        // Create service accounts
        createOrReplace(KaravanServiceAccount.getServiceAccount(config), client);
        createOrReplace(KaravanServiceAccount.getServiceAccountPipeline(config), client);
        // Create Roles and role bindings
        createOrReplace(KaravanRole.getRole(config), client);
        createOrReplace(KaravanRole.getRoleBinding(config), client);
        createOrReplace(KaravanRole.getRoleBindingView(config), client);
        createOrReplace(KaravanRole.getRoleDeployer(config), client);
        createOrReplace(KaravanRole.getRoleBindingPipeline(config), client);
        // Create PVC
        createOrReplace(KaravanPvc.getPvcData(config), client);
        createOrReplace(KaravanPvc.getPvcM2Cache(config), client);
        createOrReplace(KaravanPvc.getPvcJbangCache(config), client);
        // Create Tasks and Pipelines
        Arrays.stream(config.getRuntimes().split(",")).forEach(runtime -> {
            createOrReplace(KaravanTekton.getTask(config, runtime), client);
            createOrReplace(KaravanTekton.getPipeline(config, runtime), client);
        });
        // Create deployment
        createOrReplace(KaravanDeployment.getDeployment(config), client);
        // Create service
        createOrReplace(KaravanService.getService(config), client);
        if (config.isOpenShift()) {
            createOrReplace(KaravanService.getRoute(config), client);
        }
        log("Karavan is installed");

        while (!checkReady(config, client)) {
            try {
                Thread.sleep(1000);
            } catch (Exception e) {

            }
            System.out.print(".");
        }
        System.out.println();
        log("Karavan is ready");
    }

    public static boolean checkKaravanSecrets(KaravanConfig config, KubernetesClient client) {
        Secret secret = client.secrets().inNamespace(config.getNamespace()).withName(Constants.NAME).get();
        return secret != null;
    }

    public static boolean checkReady(KaravanConfig config, KubernetesClient client) {
        Deployment deployment = client.apps().deployments().inNamespace(config.getNamespace()).withName(Constants.NAME).get();
        return deployment.getStatus() != null
                && Objects.equals(deployment.getStatus().getReadyReplicas(), deployment.getStatus().getReplicas());
    }

    private static <T extends HasMetadata> void createOrReplace(T is, KubernetesClient client) {
        try {
            T result = client.resource(is).createOrReplace();
            log(result.getKind() + " " + result.getMetadata().getName() + " created");
        } catch (Exception e) {
            logError(e.getLocalizedMessage());
        }
    }

    private static void installTekton(KaravanConfig config, KubernetesClient client) {
        System.out.println("⏳ Installing Tekton");
        client.load(CommandUtils.class.getResourceAsStream("/tekton.yaml")).create().forEach(hasMetadata -> {
            System.out.println(" - " + hasMetadata.getKind() + " " + hasMetadata.getMetadata().getName());
        });
    }

    private static boolean isTektonInstalled(KubernetesClient client) {
        APIResourceList kinds = client.getApiResources(pipeline.getApiVersion());
        if (kinds != null && kinds.getResources().stream().anyMatch(res -> res.getKind().equalsIgnoreCase(pipeline.getKind())) &&
                kinds.getResources().stream().anyMatch(res -> res.getKind().equalsIgnoreCase(task.getKind()))) {
            if (isOpenShift(client)) {
                long oper = client.adapt(OpenShiftClient.class).operatorHub().subscriptions().list().getItems().stream()
                        .filter(sub -> sub.getMetadata().getName().contains("openshift-pipelines-operator")).count();
                return oper > 0;
            } else {
                return true;
            }
        }
        return false;
    }

    public static void log(String message) {
        System.out.println(getOkMessage(message));
    }

    public static void logError(String message) {
        System.out.println(getErrorMessage(message));
    }

    private static String getOkMessage(String message) {
        return "\uD83D\uDC4D " + message;
    }

    private static String getErrorMessage(String message) {
        return "‼\uFE0F" + message;
    }

    private static boolean isOpenShift(KubernetesClient client) {
        return client.adapt(OpenShiftClient.class).isSupported();
    }
}
