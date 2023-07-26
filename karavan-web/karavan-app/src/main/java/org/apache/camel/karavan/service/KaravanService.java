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

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.eventbus.EventBus;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.shared.ConfigService;
import org.apache.camel.karavan.shared.EventType;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.io.IOException;

@ApplicationScoped
public class KaravanService {

    private static final Logger LOGGER = Logger.getLogger(KaravanService.class.getName());

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus bus;

    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("Starting Karavan");
        if (!ConfigService.inKubernetes()) {
            if (ConfigService.isHeadless()) {
                LOGGER.info("Starting Karavan Headless in Docker");
            } else {
                LOGGER.info("Starting Karavan with Docker");
                if (!dockerService.checkDocker()){
                    Quarkus.asyncExit();
                } else {
                    dockerService.createNetwork();
                    dockerService.startListeners();
                    dockerService.startInfinispan();
                    dockerService.checkInfinispanHealth();
                }
            }
        } else {
            LOGGER.info("Starting Karavan in " + (kubernetesService.isOpenshift() ? "OpenShift" : "Kubernetes"));
            bus.publish(EventType.INFINISPAN_STARTED, InfinispanService.HEALTHY_STATUS);
        }
    }

    void onStop(@Observes ShutdownEvent ev) throws IOException  {
        LOGGER.info("Stop Listeners");
        if (ConfigService.inKubernetes()) {
            kubernetesService.stopInformers();
        } else {
            dockerService.stopListeners();
        }
        LOGGER.info("Stop Karavan");
    }

}
