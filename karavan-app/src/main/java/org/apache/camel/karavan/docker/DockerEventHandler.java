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

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.ContainerType;
import org.apache.camel.karavan.service.RegistryService;
import org.jboss.logging.Logger;

import java.io.Closeable;
import java.io.IOException;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.KaravanEvents.CMD_COPY_CODE_TO_CONTAINER_IN_SWARM;
import static org.apache.camel.karavan.KaravanEvents.CMD_PULL_IMAGES;

@ApplicationScoped
public class DockerEventHandler implements ResultCallback<Event> {

    @Inject
    DockerService dockerService;

    @Inject
    RegistryService registryService;

    private static final Logger LOGGER = Logger.getLogger(DockerEventHandler.class.getName());

    @Override
    public void onStart(Closeable closeable) {
        LOGGER.info("DockerEventListener started");
    }

    @Inject
    EventBus eventBus;

    @Override
    public void onNext(Event event) {
        LOGGER.debug("DockerEventListener onNext " + event.getAction());
        try {
            var actorId = event.getActor().getId();
            if (Objects.equals(event.getType(), EventType.CONTAINER)) {
                Container container = dockerService.getContainer(actorId);
                if (container != null) {
                    onContainerEvent(event, container);
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    public void onContainerEvent(Event event, Container container) throws InterruptedException {
        String projectId = container.getLabels().get(LABEL_PROJECT_ID);
        if ("exited".equalsIgnoreCase(container.getState())
                && Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerType.build.name())) {
            String tag = container.getLabels().get(LABEL_TAG);
            syncImage(projectId, tag);
        } else if ("running".equalsIgnoreCase(container.getState())
                && (
                Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerType.devmode.name())
                || Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerType.build.name())
                )
                && event.getStatus() != null
                && !event.getStatus().startsWith("exec_")
                && !event.getStatus().startsWith("stop")
                && !event.getStatus().startsWith("kill")
                && !event.getStatus().startsWith("extract")
                && event.getActor() != null
                && event.getActor().getAttributes() != null
        ) {
            eventBus.publish(CMD_COPY_CODE_TO_CONTAINER_IN_SWARM, JsonObject.of(
                    "projectId", projectId,
                    "containerId", container.getId(),
                    "type", container.getLabels().get(LABEL_TYPE)
            ));
        }
    }

    private void syncImage(String projectId, String tag) throws InterruptedException {
        String image = registryService.getRegistryWithGroupForSync() + "/" + projectId + ":" + tag;
        eventBus.publish(CMD_PULL_IMAGES, JsonObject.of("projectId", projectId));
        dockerService.pullImage(image, true);
    }

    @Override
    public void onError(Throwable throwable) {
        LOGGER.error(throwable.getMessage());
    }

    @Override
    public void onComplete() {
        LOGGER.error("DockerEventListener complete");
    }

    @Override
    public void close() throws IOException {
        LOGGER.info("DockerEventListener close");
    }
}