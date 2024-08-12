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

package org.apache.camel.karavan.listener;

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Statistics;
import com.github.dockerjava.core.InvocationBuilder;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.docker.DockerUtils;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class DockerStatusListener {

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    KaravanCache karavanCache;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = CMD_COLLECT_CONTAINER_STATISTIC, blocking = true)
    void collectContainersStatistics(JsonObject data) {
        PodContainerStatus status = data.mapTo(PodContainerStatus.class);
        PodContainerStatus newStatus = getContainerStatistics(status);
        eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(newStatus));
    }

    @ConsumeEvent(value = CMD_CLEAN_STATUSES, blocking = true)
    void cleanContainersStatuses(String data) {
        List<PodContainerStatus> statusesInDocker = getContainersStatuses();
        List<String> namesInDocker = statusesInDocker.stream().map(PodContainerStatus::getContainerName).toList();
        List<PodContainerStatus> statusesInCache = karavanCache.getPodContainerStatuses(environment);
        // clean deleted
        statusesInCache.stream()
                .filter(cs -> !checkTransit(cs))
                .filter(cs -> !namesInDocker.contains(cs.getContainerName()))
                .forEach(containerStatus -> {
                    eventBus.publish(POD_CONTAINER_DELETED, JsonObject.mapFrom(containerStatus));
                });
    }

    private boolean checkTransit(PodContainerStatus cs) {
        if (cs.getContainerId() == null && cs.getInTransit()) {
            return Instant.parse(cs.getInitDate()).until(Instant.now(), ChronoUnit.SECONDS) < 10;
        }
        return false;
    }

    public List<PodContainerStatus> getContainersStatuses() {
        List<PodContainerStatus> result = new ArrayList<>();
        dockerService.getAllContainers().forEach(container -> {
            PodContainerStatus podContainerStatus = DockerUtils.getContainerStatus(container, environment);
            result.add(podContainerStatus);
        });
        return result;
    }

    public PodContainerStatus getContainerStatistics(PodContainerStatus podContainerStatus) {
        Container container = dockerService.getContainerByName(podContainerStatus.getContainerName());
        Statistics stats = getContainerStats(container.getId());
        DockerUtils.updateStatistics(podContainerStatus, stats);
        return podContainerStatus;
    }

    public Statistics getContainerStats(String containerId) {
        InvocationBuilder.AsyncResultCallback<Statistics> callback = new InvocationBuilder.AsyncResultCallback<>();
        dockerService.getDockerClient().statsCmd(containerId).withContainerId(containerId).withNoStream(true).exec(callback);
        Statistics stats = null;
        try {
            stats = callback.awaitResult();
            callback.close();
        } catch (RuntimeException | IOException e) {
            // you may want to throw an exception here
        }
        return stats;
    }
}