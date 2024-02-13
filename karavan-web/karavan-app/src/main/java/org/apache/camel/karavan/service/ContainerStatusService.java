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
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.ContainerStatus;
import org.apache.camel.karavan.docker.DockerService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@ApplicationScoped
public class ContainerStatusService {

    public static final String CONTAINER_STATUS = "CONTAINER_STATUS";
    public static final String CONTAINER_DELETED = "CONTAINER_DELETED";
    private static final Logger LOGGER = Logger.getLogger(ContainerStatusService.class.getName());
    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    KaravanCacheService karavanCacheService;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container.statistics.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatistics() {
        if (karavanCacheService.isReady() && !ConfigService.inKubernetes()) {
            List<ContainerStatus> statusesInDocker = dockerService.collectContainersStatistics();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.publish(ContainerStatusService.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
            });
        }
    }

    @Scheduled(every = "{karavan.container.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatuses() {
        if (karavanCacheService.isReady() && !ConfigService.inKubernetes()) {
            if (!ConfigService.inKubernetes()) {
                List<ContainerStatus> statusesInDocker = dockerService.collectContainersStatuses();
                statusesInDocker.forEach(containerStatus -> {
                    eventBus.publish(ContainerStatusService.CONTAINER_STATUS, JsonObject.mapFrom(containerStatus));
                });
                cleanContainersStatuses(statusesInDocker);
            }
        }
    }

    void cleanContainersStatuses(List<ContainerStatus> statusesInDocker) {
        if (karavanCacheService.isReady() && !ConfigService.inKubernetes()) {
            List<String> namesInDocker = statusesInDocker.stream().map(ContainerStatus::getContainerName).toList();
            List<ContainerStatus> statusesInCache = karavanCacheService.getContainerStatuses(environment);
            // clean deleted
            statusesInCache.stream()
                    .filter(cs -> !checkTransit(cs))
                    .filter(cs -> !namesInDocker.contains(cs.getContainerName()))
                    .forEach(containerStatus -> {
                        eventBus.publish(ContainerStatusService.CONTAINER_DELETED, JsonObject.mapFrom(containerStatus));
                        karavanCacheService.deleteContainerStatus(containerStatus);
                        karavanCacheService.deleteCamelStatuses(containerStatus.getProjectId(), containerStatus.getEnv());
                    });
        }
    }

    private boolean checkTransit(ContainerStatus cs) {
        if (cs.getContainerId() == null && cs.getInTransit()) {
            return Instant.parse(cs.getInitDate()).until(Instant.now(), ChronoUnit.SECONDS) < 10;
        }
        return false;
    }

    @ConsumeEvent(value = CONTAINER_STATUS, blocking = true, ordered = true)
    public void saveContainerStatus(JsonObject data) {
        if (karavanCacheService.isReady()) {
            ContainerStatus newStatus = data.mapTo(ContainerStatus.class);
            ContainerStatus oldStatus = karavanCacheService.getContainerStatus(newStatus.getProjectId(), newStatus.getEnv(), newStatus.getContainerName());

            if (oldStatus == null) {
                karavanCacheService.saveContainerStatus(newStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
                saveContainerStatus(newStatus, oldStatus);
            } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)) {
                if (!Objects.equals(oldStatus.getState(), newStatus.getState()) || newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isEmpty()) {
                    saveContainerStatus(newStatus, oldStatus);
                }
            }
        }
    }

    private void saveContainerStatus(ContainerStatus newStatus, ContainerStatus oldStatus) {
        if (Objects.equals("exited", newStatus.getState()) || Objects.equals("dead", newStatus.getState())) {
            if (Objects.isNull(oldStatus.getFinished())) {
                newStatus.setFinished(Instant.now().toString());
                newStatus.setMemoryInfo("0MiB/0MiB");
                newStatus.setCpuInfo("0%");
            } else if (Objects.nonNull(oldStatus.getFinished())) {
                return;
            }
        }
        if (newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isEmpty()) {
            newStatus.setCpuInfo(oldStatus.getCpuInfo());
            newStatus.setMemoryInfo(oldStatus.getMemoryInfo());
        }
        karavanCacheService.saveContainerStatus(newStatus);
    }
}