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

import com.github.dockerjava.api.command.HealthState;
import com.github.dockerjava.api.model.HealthCheck;
import io.vertx.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

import static org.apache.camel.karavan.shared.Constants.LABEL_TYPE;
import static org.apache.camel.karavan.shared.EventType.INFINISPAN_STARTED;

@ApplicationScoped
public class DockerForInfinispan {

    private static final Logger LOGGER = Logger.getLogger(DockerForInfinispan.class.getName());

    protected static final String INFINISPAN_CONTAINER_NAME = "infinispan";

    private static final List<String> infinispanHealthCheckCMD = List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status");

    @ConfigProperty(name = "karavan.infinispan.image")
    String infinispanImage;
    @ConfigProperty(name = "karavan.infinispan.port")
    String infinispanPort;
    @ConfigProperty(name = "karavan.infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name = "karavan.infinispan.password")
    String infinispanPassword;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    public void startInfinispan() {
        try {
            LOGGER.info("Infinispan is starting...");

            HealthCheck healthCheck = new HealthCheck().withTest(infinispanHealthCheckCMD)
                    .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

            List<String> exposedPorts = List.of(infinispanPort.split(":")[0]);

            dockerService.createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                    List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                    infinispanPort, false, exposedPorts, healthCheck,
                    Map.of(LABEL_TYPE, ContainerStatus.ContainerType.internal.name()));

            dockerService.runContainer(INFINISPAN_CONTAINER_NAME);
            LOGGER.info("Infinispan is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void checkInfinispanHealth() {
        dockerService.listContainers(false).stream()
                .filter(c -> c.getState().equals("running"))
                .forEach(c -> {
                    HealthState hs = dockerService.inspectContainer(c.getId()).getState().getHealth();
                    if (c.getNames()[0].equals("/" + INFINISPAN_CONTAINER_NAME)) {
                        eventBus.publish(INFINISPAN_STARTED, hs.getStatus());
                    }
                });
    }
}
