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
package org.apache.camel.karavan.docker;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.code.CodeService;
import org.apache.camel.karavan.cache.model.ContainerStatus;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DockerForRegistry {

    private static final Logger LOGGER = Logger.getLogger(DockerForRegistry.class.getName());

    protected static final String REGISTRY_CONTAINER_NAME = "registry";

    @Inject
    DockerService dockerService;

    @Inject
    CodeService codeService;

    public void startRegistry() {
        try {
            LOGGER.info("Registry is starting...");
            var compose = codeService.getInternalDockerComposeService(REGISTRY_CONTAINER_NAME);
            dockerService.createContainerFromCompose(compose, ContainerStatus.ContainerType.internal, false);
            dockerService.runContainer(REGISTRY_CONTAINER_NAME);
            LOGGER.info("Registry is started");
        } catch (Exception e) {
            LOGGER.error(e.getCause().getMessage());
        }
    }
}
