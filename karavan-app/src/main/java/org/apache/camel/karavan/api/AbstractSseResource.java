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
package org.apache.camel.karavan.api;

import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.inject.Inject;
import jakarta.ws.rs.sse.SseEventSink;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

abstract public class AbstractSseResource {

    @Inject
    EventBus bus;

    protected final Map<String, SseEventSink> sinkMap = new ConcurrentHashMap<>();

    protected void sinkCleanup(String service, String username, SseEventSink eventSink) {
        String key = service + ":" + username;
        if (sinkMap.containsKey(key)) {
            var sink = sinkMap.get(key);
            if (!sink.isClosed()) {
                sink.close();
            }
        }
        sinkMap.put(key, eventSink);
    }
}