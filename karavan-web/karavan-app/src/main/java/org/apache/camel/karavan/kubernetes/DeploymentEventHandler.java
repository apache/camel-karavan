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

import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.DeploymentStatus;
import org.jboss.logging.Logger;

public class DeploymentEventHandler implements ResourceEventHandler<Deployment> {

    private static final Logger LOGGER = Logger.getLogger(DeploymentEventHandler.class.getName());
    private final KaravanCacheService karavanCacheService;
    private final KubernetesService kubernetesService;

    public DeploymentEventHandler(KaravanCacheService karavanCacheService, KubernetesService kubernetesService) {
        this.karavanCacheService = karavanCacheService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Deployment deployment) {
        try {
            LOGGER.info("onAdd " + deployment.getMetadata().getName());
            DeploymentStatus ds = getDeploymentStatus(deployment);
            karavanCacheService.saveDeploymentStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Deployment oldDeployment, Deployment newDeployment) {
        try {
            LOGGER.info("onUpdate " + newDeployment.getMetadata().getName());
            DeploymentStatus ds = getDeploymentStatus(newDeployment);
            karavanCacheService.saveDeploymentStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onDelete(Deployment deployment, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + deployment.getMetadata().getName());
            DeploymentStatus ds = new DeploymentStatus(
                    deployment.getMetadata().getName(),
                    deployment.getMetadata().getNamespace(),
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
            karavanCacheService.deleteDeploymentStatus(ds);
            karavanCacheService.deleteCamelStatuses(deployment.getMetadata().getName(), ds.getEnv());
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    public DeploymentStatus getDeploymentStatus(Deployment deployment) {
        try {
            String dsImage = deployment.getSpec().getTemplate().getSpec().getContainers().get(0).getImage();
            String imageName = dsImage.startsWith("image-registry.openshift-image-registry.svc")
                    ? dsImage.replace("image-registry.openshift-image-registry.svc:5000/", "")
                    : dsImage;

            return new DeploymentStatus(
                    deployment.getMetadata().getName(),
                    deployment.getMetadata().getNamespace(),
                    kubernetesService.getCluster(),
                    kubernetesService.environment,
                    imageName,
                    deployment.getSpec().getReplicas(),
                    deployment.getStatus().getReadyReplicas(),
                    deployment.getStatus().getUnavailableReplicas()
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new DeploymentStatus(
                    deployment.getMetadata().getName(),
                    deployment.getMetadata().getNamespace(),
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
        }
    }
}