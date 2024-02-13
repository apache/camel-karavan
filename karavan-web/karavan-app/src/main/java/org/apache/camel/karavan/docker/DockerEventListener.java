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
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.model.ContainerStatus;
import org.apache.camel.karavan.registry.RegistryService;
import org.jboss.logging.Logger;

import java.io.Closeable;
import java.io.IOException;
import java.util.Objects;

import static org.apache.camel.karavan.shared.Constants.*;

@ApplicationScoped
public class DockerEventListener implements ResultCallback<Event> {

    @Inject
    DockerService dockerService;

    @Inject
    RegistryService registryService;

    private static final Logger LOGGER = Logger.getLogger(DockerEventListener.class.getName());

    @Override
    public void onStart(Closeable closeable) {
        LOGGER.info("DockerEventListener started");
    }

    @Override
    public void onNext(Event event) {
        try {
            if (Objects.equals(event.getType(), EventType.CONTAINER)) {
                Container container = dockerService.getContainer(event.getId());
                if (container != null) {
                    onContainerEvent(event, container);
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    public void onContainerEvent(Event event, Container container) throws InterruptedException {
        if ("exited".equalsIgnoreCase(container.getState())
                && Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerStatus.ContainerType.build.name())) {
            String tag = container.getLabels().get(LABEL_TAG);
            String projectId = container.getLabels().get(LABEL_PROJECT_ID);
            syncImage(projectId, tag);
        }
    }

    private void syncImage(String projectId, String tag) throws InterruptedException {
        String image = registryService.getRegistryWithGroupForSync() + "/" + projectId + ":" + tag;
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