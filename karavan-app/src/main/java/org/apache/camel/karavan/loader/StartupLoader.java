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
package org.apache.camel.karavan.loader;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.StartupEvent;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.service.AuthService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.jboss.logging.Logger;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.apache.camel.karavan.KaravanEvents.NOTIFICATION_PROJECTS_STARTED;

@Default
@Readiness
@ApplicationScoped
public class StartupLoader implements HealthCheck {

    private static final Logger LOGGER = Logger.getLogger(StartupLoader.class.getName());

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Inject
    AuthService authService;

    @Inject
    CacheLoader cacheLoader;

    @Inject
    GitLoader  gitLoader;

    private final AtomicBoolean ready = new AtomicBoolean(false);

    @Override
    public HealthCheckResponse call() {
        if (ready.get()) {
            return HealthCheckResponse.named("Projects").up().build();
        } else {
            return HealthCheckResponse.named("Projects").down().build();
        }
    }

    void onStart(@Observes StartupEvent ev) throws Exception {
        LOGGER.info("Starting " + ConfigService.getAppName() + " in " + environment + " env in " + (ConfigService.inKubernetes() ? "Kubernetes" : "Docker"));
        if (!ConfigService.inKubernetes() && !dockerService.checkDocker()){
            Quarkus.asyncExit();
        } else {
            createCaches();
        }
    }

    void createCaches() {
        try {
            LOGGER.info("Loading projects ...");
            cacheLoader.load();
            gitLoader.load();
            LOGGER.info("Projects loaded");
            eventBus.publish(NOTIFICATION_PROJECTS_STARTED, null);
            LOGGER.info("Creating defaults...");
            authService.loadDefaults();
            ready.set(true);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }
}
