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
package org.apache.camel.karavan.headless;

import io.quarkus.runtime.StartupEvent;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.jboss.logging.Logger;

@ApplicationScoped
public class HeadlessService {

    private static final Logger LOGGER = Logger.getLogger(HeadlessService.class.getName());

    @Inject
    InfinispanService infinispanService;

    @Inject
    CamelService camelService;

    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("Starting Headless Karavan");
        infinispanService.start(true);
    }

    @Scheduled(every = "{karavan.camel.status.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectCamelStatuses() {
        LOGGER.info("Collect Camel statuses");
        // collect Camel statuses
        camelService.collectCamelStatuses();
    }

}
