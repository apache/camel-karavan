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
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.service.ProjectService;
import org.jboss.logging.Logger;

import java.util.List;

import static org.apache.camel.karavan.KaravanEvents.*;

@Default
@ApplicationScoped
public class CommitListener {

    private static final Logger LOGGER = Logger.getLogger(CommitListener.class.getName());

    @Inject
    ProjectService projectService;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = CMD_PUSH_PROJECT, blocking = true, ordered = true)
    public void onCommitAndPush(JsonObject event) throws Exception {
        LOGGER.info("Commit event: " + event.encodePrettily());
        String projectId = event.getString("projectId");
        String message = event.getString("message");
        String userId = event.getString("userId");
        String eventId = event.getString("eventId");
        String authorName = event.getString("authorName");
        String authorEmail = event.getString("authorEmail");
        List<String> fileNames = event.containsKey("fileNames") ? List.of(event.getString("fileNames").split(",")) : List.of();
        try {
            Project p = projectService.commitAndPushProject(projectId, message, authorName, authorEmail, fileNames);
            if (userId != null) {
                eventBus.publish(COMMIT_HAPPENED, JsonObject.of("userId", userId, "eventId", eventId, "project", JsonObject.mapFrom(p)));
            }
        } catch (Exception e) {
            var error = e.getCause() != null ? e.getCause() : e;
            LOGGER.error("Failed to commit event", error);
            if (userId != null) {
                eventBus.publish(NOTIFICATION_ERROR, JsonObject.of(
                        "userId", userId,
                        "eventId", eventId,
                        "className", Project.class.getSimpleName(),
                        "error", "Failed to commit event: " + e.getMessage())
                );
            }
        }
    }
}
