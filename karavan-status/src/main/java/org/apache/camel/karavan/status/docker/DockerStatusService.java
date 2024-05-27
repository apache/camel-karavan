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

package org.apache.camel.karavan.status.docker;

import io.quarkus.scheduler.Scheduled;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.status.ConfigService;
import org.apache.camel.karavan.status.model.ContainerStatus;

import java.util.List;

import static org.apache.camel.karavan.status.KaravanStatusEvents.*;

@ApplicationScoped
public class DockerStatusService {

    @Inject
    DockerAPI dockerAPI;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.container.statistics.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatistics() {
        List<ContainerStatus> statusesInDocker = dockerAPI.collectContainersStatuses();
        statusesInDocker.forEach(containerStatus -> {
            eventBus.publish(CMD_COLLECT_CONTAINER_STATISTIC, JsonObject.mapFrom(containerStatus));
        });
    }

    @Scheduled(every = "{karavan.container.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectContainersStatuses() {
        if (!ConfigService.inKubernetes()) {
            List<ContainerStatus> statusesInDocker = dockerAPI.collectContainersStatuses();
            statusesInDocker.forEach(containerStatus -> {
                eventBus.publish(CONTAINER_UPDATED, JsonObject.mapFrom(containerStatus));
            });
            eventBus.publish(CMD_CLEAN_STATUSES, new JsonArray(statusesInDocker));
        }
    }
}