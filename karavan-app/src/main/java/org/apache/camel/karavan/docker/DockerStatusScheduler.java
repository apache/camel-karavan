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

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Statistics;
import com.github.dockerjava.core.InvocationBuilder;
import io.quarkus.scheduler.Scheduled;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.ConfigService;
import org.apache.camel.karavan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class DockerStatusScheduler {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container.statistics.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatistics() {
        List<ContainerStatus> statusesInDocker = getContainersStatuses();
        statusesInDocker.forEach(containerStatus -> {
            eventBus.publish(CMD_COLLECT_CONTAINER_STATISTIC, JsonObject.mapFrom(containerStatus));
        });
    }

    @Scheduled(every = "{karavan.container.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatuses() {
        if (!ConfigService.inKubernetes()) {
            List<ContainerStatus> statusesInDocker = getContainersStatuses();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.publish(CONTAINER_UPDATED, JsonObject.mapFrom(containerStatus));
            });
            eventBus.publish(CMD_CLEAN_STATUSES, "");
        }
    }

    public List<ContainerStatus> getContainersStatuses() {
        List<ContainerStatus> result = new ArrayList<>();
        dockerService.getAllContainers().forEach(container -> {
            ContainerStatus containerStatus = DockerUtils.getContainerStatus(container, environment);
            result.add(containerStatus);
        });
        return result;
    }

    public ContainerStatus getContainerStatistics(ContainerStatus containerStatus) {
        Container container = dockerService.getContainerByName(containerStatus.getContainerName());
        Statistics stats = getContainerStats(container.getId());
        DockerUtils.updateStatistics(containerStatus, stats);
        return containerStatus;
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