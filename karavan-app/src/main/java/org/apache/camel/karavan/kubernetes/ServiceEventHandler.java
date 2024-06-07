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

package org.apache.camel.karavan.kubernetes;

import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import org.apache.camel.karavan.model.ServiceStatus;
import org.jboss.logging.Logger;

import static org.apache.camel.karavan.KaravanEvents.SERVICE_DELETED;
import static org.apache.camel.karavan.KaravanEvents.SERVICE_UPDATED;

public class ServiceEventHandler implements ResourceEventHandler<Service> {

    private static final Logger LOGGER = Logger.getLogger(ServiceEventHandler.class.getName());
    private KubernetesStatusService kubernetesStatusService;
    private final EventBus eventBus;

    public ServiceEventHandler(KubernetesStatusService kubernetesStatusService, EventBus eventBus) {
        this.kubernetesStatusService = kubernetesStatusService;
        this.eventBus = eventBus;
    }

    @Override
    public void onAdd(Service service) {
        try {
            LOGGER.info("onAdd " + service.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(service);
            eventBus.publish(SERVICE_UPDATED, JsonObject.mapFrom(ds));
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Service oldService, Service newService) {
        try {
            LOGGER.info("onUpdate " + newService.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(newService);
            eventBus.publish(SERVICE_UPDATED, JsonObject.mapFrom(ds));
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onDelete(Service service, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + service.getMetadata().getName());
            ServiceStatus ds = new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesStatusService.getCluster(),
                    kubernetesStatusService.environment);
            eventBus.publish(SERVICE_DELETED, JsonObject.mapFrom(ds));
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    public ServiceStatus getServiceStatus(Service service) {
        try {
            return new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesStatusService.environment,
                    kubernetesStatusService.getCluster(),
                    service.getSpec().getPorts().get(0).getPort(),
                    service.getSpec().getPorts().get(0).getTargetPort().getIntVal(),
                    service.getSpec().getClusterIP(),
                    service.getSpec().getType()
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesStatusService.getCluster(),
                    kubernetesStatusService.environment);
        }
    }
}