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

import io.quarkus.scheduler.Scheduled;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.docker.DockerForInfinispan;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.shared.ConfigService;
import org.apache.camel.karavan.shared.EventType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ScheduledService {

    private static final Logger LOGGER = Logger.getLogger(ScheduledService.class.getName());

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    DockerForInfinispan dockerForInfinispan;

    @Inject
    ProjectService projectService;

    @Inject
    CamelService camelService;

    @Inject
    InfinispanService infinispanService;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container.statistics.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatistics() {
        if (infinispanService.isReady()) {
            List<ContainerStatus> statusesInDocker = dockerService.collectContainersStatistics();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.send(EventType.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
            });
        }
    }

    @Scheduled(every = "{karavan.container.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatuses() {
        if (infinispanService.isReady()) {
            List<ContainerStatus> statusesInDocker = dockerService.collectContainersStatuses();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.send(EventType.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
            });
            cleanContainersStatuses(statusesInDocker);
        }
    }

    void cleanContainersStatuses(List<ContainerStatus> statusesInDocker) {
        if (infinispanService.isReady()) {
            List<String> namesInDocker = statusesInDocker.stream().map(ContainerStatus::getContainerName).toList();
            List<ContainerStatus> statusesInInfinispan = infinispanService.getContainerStatuses(environment);
            // clean deleted
            statusesInInfinispan.stream()
                    .filter(cs -> !(cs.getContainerId() == null && cs.getInTransit()))
                    .filter(cs -> !namesInDocker.contains(cs.getContainerName()))
                    .forEach(containerStatus -> {
                        infinispanService.deleteContainerStatus(containerStatus);
                        infinispanService.deleteCamelStatuses(containerStatus.getProjectId(), containerStatus.getEnv());
                    });
        }
    }


    @Scheduled(every = "{karavan.camel.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectCamelStatuses() {
        camelService.collectCamelStatuses();
    }
}
