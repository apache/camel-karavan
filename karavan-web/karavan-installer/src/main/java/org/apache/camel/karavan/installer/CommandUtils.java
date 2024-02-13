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
package org.apache.camel.karavan.installer;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentCondition;
import io.fabric8.kubernetes.api.model.apps.StatefulSet;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.openshift.api.model.operatorhub.v1.Operator;
import io.fabric8.openshift.client.OpenShiftClient;
import org.apache.camel.karavan.installer.resources.*;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

public class CommandUtils {

    public static void installKaravan(KaravanCommand config) {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            OpenShiftClient oClient = client.adapt(OpenShiftClient.class);
            if (oClient.isSupported()) {
                System.out.println("⭕ Installing Karavan to OpenShift");
                config.setOpenShift(true);
            } else {
                System.out.println("⭕ Installing Karavan to Kubernetes");
                config.setOpenShift(false);
            }
            install(config, client);
        }
    }

    private static void install(KaravanCommand config, KubernetesClient client) {
        // Create namespace
        if (client.namespaces().withName(config.getNamespace()).get() == null) {
            Namespace ns = new NamespaceBuilder().withNewMetadata().withName(config.getNamespace()).endMetadata().build();
            ns = client.namespaces().resource(ns).create();
            log("Namespace " + ns.getMetadata().getName() + " created");
        } else {
            log("Namespace " + config.getNamespace() + " already exists");
        }

        // Check and install Gitea
        if (config.isInstallGitea()) {
            installGitea(config, client);
        }

        // Check secrets
        if (!checkKaravanSecrets(config, client)) {
            logError("Karavan secrets not found");

            // try to create secrets
            if (!tryToCreateKaravanSecrets(config, client)) {
                logPoint("Apply secrets before installation");
                logPoint("Or provide Git, Auth and Image Registry options");
                System.exit(0);
            }

        } else {
            log("Karavan secrets found");
        }

        // Create Nexus Proxy
        if (config.isNexusProxy()) {
            createOrReplace(Nexus.getDeployment(config), client);
            createOrReplace(Nexus.getService(config), client);
        }
        // Create ConfigMap
        createOrReplace(KaravanConfigMap.getConfigMap(config), client);
        // Create Service Accounts
        createOrReplace(KaravanServiceAccount.getServiceAccount(config), client);
        // Create Roles and role bindings
        createOrReplace(KaravanRole.getRole(config), client);
        createOrReplace(KaravanRole.getRoleBinding(config), client);
        createOrReplace(KaravanRole.getRoleBindingView(config), client);
        // Create deployment
        createOrReplace(KaravanDeployment.getDeployment(config), client);
        // Create service
        createOrReplace(KaravanService.getService(config), client);
        if (config.isOpenShift()) {
            createOrReplace(KaravanService.getRoute(config), client);
        }
        log("Karavan is installed");
        System.out.print("\uD83D\uDC2B Karavan is starting ");
        while (!checkKaravanReady(config, client)) {
            try {
                Thread.sleep(2000);
            } catch (Exception e) {

            }
            System.out.print("\uD83D\uDC2B ");

        }
        System.out.println();
        log("Karavan is started");
    }

    public static boolean checkKaravanSecrets(KaravanCommand config, KubernetesClient client) {
        Secret secret = client.secrets().inNamespace(config.getNamespace()).withName(Constants.NAME).get();
        return secret != null;
    }

    public static boolean tryToCreateKaravanSecrets(KaravanCommand config, KubernetesClient client) {
        if (config.gitConfigured()) {
            if (config.getImageRegistry() == null) {
                if (config.isOpenShift()) {
                    config.setImageRegistry(Constants.DEFAULT_IMAGE_REGISTRY_OPENSHIFT);
                } else {
                    Service registryService = client.services().inNamespace("kube-system").withName("registry").get();
                    if (registryService != null) {
                        config.setImageRegistry(registryService.getSpec().getClusterIP());
                    } else {
                        logError("Set Image Registry parameters");
                        System.exit(0);
                    }
                }
            }
            if ((config.isAuthOidc() && config.oidcConfigured())
                    || (config.getAuth().equals("public"))) {
                Secret secret = KaravanSecret.getSecret(config);
                client.resource(secret).createOrReplace();
                log("\uD83D\uDD11", "Karavan secret created");
                return true;
            }
        }
        return false;
    }

    public static boolean checkKaravanReady(KaravanCommand config, KubernetesClient client) {
        Deployment deployment = client.apps().deployments().inNamespace(config.getNamespace()).withName(Constants.NAME).get();
        Integer replicas = deployment.getStatus().getReplicas();
        Integer ready = deployment.getStatus().getReadyReplicas();
        Integer available = deployment.getStatus().getAvailableReplicas();
        Optional<DeploymentCondition> condition = deployment.getStatus().getConditions().stream()
                .filter(c -> c.getType().equals("Available") && c.getStatus().equals("True")).findFirst();
        return deployment.getStatus() != null
                && Objects.equals(replicas, ready)
                && Objects.equals(replicas, available)
                && condition.isPresent();
    }

    private static <T extends HasMetadata> void createOrReplace(T is, KubernetesClient client) {
        try {
            T result = client.resource(is).createOrReplace();
            log(result.getKind() + " " + result.getMetadata().getName() + " created");
        } catch (Exception e) {
            logError(e.getLocalizedMessage());
        }
    }

    private static void installGitea(KaravanCommand config, KubernetesClient client) {
        System.out.print("⏳ Installing Gitea ");
        Arrays.stream(new String[] { "init.yaml", "config.yaml", "deployment.yaml", "service.yaml" }).forEach(s -> {
            String yaml = getResourceFile("/gitea/" + s);
            client.load(new ByteArrayInputStream(yaml.getBytes())).inNamespace(config.getNamespace())
                    .create().forEach(hasMetadata -> System.out.print("\uD83D\uDC2B "));
        });
        System.out.println();
        log("Gitea is installed");
    }

    public static void log(String emoji, String message) {
        System.out.println(emoji + " " + message);
    }

    public static void log(String message) {
        System.out.println(getOkMessage(message));
    }

    public static void logPoint(String message) {
        System.out.println(getPointMessage(message));
    }

    public static void logError(String message) {
        System.out.println(getErrorMessage(message));
    }

    private static String getOkMessage(String message) {
        return "\uD83D\uDC4D " + message;
    }

    private static String getPointMessage(String message) {
        return "\uD83D\uDC49 " + message;
    }

    private static String getErrorMessage(String message) {
        return "‼\uFE0F " + message;
    }

    private static boolean isOpenShift(KubernetesClient client) {
        return client.adapt(OpenShiftClient.class).isSupported();
    }

    private static String getResourceFile(String path) {
        try {
            InputStream inputStream = CommandUtils.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }
}
