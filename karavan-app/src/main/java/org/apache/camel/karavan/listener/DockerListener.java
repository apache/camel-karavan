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
import org.apache.camel.karavan.docker.DockerService;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class DockerListener {

    private static final Logger LOGGER = Logger.getLogger(DockerListener.class.getName());

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = CMD_PULL_IMAGES, blocking = true)
    void loadImagesForProject(JsonObject event) {
        LOGGER.info("Pull image event: " + event.encodePrettily());
        String projectId = event.getString("projectId");
        String userId = event.getString("userId");
        try {
            dockerService.pullImagesForProject(projectId);
            eventBus.publish(NOTIFICATION_IMAGES_LOADED, event);
        } catch (Exception e) {
            var error = "Failed to load images " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
            LOGGER.error(error);
            eventBus.publish(NOTIFICATION_ERROR, JsonObject.of("userId", userId, "className", "image", "error", error)
            );
        }
    }
}