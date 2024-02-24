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
package org.apache.camel.karavan.service;

import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.UUID;

import static org.apache.camel.karavan.shared.Constants.*;

@ApplicationScoped
public class NotificationService {

    @Inject
    EventBus eventBus;

    public void send(String userId, String eventId, String evenName, String className, JsonObject data) {
        eventBus.publish(userId, data, new DeliveryOptions()
                        .addHeader(NOTIFICATION_HEADER_EVENT_ID, eventId != null ? eventId : UUID.randomUUID().toString())
                        .addHeader(NOTIFICATION_HEADER_EVENT_NAME, evenName)
                        .addHeader(NOTIFICATION_HEADER_CLASS_NAME, className)
        );
    }

    public void sendSystem(String eventId, String evenName, String className, JsonObject data) {
        eventBus.publish(NOTIFICATION_ADDRESS_SYSTEM, data, new DeliveryOptions()
                        .addHeader(NOTIFICATION_HEADER_EVENT_ID, eventId != null ? eventId : UUID.randomUUID().toString())
                        .addHeader(NOTIFICATION_HEADER_EVENT_NAME, evenName)
                        .addHeader(NOTIFICATION_HEADER_CLASS_NAME, className)
        );
    }
}