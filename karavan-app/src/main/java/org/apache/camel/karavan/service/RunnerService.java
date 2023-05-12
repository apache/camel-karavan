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

import io.quarkus.scheduler.Scheduled;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.core.eventbus.EventBus;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.RunnerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class RunnerService {

    private static final Logger LOGGER = Logger.getLogger(RunnerService.class.getName());
    public static final String CMD_COLLECT_RUNNER_STATUS = "collect-runner-status";
    public static final String RUNNER_SUFFIX = "runner";

    @Inject
    InfinispanService infinispanService;

    @Inject
    KubernetesService kubernetesService;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    Vertx vertx;

    @Inject
    EventBus eventBus;

    WebClient webClient;

    public WebClient getWebClient() {
        if (webClient == null) {
            webClient = WebClient.create(vertx);
        }
        return webClient;
    }

    @Scheduled(every = "{karavan.runner-status-interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectRunnerStatus() {
        if (infinispanService.call().getStatus().name().equals("UP")) {
            infinispanService.getPodStatuses(environment).stream().filter(PodStatus::getRunner).forEach(podStatus -> {
                eventBus.publish(CMD_COLLECT_RUNNER_STATUS, podStatus.getName());
            });
        }
    }

    @ConsumeEvent(value = CMD_COLLECT_RUNNER_STATUS, blocking = true, ordered = false)
    public void collectRunnerStatuses(String podName) {
        String oldContext = infinispanService.getRunnerStatus(podName, RunnerStatus.NAME.context);
        String newContext = getRunnerStatus(podName, RunnerStatus.NAME.context);
        if (newContext != null) {
            infinispanService.saveRunnerStatus(podName, RunnerStatus.NAME.context, newContext);
            Arrays.stream(RunnerStatus.NAME.values())
                    .filter(name -> !name.equals(RunnerStatus.NAME.context))
                    .forEach(statusName -> {
                        String status = getRunnerStatus(podName, statusName);
                        infinispanService.saveRunnerStatus(podName, statusName, status);
                    });
            reloadCode(podName, oldContext, newContext);
        }
    }

    private void reloadCode(String podName, String oldContext, String newContext) {
        String projectName = podName.replace("-" + RUNNER_SUFFIX, "");
        String newState = getContextState(newContext);
        String oldState = getContextState(oldContext);
        if (newContext != null && !Objects.equals(newState, oldState) && "Running".equals(newState)) {
            sendCodeToRunner(projectName);
        }
    }

    private void sendCodeToRunner(String projectName) {
        infinispanService.getProjectFiles(projectName).forEach(projectFile -> {

        });
    }

    private String getContextState(String context) {
        if (context != null) {
            JsonObject obj = new JsonObject(context);
            return obj.getJsonObject("context").getString("state");
        } else {
            return null;
        }
    }

    public String getRunnerStatus(String podName, RunnerStatus.NAME statusName) {
        String url = "http://" + podName + "." + kubernetesService.getNamespace() + ".svc.cluster.local/q/dev/" + statusName.name();
//        String url = "http://0.0.0.0:8888/q/dev/" + statusName.name();
        try {
            return result(url, 1000);
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 1000)
    public String result(String url, int timeout) throws InterruptedException, ExecutionException {
        try {
            HttpResponse<Buffer> result = getWebClient().getAbs(url).putHeader("Accept", "application/json")
                    .timeout(timeout).send().subscribeAsCompletionStage().toCompletableFuture().get();
            if (result.statusCode() == 200) {
                JsonObject res = result.bodyAsJsonObject();
                return res.encodePrettily();
            }
        } catch (Exception e) {
            LOGGER.info(e.getMessage());
        }
        return null;
    }
}