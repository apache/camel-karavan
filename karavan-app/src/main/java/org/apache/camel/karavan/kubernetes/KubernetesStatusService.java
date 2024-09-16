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
package org.apache.camel.karavan.kubernetes;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.kubernetes.client.informers.SharedIndexInformer;
import io.quarkus.runtime.LaunchMode;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.*;

import static org.apache.camel.karavan.KaravanConstants.CAMEL_PREFIX;

@Default
@Readiness
@ApplicationScoped
public class KubernetesStatusService implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(KubernetesStatusService.class.getName());
    protected static final int INFORMERS = 3;

    @Inject
    EventBus eventBus;

    private String namespace;

    @Produces
    public KubernetesClient kubernetesClient() {
        return new KubernetesClientBuilder().build();
    }

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    public String environment;

    @ConfigProperty(name = "karavan.openshift")
    Optional<Boolean> isOpenShift;

    List<SharedIndexInformer> informers = new ArrayList<>(INFORMERS);


    void onStart(@Observes StartupEvent ev) throws Exception {
        if (ConfigService.inKubernetes()) {
            LOGGER.info("Status Listeners: starting...");
            startInformers();
            LOGGER.info("Status Listeners: started");
        }
    }

    void onStop(@Observes ShutdownEvent ev) throws IOException {
        if (ConfigService.inKubernetes()) {
            LOGGER.info("Status Listeners: stopping...");
            stopInformers();
            LOGGER.info("Status Listeners: stopped");
        }
    }

    public void startInformers() {
        try {
            stopInformers();
            LOGGER.info("Starting Kubernetes Informers");

            Map<String, String> labels = getRuntimeLabels();
            KubernetesClient client = kubernetesClient();

            SharedIndexInformer<Deployment> deploymentInformer = client.apps().deployments().inNamespace(getNamespace())
                    .withLabels(labels).inform();
            deploymentInformer.addEventHandlerWithResyncPeriod(new DeploymentEventHandler(this, eventBus), 30 * 1000L);
            informers.add(deploymentInformer);

            SharedIndexInformer<Service> serviceInformer = client.services().inNamespace(getNamespace())
                    .withLabels(labels).inform();
            serviceInformer.addEventHandlerWithResyncPeriod(new ServiceEventHandler(this, eventBus), 30 * 1000L);
            informers.add(serviceInformer);

            SharedIndexInformer<Pod> podRunInformer = client.pods().inNamespace(getNamespace())
                    .withLabels(labels).inform();
            podRunInformer.addEventHandlerWithResyncPeriod(new PodEventHandler( this, eventBus), 30 * 1000L);
            informers.add(podRunInformer);

            LOGGER.info("Started Kubernetes Informers");
        } catch (Exception e) {
            LOGGER.error("Error starting informers: " + e.getMessage());
        }
    }


    @Override
    public HealthCheckResponse call() {
        if (ConfigService.inKubernetes()) {
            if (informers.size() == INFORMERS) {
                return HealthCheckResponse.named("Kubernetes").up().build();
            } else {
                return HealthCheckResponse.named("Kubernetes").down().build();
            }
        } else {
            return HealthCheckResponse.named("Kubernetesless").up().build();
        }
    }

    public void stopInformers() {
        LOGGER.info("Stop Kubernetes Informers");
        informers.forEach(SharedIndexInformer::close);
        informers.clear();
    }


    public String getNamespace() {
        if (namespace == null) {
            try (KubernetesClient client = kubernetesClient()) {
                namespace = LaunchMode.current().getProfileKey().equalsIgnoreCase("dev") ? "karavan" : client.getNamespace();
            }
        }
        return namespace;
    }

    private Map<String, String> getRuntimeLabels() {
        Map<String, String> labels = new HashMap<>();
        labels.put(isOpenshift() ? "app.openshift.io/runtime" : "app.kubernetes.io/runtime", CAMEL_PREFIX);
        return labels;
    }

    public boolean isOpenshift() {
        return isOpenShift.isPresent() && isOpenShift.get();
    }

    public String getCluster() {
        try (KubernetesClient client = kubernetesClient()) {
            return client.getMasterUrl().getHost();
        }
    }

    public ResourceRequirements getResourceRequirements(Map<String, String> containerResources) {
        return new ResourceRequirementsBuilder()
                .addToRequests("cpu", new Quantity(containerResources.get("requests.cpu")))
                .addToRequests("memory", new Quantity(containerResources.get("requests.memory")))
                .addToLimits("cpu", new Quantity(containerResources.get("limits.cpu")))
                .addToLimits("memory", new Quantity(containerResources.get("limits.memory")))
                .build();
    }
}
