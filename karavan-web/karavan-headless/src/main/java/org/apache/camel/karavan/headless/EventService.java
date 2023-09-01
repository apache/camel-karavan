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

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.InfinispanService;

@ApplicationScoped
public class EventService {

    public static final String CMD_COLLECT_CAMEL_STATUS = "collect-camel-status";

    @Inject
    CamelService camelService;

    @ConsumeEvent(value = CMD_COLLECT_CAMEL_STATUS, blocking = true)
    public void collectCamelStatus(JsonObject data) {
        camelService.collectCamelStatus(data);
    }

    @ConsumeEvent(value = InfinispanService.CODE_RELOAD_COMMAND, blocking = true)
    public void reloadProjectCode(String projectId) {
        camelService.reloadProjectCode(projectId);
    }

}