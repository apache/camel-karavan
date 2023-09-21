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
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ServiceStatus;
import org.jboss.logging.Logger;

public class ServiceEventHandler implements ResourceEventHandler<Service> {

    private static final Logger LOGGER = Logger.getLogger(ServiceEventHandler.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public ServiceEventHandler(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Service service) {
        try {
            LOGGER.info("onAdd " + service.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(service);
            infinispanService.saveServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Service oldService, Service newService) {
        try {
            LOGGER.info("onUpdate " + newService.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(newService);
            infinispanService.saveServiceStatus(ds);
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
            infinispanService.deleteServiceStatus(ds);
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