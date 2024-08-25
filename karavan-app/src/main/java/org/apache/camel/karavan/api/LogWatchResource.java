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

import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import io.smallrye.context.api.ManagedExecutorConfig;
import io.smallrye.context.api.NamedInstance;
import io.smallrye.mutiny.tuples.Tuple2;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import org.apache.camel.karavan.docker.DockerLogCallback;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.apache.camel.karavan.service.NotificationService;
import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.ConcurrentHashMap;

@Path("/ui/logwatch")
public class LogWatchResource {

    private static final Logger LOGGER = Logger.getLogger(LogWatchResource.class.getName());
    private static final String SERVICE_NAME = "LOGWATCH";
    private static final ConcurrentHashMap<String, Tuple2<LogWatch, KubernetesClient>> logWatches = new ConcurrentHashMap<>();

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    NotificationService notificationService;

    @Inject
    @ManagedExecutorConfig()
    @NamedInstance("logExecutor")
    ManagedExecutor managedExecutor;

    @GET
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Path("/{type}/{name}/{username}")
    public void eventSourcing(@PathParam("type") String type,
                              @PathParam("name") String name,
                              @PathParam("username") String username,
                              @Context SseEventSink eventSink,
                              @Context Sse sse) {
        notificationService.sinkCleanup(SERVICE_NAME + ":" + type + ":" + name, username, eventSink);
        managedExecutor.execute(() -> {
            LOGGER.info("LogWatch for " + name + " starting... ");
            if (ConfigService.inKubernetes()) {
                getKubernetesLogs(name, username, eventSink, sse);
            } else {
                getDockerLogs(type, name, eventSink, sse);
            }
        });
    }

    private void getDockerLogs(String type, String name, SseEventSink eventSink, Sse sse) {
        LOGGER.info("LogCallback for " + name + " starting");
        try (SseEventSink sink = eventSink) {
            DockerLogCallback dockerLogCallback = new DockerLogCallback(line -> {
                if (!sink.isClosed()) {
                    sink.send(sse.newEvent(line));
                }
            });
            dockerService.logContainer(name, dockerLogCallback);
            dockerLogCallback.close();
            sink.close();
            LOGGER.info("LogCallback for " + name + " closed");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    private void getKubernetesLogs(String name, String username, SseEventSink eventSink, Sse sse) {
        try (SseEventSink sink = eventSink) {
            Tuple2<LogWatch, KubernetesClient> request = kubernetesService.getContainerLogWatch(name);
            logWatchCleanup(SERVICE_NAME, username, request);
            LogWatch logWatch = request.getItem1();
            BufferedReader reader = new BufferedReader(new InputStreamReader(logWatch.getOutput()));
            try {
                for (String line; (line = reader.readLine()) != null && !sink.isClosed(); ) {
                    sink.send(sse.newEvent(line));
                }
            } catch (IOException e) {
                LOGGER.error(e.getMessage());
            }
            logWatch.close();
            request.getItem2().close();
            sink.close();
            LOGGER.info("LogWatch for " + name + " closed");
        }
    }

    protected void logWatchCleanup(String service, String username, Tuple2<LogWatch, KubernetesClient> logWatch) {
        String key = service + ":" + username;
        if (logWatches.containsKey(key)) {
            var lw = logWatches.get(key);
            try {
                lw.getItem1().close();
                lw.getItem2().close();
            } catch (Exception e) {
                LOGGER.error(e.getMessage());
            }
        }
        logWatches.put(key, logWatch);
    }
}