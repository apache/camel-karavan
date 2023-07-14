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

import io.fabric8.kubernetes.client.dsl.LogWatch;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.DevModeCommand;
import org.apache.camel.karavan.datagrid.model.DevModeCommandName;
import org.apache.camel.karavan.service.KubernetesService;
import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.sse.Sse;
import javax.ws.rs.sse.SseEventSink;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.ConcurrentHashMap;

@Path("/api/logwatch")
public class LogWatchResource {

    private static final Logger LOGGER = Logger.getLogger(LogWatchResource.class.getName());
    private static final ConcurrentHashMap<String, LogWatch> logWatches = new ConcurrentHashMap<>();

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DatagridService datagridService;

    @Inject
    ManagedExecutor managedExecutor;

    @GET
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Path("/{type}/{name}")
    public void eventSourcing(@PathParam("type") String type,
                              @PathParam("name") String name,
                              @Context SseEventSink eventSink,
                              @Context Sse sse
    ) {
        managedExecutor.execute(() -> {
            LOGGER.info("LogWatch for " + name + " starting...");
            if (kubernetesService.inKubernetes()) {
                getKubernetesLogs(type, name, eventSink, sse);
            } else {
                datagridService.sendDevModeCommand(DevModeCommand.createDevModeCommand(DevModeCommandName.LOG, name));
            }
        });
    }

    private void getKubernetesLogs(String type, String name, SseEventSink eventSink, Sse sse) {
        try (SseEventSink sink = eventSink) {
            LogWatch logWatch = type.equals("container")
                    ? kubernetesService.getContainerLogWatch(name)
                    : kubernetesService.getPipelineRunLogWatch(name);
            BufferedReader reader = new BufferedReader(new InputStreamReader(logWatch.getOutput()));
            try {
                for (String line; (line = reader.readLine()) != null && !sink.isClosed(); ) {
                    sink.send(sse.newEvent(line));
                }
            } catch (IOException e) {
                LOGGER.error(e.getMessage());
            }
            logWatch.close();
            sink.close();
            LOGGER.info("LogWatch for " + name + " closed");
        }
    }
}