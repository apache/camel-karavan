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
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.ProjectFolder;

import java.util.UUID;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class NotificationListener {

    public static final String NOTIFICATION_ADDRESS_SYSTEM = "karavanSystem";
    public static final String NOTIFICATION_HEADER_EVENT_ID = "id";
    public static final String NOTIFICATION_HEADER_EVENT_NAME = "eventName";
    public static final String NOTIFICATION_HEADER_CLASS_NAME = "className";

    public static final String EVENT_ERROR = "error";
    public static final String EVENT_COMMIT = "commit";
    public static final String EVENT_CONFIG_SHARED = "configShared";
    public static final String EVENT_IMAGES_LOADED = "imagesLoaded";

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = NOTIFICATION_ERROR, blocking = true, ordered = true)
    public void onErrorHappened(JsonObject event) throws Exception {
        String eventId = event.getString("eventId");
        String userId = event.getString("userId");
        String className = event.getString("className");
        if (userId != null) {
            send(userId, eventId, EVENT_ERROR, className, event);
        } else {
            sendSystem(eventId, EVENT_ERROR, className, event);
        }
    }

    @ConsumeEvent(value = NOTIFICATION_CONFIG_SHARED, blocking = true, ordered = true)
    public void onShareHappened(JsonObject event) throws Exception {
        String userId = event.getString("userId");
        String className = event.getString("className");
        if (userId != null) {
            send(userId, null, EVENT_CONFIG_SHARED, className, event);
        } else {
            sendSystem(null, EVENT_CONFIG_SHARED, className, event);
        }
    }

    @ConsumeEvent(value = NOTIFICATION_IMAGES_LOADED, blocking = true, ordered = true)
    public void onImageLoaded(JsonObject event) throws Exception {
        String userId = event.getString("userId");
        if (userId != null) {
            send(userId, null, EVENT_IMAGES_LOADED, "image", event);
        } else {
            sendSystem(null, EVENT_IMAGES_LOADED, "image", event);
        }
    }

    @ConsumeEvent(value = COMMIT_HAPPENED, blocking = true, ordered = true)
    public void onCommitHappened(JsonObject event) throws Exception {
        JsonObject project = event.getJsonObject("project");
        JsonArray messages = event.getJsonArray("messages");
        JsonArray statuses = event.getJsonArray("statuses");
        project.put("messages", messages);
        project.put("statuses", statuses);
        String eventId = event.getString("eventId");
        String userId = event.getString("userId");
        if (userId != null) {
            send(userId, eventId, EVENT_COMMIT, ProjectFolder.class.getSimpleName(), project);
        } else {
            sendSystem(eventId, EVENT_COMMIT, ProjectFolder.class.getSimpleName(), project);
        }
    }

    void send(String userId, String eventId, String evenName, String className, JsonObject data) {
        eventBus.publish(userId, data, new DeliveryOptions()
                .addHeader(NOTIFICATION_HEADER_EVENT_ID, eventId != null ? eventId : UUID.randomUUID().toString())
                .addHeader(NOTIFICATION_HEADER_EVENT_NAME, evenName)
                .addHeader(NOTIFICATION_HEADER_CLASS_NAME, className)
        );
    }

    void sendSystem(String eventId, String evenName, String className, JsonObject data) {
        eventBus.publish(NOTIFICATION_ADDRESS_SYSTEM, data, new DeliveryOptions()
                .addHeader(NOTIFICATION_HEADER_EVENT_ID, eventId != null ? eventId : UUID.randomUUID().toString())
                .addHeader(NOTIFICATION_HEADER_EVENT_NAME, evenName)
                .addHeader(NOTIFICATION_HEADER_CLASS_NAME, className)
        );
    }
}