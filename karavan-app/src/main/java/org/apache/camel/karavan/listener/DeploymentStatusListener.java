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

package org.apache.camel.karavan.listener;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.model.DeploymentStatus;

import static org.apache.camel.karavan.KaravanEvents.DEPLOYMENT_DELETED;
import static org.apache.camel.karavan.KaravanEvents.DEPLOYMENT_UPDATED;

@ApplicationScoped
public class DeploymentStatusListener {

    @Inject
    KaravanCache karavanCache;

    @ConsumeEvent(value = DEPLOYMENT_DELETED, blocking = true, ordered = true)
    public void cleanDeploymentStatus(JsonObject data) {
        DeploymentStatus ds = data.mapTo(DeploymentStatus.class);
        karavanCache.deleteDeploymentStatus(ds);
        karavanCache.deleteCamelStatuses(ds.getProjectId(), ds.getEnv());
    }

    @ConsumeEvent(value = DEPLOYMENT_UPDATED, blocking = true, ordered = true)
    public void saveDeploymentStatus(JsonObject data) {
        DeploymentStatus ds = data.mapTo(DeploymentStatus.class);
        karavanCache.saveDeploymentStatus(ds);
    }
}