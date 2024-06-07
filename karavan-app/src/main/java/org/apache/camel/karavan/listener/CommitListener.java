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
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.service.ProjectService;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.KaravanEvents.CMD_PUSH_PROJECT;

@Default
@ApplicationScoped
public class CommitListener {

    private static final Logger LOGGER = Logger.getLogger(CommitListener.class.getName());

    @Inject
    ProjectService projectService;

    @ConsumeEvent(value = CMD_PUSH_PROJECT, blocking = true, ordered = true)
    public void onCommitAndPush(JsonObject event) throws Exception {
        LOGGER.info("Commit event: " + event.encodePrettily());
        String projectId = event.getString("projectId");
        String message = event.getString("message");
        String userId = event.getString("userId");
        String eventId = event.getString("eventId");
        projectService.commitAndPushProject(projectId, message, userId, eventId);
    }
}
