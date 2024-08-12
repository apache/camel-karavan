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
package org.apache.camel.karavan.scheduler;

import io.quarkus.scheduler.Scheduled;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.model.CamelStatusRequest;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanEvents.CMD_COLLECT_CAMEL_STATUS;

@ApplicationScoped
public class CamelStatusScheduler {

    private static final Logger LOGGER = Logger.getLogger(CamelStatusScheduler.class.getName());

    @Inject
    KaravanCache karavanCache;

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    EventBus eventBus;

    @Scheduled(every = "{karavan.camel.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void collectCamelStatuses() {
        LOGGER.debug("Collect Camel Statuses");
        karavanCache.getPodContainerStatuses(environment).stream()
                .filter(cs ->
                        cs.getType() == PodContainerStatus.ContainerType.project
                                || cs.getType() == PodContainerStatus.ContainerType.devmode
                ).filter(cs -> Objects.equals(cs.getCamelRuntime(), KaravanConstants.CamelRuntime.CAMEL_MAIN.getValue()))
                .forEach(cs -> {
                    CamelStatusRequest csr = new CamelStatusRequest(cs.getProjectId(), cs.getContainerName());
                    eventBus.publish(CMD_COLLECT_CAMEL_STATUS,
                            JsonObject.mapFrom(Map.of("containerStatus", cs, "camelStatusRequest", csr))
                    );
                });
    }
}