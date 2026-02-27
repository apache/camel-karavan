/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import io.smallrye.context.api.ManagedExecutorConfig;
import io.smallrye.context.api.NamedInstance;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import org.apache.camel.karavan.service.LogStreamingService;
import org.apache.camel.karavan.service.NotificationService;
import org.eclipse.microprofile.context.ManagedExecutor;

@Path("/ui/logwatch")
public class LogWatchResource extends AbstractApiResource {

    @Inject
    LogStreamingService logStreamingService;

    @Inject
    NotificationService notificationService;

    @Inject
    @ManagedExecutorConfig()
    @NamedInstance("logExecutor")
    ManagedExecutor managedExecutor;

    @GET
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Authenticated
    @Path("/{type}/{name}/{username}")
    public void eventSourcing(@PathParam("type") String type,
                              @PathParam("name") String name,
                              @PathParam("username") String username,
                              @Context SseEventSink eventSink,
                              @Context Sse sse) {

        // 1. Handle Notifications cleanup (API concern)
        notificationService.sinkCleanup(LogStreamingService.SERVICE_NAME + ":" + type + ":" + name, username, eventSink);

        // 2. Hand off the heavy lifting to the thread pool
        managedExecutor.execute(() -> {
            logStreamingService.streamLog(type, name, username, eventSink, sse);
        });
    }
}