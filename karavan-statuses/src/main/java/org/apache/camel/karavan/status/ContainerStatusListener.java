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

package org.apache.camel.karavan.status;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.status.docker.DockerAPI;
import org.apache.camel.karavan.status.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import static org.apache.camel.karavan.status.StatusEvents.*;

@ApplicationScoped
public class ContainerStatusListener {

    private static final Logger LOGGER = Logger.getLogger(ContainerStatusListener.class.getName());
    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    StatusCache statusCache;

    @Inject
    DockerAPI dockerAPI;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = CMD_COLLECT_CONTAINER_STATISTIC, blocking = true)
    void collectContainersStatistics(JsonObject data) {
        ContainerStatus status = data.mapTo(ContainerStatus.class);
        ContainerStatus newStatus = dockerAPI.collectContainerStatistics(status);
        eventBus.publish(CONTAINER_UPDATED, JsonObject.mapFrom(newStatus));
    }

    @ConsumeEvent(value = CMD_CLEAN_STATUSES, blocking = true)
    void cleanContainersStatuses(JsonArray list) {
        List<ContainerStatus> statusesInDocker = list.stream().map(o -> ((JsonObject)o).mapTo(ContainerStatus.class)).toList();
        List<String> namesInDocker = statusesInDocker.stream().map(ContainerStatus::getContainerName).toList();
        List<ContainerStatus> statusesInCache = statusCache.getContainerStatuses(environment);
        // clean deleted
        statusesInCache.stream()
                .filter(cs -> !checkTransit(cs))
                .filter(cs -> !namesInDocker.contains(cs.getContainerName()))
                .forEach(containerStatus -> {
                    eventBus.publish(CONTAINER_DELETED, JsonObject.mapFrom(containerStatus));
                });
    }

    @ConsumeEvent(value = CONTAINER_DELETED, blocking = true, ordered = true)
    public void cleanContainersStatus(JsonObject data) {
        ContainerStatus containerStatus = data.mapTo(ContainerStatus.class);
        statusCache.deleteContainerStatus(containerStatus);
        statusCache.deleteCamelStatuses(containerStatus.getProjectId(), containerStatus.getEnv());
    }

    private boolean checkTransit(ContainerStatus cs) {
        if (cs.getContainerId() == null && cs.getInTransit()) {
            return Instant.parse(cs.getInitDate()).until(Instant.now(), ChronoUnit.SECONDS) < 10;
        }
        return false;
    }

    @ConsumeEvent(value = CONTAINER_UPDATED, blocking = true, ordered = true)
    public void saveContainerStatus(JsonObject data) {
        ContainerStatus newStatus = data.mapTo(ContainerStatus.class);
        ContainerStatus oldStatus = statusCache.getContainerStatus(newStatus.getProjectId(), newStatus.getEnv(), newStatus.getContainerName());

        if (oldStatus == null) {
            statusCache.saveContainerStatus(newStatus);
        } else if (Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
            saveContainerStatus(newStatus, oldStatus);
        } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)) {
            if (!Objects.equals(oldStatus.getState(), newStatus.getState()) || newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isEmpty()) {
                saveContainerStatus(newStatus, oldStatus);
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
        if (newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isBlank()) {
            newStatus.setCpuInfo(oldStatus.getCpuInfo());
            newStatus.setMemoryInfo(oldStatus.getMemoryInfo());
        }
        statusCache.saveContainerStatus(newStatus);
    }
}