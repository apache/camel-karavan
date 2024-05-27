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
package org.apache.camel.karavan.status;

import io.quarkus.scheduler.Scheduled;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.status.model.CamelStatusRequest;
import org.apache.camel.karavan.status.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.*;

import static org.apache.camel.karavan.status.KaravanStatusEvents.CMD_COLLECT_CAMEL_STATUS;

@ApplicationScoped
public class CamelStatusService {

    private static final Logger LOGGER = Logger.getLogger(CamelStatusService.class.getName());

    @Inject
    KaravanStatusCache karavanStatusCache;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.camel.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void collectCamelStatuses() {
        LOGGER.debug("Collect Camel Statuses");
        karavanStatusCache.getContainerStatuses(environment).stream()
                .filter(cs ->
                        cs.getType() == ContainerStatus.ContainerType.project
                                || cs.getType() == ContainerStatus.ContainerType.devmode
                ).filter(cs -> Objects.equals(cs.getCamelRuntime(), StatusConstants.CamelRuntime.CAMEL_MAIN.getValue()))
                .forEach(cs -> {
                    CamelStatusRequest csr = new CamelStatusRequest(cs.getProjectId(), cs.getContainerName());
                    eventBus.publish(CMD_COLLECT_CAMEL_STATUS,
                            JsonObject.mapFrom(Map.of("containerStatus", cs, "camelStatusRequest", csr))
                    );
                });
    }
}