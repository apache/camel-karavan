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

package org.apache.camel.karavan.scheduler;

import io.quarkus.scheduler.Scheduled;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.docker.DockerUtils;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.ArrayList;
import java.util.List;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class DockerStatusScheduler {

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container.statistics.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatistics() {
        if (!ConfigService.inKubernetes()) {
            List<PodContainerStatus> statusesInDocker = getContainersStatuses();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.publish(CMD_COLLECT_CONTAINER_STATISTIC, JsonObject.mapFrom(containerStatus));
            });
        }
    }

    @Scheduled(every = "{karavan.container.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatuses() {
        if (!ConfigService.inKubernetes()) {
            List<PodContainerStatus> statusesInDocker = getContainersStatuses();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(containerStatus));
            });
            eventBus.publish(CMD_CLEAN_STATUSES, "");
        }
    }

    public List<PodContainerStatus> getContainersStatuses() {
        List<PodContainerStatus> result = new ArrayList<>();
        dockerService.getAllContainers().forEach(container -> {
            PodContainerStatus podContainerStatus = DockerUtils.getContainerStatus(container, environment);
            result.add(podContainerStatus);
        });
        return result;
    }
}