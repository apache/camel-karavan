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
package org.apache.camel.karavan.service;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.Startup;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.docker.DockerForGitea;
import org.apache.camel.karavan.docker.DockerForRegistry;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.git.GiteaService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Liveness;
import org.jboss.logging.Logger;

import java.io.IOException;

@Startup
@Liveness
@Singleton
public class KaravanService implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(KaravanService.class.getName());

    @ConfigProperty(name = "karavan.git-install-gitea")
    boolean giteaInstall;

    @ConfigProperty(name = "karavan.image-registry-install")
    boolean registryInstall;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    DockerForGitea dockerForGitea;

    @Inject
    DockerForRegistry dockerForRegistry;

    @Inject
    EventBus eventBus;

    @Inject
    GiteaService giteaService;

    @Inject
    ProjectService projectService;

    public static final String START_KUBERNETES_SERVICES = "START_KUBERNETES_LISTENERS";
    public static final String START_INTERNAL_DOCKER_SERVICES = "START_INTERNAL_DOCKER_SERVICES";
    public static final String START_SERVICES = "START_SERVICES";

    @Override
    public HealthCheckResponse call() {
        return HealthCheckResponse.up("Karavan");
    }

    void onStart(@Observes StartupEvent ev) throws Exception {
        if (!ConfigService.inKubernetes()) {
            eventBus.publish(START_INTERNAL_DOCKER_SERVICES, null);
        } else {
            eventBus.publish(START_KUBERNETES_SERVICES, null);
        }
        eventBus.publish(START_SERVICES, null);
    }

    @ConsumeEvent(value = START_INTERNAL_DOCKER_SERVICES, blocking = true)
    void startInternalDockerServices(String data) throws Exception {
        LOGGER.info("Starting Karavan in Docker");
        if (!dockerService.checkDocker()){
            Quarkus.asyncExit();
        } else {
            dockerService.createNetwork();
            dockerService.startListeners();

            if (giteaInstall) {
                dockerForGitea.startGitea();
                giteaService.install();
                dockerForGitea.createGiteaUser();
                giteaService.createRepository();
            }
            if (registryInstall) {
                dockerForRegistry.startRegistry();
            }
        }
    }

    @ConsumeEvent(value = START_KUBERNETES_SERVICES, blocking = true)
    void startKubernetesServices(String data) throws Exception {
        LOGGER.info("Starting Karavan in Kubernetes");
        if (giteaInstall) {
            giteaService.createRepository();
        }
        kubernetesService.startInformers(null);
    }

    @ConsumeEvent(value = START_SERVICES, blocking = true)
    void startServices(String data) throws Exception {
        projectService.tryStart();
    }

    void onStop(@Observes ShutdownEvent ev) throws IOException  {
        LOGGER.info("Stop Listeners");
        if (ConfigService.inKubernetes()) {
            kubernetesService.stopInformers();
        } else {
            dockerService.stopListeners();
        }
        LOGGER.info("Stop Karavan");
    }

}
