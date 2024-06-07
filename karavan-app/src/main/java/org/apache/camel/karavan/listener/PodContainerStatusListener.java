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

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.model.PodContainerStatus;

import java.time.Instant;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_DELETED;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_UPDATED;

@ApplicationScoped
public class PodContainerStatusListener {

    @Inject
    KaravanCache karavanCache;

    @ConsumeEvent(value = POD_CONTAINER_DELETED, blocking = true, ordered = true)
    public void cleanContainersStatus(JsonObject data) {
        PodContainerStatus containerStatus = data.mapTo(PodContainerStatus.class);
        karavanCache.deletePodContainerStatus(containerStatus);
        karavanCache.deleteCamelStatuses(containerStatus.getProjectId(), containerStatus.getEnv());
    }

    @ConsumeEvent(value = POD_CONTAINER_UPDATED, blocking = true, ordered = true)
    public void savePodContainerStatus(JsonObject data) {
        PodContainerStatus newStatus = data.mapTo(PodContainerStatus.class);
        PodContainerStatus oldStatus = karavanCache.getPodContainerStatus(newStatus.getProjectId(), newStatus.getEnv(), newStatus.getContainerName());

        if (oldStatus == null) {
            karavanCache.savePodContainerStatus(newStatus);
        } else if (Objects.equals(oldStatus.getInTransit(), Boolean.FALSE)) {
            savePodContainerStatus(newStatus, oldStatus);
        } else if (Objects.equals(oldStatus.getInTransit(), Boolean.TRUE)) {
            if (!Objects.equals(oldStatus.getState(), newStatus.getState()) || newStatus.getCpuInfo() == null || newStatus.getCpuInfo().isEmpty()) {
                savePodContainerStatus(newStatus, oldStatus);
            }
        }
    }

    private void savePodContainerStatus(PodContainerStatus newStatus, PodContainerStatus oldStatus) {
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
        karavanCache.savePodContainerStatus(newStatus);
    }
}