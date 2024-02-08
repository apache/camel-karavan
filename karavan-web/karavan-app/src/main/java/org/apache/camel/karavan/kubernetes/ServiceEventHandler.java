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
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.ServiceStatus;
import org.jboss.logging.Logger;

public class ServiceEventHandler implements ResourceEventHandler<Service> {

    private static final Logger LOGGER = Logger.getLogger(ServiceEventHandler.class.getName());
    private KaravanCacheService karavanCacheService;
    private KubernetesService kubernetesService;

    public ServiceEventHandler(KaravanCacheService karavanCacheService, KubernetesService kubernetesService) {
        this.karavanCacheService = karavanCacheService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Service service) {
        try {
            LOGGER.info("onAdd " + service.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(service);
            karavanCacheService.saveServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Service oldService, Service newService) {
        try {
            LOGGER.info("onUpdate " + newService.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(newService);
            karavanCacheService.saveServiceStatus(ds);
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
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
            karavanCacheService.deleteServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    public ServiceStatus getServiceStatus(Service service) {
        try {
            return new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesService.environment,
                    kubernetesService.getCluster(),
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
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
        }
    }
}