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

import io.quarkus.runtime.StartupEvent;
import io.smallrye.mutiny.Multi;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestStreamElementType;

import java.util.Date;

@Path("/api/notification")
public class NotificationResource {

    private static final Logger LOGGER = Logger.getLogger(NotificationResource.class.getName());

    void onStart(@Observes StartupEvent ev) throws Exception {
        System.out.println("STARTING!!!!!");
        vertx.setPeriodic(1000,
                aLong -> {
                    vertx.eventBus().publish("test0", new JsonObject().put("user", "test0").put("date", new Date().toString()));
                    vertx.eventBus().publish("test1", new JsonObject().put("user", "test1").put("date", new Date().toString()));
                });
    }

    @Inject
    Vertx vertx;
    @Inject
    EventBus bus;


    @GET
    @Path("{name}")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RestStreamElementType(MediaType.TEXT_PLAIN)
    public Multi<String> greetingStream(@PathParam("name") String name) {
        return bus.<String>consumer(name).bodyStream().toMulti();
    }
}