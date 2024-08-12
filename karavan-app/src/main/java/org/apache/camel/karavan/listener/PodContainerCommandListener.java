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
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import static org.apache.camel.karavan.KaravanEvents.CMD_DELETE_CONTAINER;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_UPDATED;

@ApplicationScoped
public class PodContainerCommandListener {

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    KaravanCache karavanCache;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = CMD_DELETE_CONTAINER, blocking = true)
    public void deletePodContainer(String projectId) {
        setContainerStatusTransit(projectId, PodContainerStatus.ContainerType.devmode.name());
        if (ConfigService.inKubernetes()) {
            kubernetesService.deletePodAndService(projectId, false);
        } else {
            dockerService.deleteContainer(projectId);
        }
    }

    private void setContainerStatusTransit(String name, String type) {
        PodContainerStatus status = karavanCache.getPodContainerStatus(name, environment, name);
        if (status == null) {
            status = PodContainerStatus.createByType(name, environment, PodContainerStatus.ContainerType.valueOf(type));
        }
        status.setInTransit(true);
        eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(status));
    }
}