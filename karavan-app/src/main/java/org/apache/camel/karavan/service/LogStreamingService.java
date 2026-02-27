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
package org.apache.camel.karavan.service;

import com.github.dockerjava.api.DockerClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import io.smallrye.mutiny.tuples.Tuple2;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import org.apache.camel.karavan.docker.DockerLogCallback;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.jboss.logging.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class LogStreamingService {

    private static final Logger LOGGER = Logger.getLogger(LogStreamingService.class.getName());
    public static final String SERVICE_NAME = "LOG_WATCH";

    private final ConcurrentHashMap<String, Tuple2<LogWatch, KubernetesClient>> logWatches = new ConcurrentHashMap<>();

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    public void streamLog(String type, String name, String username, SseEventSink eventSink, Sse sse) {
        String oldName = Thread.currentThread().getName();
        Thread.currentThread().setName("log-watcher-" + name + "-" + username);
        try {
            if (ConfigService.inKubernetes()) {
                streamKubernetesLogs(name, username, eventSink, sse);
            } else {
                streamDockerLogs(name, eventSink, sse);
            }
        } finally {
            Thread.currentThread().setName(oldName);
        }
    }

    private void streamDockerLogs(String name, SseEventSink eventSink, Sse sse) {
        LOGGER.info("LogWatch for " + name + " starting (Docker)");
        final DockerLogCallback[] callbackHolder = new DockerLogCallback[1];

        callbackHolder[0] = new DockerLogCallback(line -> {
            try {
                if (eventSink.isClosed()) throw new IOException("Sink closed");
                // FIX: Strip trailing newline to match Kubernetes behavior
                String cleanLine = line.endsWith("\n")
                        ? line.substring(0, line.length() - 1)
                        : line;

                eventSink.send(sse.newEvent(cleanLine))
                        .toCompletableFuture()
                        .join();
            } catch (CompletionException | IOException e) {
                LOGGER.info("Browser disconnected from " + name + ". Stopping Docker stream.");
                try {
                    if (callbackHolder[0] != null) callbackHolder[0].close();
                } catch (IOException ex) { /* ignore */ }
            } catch (Exception e) {
                LOGGER.error("Error sending log event: " + e.getMessage());
            }
        });

        try {
            DockerClient client = dockerService.getDockerClient();
            client.logContainerCmd(name)
                    .withStdOut(true).withStdErr(true).withTimestamps(false)
                    .withFollowStream(true).withTail(100)
                    .exec(callbackHolder[0]);

            callbackHolder[0].awaitCompletion();
        } catch (InterruptedException e) {
            LOGGER.info("LogWatch interrupted for " + name);
        } catch (Exception e) {
            LOGGER.error("Docker Log Error for " + name + ": " + e.getMessage());
        } finally {
            cleanupDockerResources(callbackHolder[0], eventSink, name);
        }
    }

    private void streamKubernetesLogs(String name, String username, SseEventSink eventSink, Sse sse) {
        Tuple2<LogWatch, KubernetesClient> request = null;
        try {
            request = kubernetesService.getContainerLogWatch(name);
            manageK8sSession(username, name, request); // Renamed for clarity

            LogWatch logWatch = request.getItem1();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(logWatch.getOutput()))) {
                String line;
                while (!eventSink.isClosed() && (line = reader.readLine()) != null) {
                    try {
                        eventSink.send(sse.newEvent(line))
                                .toCompletableFuture()
                                .join();
                    } catch (Exception e) {
                        LOGGER.debug("Client disconnected during K8s log stream");
                        break; // Stop reading immediately
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error("Kubernetes Log Error for " + name + ": " + e.getMessage());
        } finally {
            cleanupK8sResources(request, eventSink, name);
        }
    }

    private void cleanupDockerResources(DockerLogCallback callback, SseEventSink sink, String name) {
        try {
            if (callback != null) callback.close();
        } catch (Exception e) { LOGGER.warn("Error closing callback", e); }
        if (!sink.isClosed()) sink.close();
        LOGGER.info("LogWatch for " + name + " ended");
    }

    private void cleanupK8sResources(Tuple2<LogWatch, KubernetesClient> request, SseEventSink sink, String name) {
        if (request != null) {
            try {
                if (request.getItem1() != null) request.getItem1().close();
                if (request.getItem2() != null) request.getItem2().close();
            } catch (Exception e) { LOGGER.warn("Error closing K8s resources", e); }
        }
        if (!sink.isClosed()) sink.close();
        LOGGER.info("LogWatch for " + name + " ended");
    }

    private void manageK8sSession(String username, String containerName, Tuple2<LogWatch, KubernetesClient> logWatch) {
        String key = SERVICE_NAME + ":" + username + ":" + containerName;
        if (logWatches.containsKey(key)) {
            var old = logWatches.remove(key);
            try {
                if (old.getItem1() != null) old.getItem1().close();
                if (old.getItem2() != null) old.getItem2().close();
            } catch (Exception e) { /* ignore */ }
        }
        logWatches.put(key, logWatch);
    }
}