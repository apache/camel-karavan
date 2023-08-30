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

import com.github.dockerjava.api.model.HealthCheck;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.docker.model.DevService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

import static org.apache.camel.karavan.shared.Constants.*;

@ApplicationScoped
public class DockerForKaravan {

    private static final Logger LOGGER = Logger.getLogger(DockerForKaravan.class.getName());

    protected static final String KARAVAN_CONTAINER_NAME = "karavan-headless";

    @ConfigProperty(name = "karavan.devmode.image")
    String devmodeImage;

    @ConfigProperty(name = "karavan.headless.image")
    String headlessImage;

    @ConfigProperty(name = "karavan.infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name = "karavan.infinispan.password")
    String infinispanPassword;

    @Inject
    DockerService dockerService;

    public void createDevmodeContainer(String projectId, String jBangOptions) throws InterruptedException {
        LOGGER.infof("DevMode starting for %s with JBANG_OPTIONS=%s", projectId, jBangOptions);

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        List<String> env = jBangOptions != null && !jBangOptions.trim().isEmpty()
                ? List.of(ENV_VAR_JBANG_OPTIONS + "=" + jBangOptions)
                : List.of();

        dockerService.createContainer(projectId, devmodeImage,
                env, null, false, List.of(), healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devmode.name(), LABEL_PROJECT_ID, projectId));

        LOGGER.infof("DevMode started for %s", projectId);
    }

    public void createDevserviceContainer(DevService devService) throws InterruptedException {
        LOGGER.infof("DevService starting for ", devService.getContainer_name());

        HealthCheck healthCheck = dockerService.getHealthCheck(devService.getHealthcheck());
        List<String> env = devService.getEnvironment() != null ? devService.getEnvironmentList() : List.of();
        String ports = String.join(",", devService.getPorts());

        dockerService.createContainer(devService.getContainer_name(), devService.getImage(),
                env, ports, false, devService.getExpose(), healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devservice.name()));

        LOGGER.infof("DevService started for %s", devService.getContainer_name());
    }

    public void startKaravanHeadlessContainer() {
        try {
            LOGGER.info("Karavan headless is starting...");

            dockerService.createContainer(KARAVAN_CONTAINER_NAME, headlessImage,
                    List.of(
                            "INFINISPAN_HOSTS=infinispan:11222",
                            "INFINISPAN_USERNAME=" + infinispanUsername,
                            "INFINISPAN_PASSWORD=" + infinispanPassword
                    ),
                    null, false, List.of(), new HealthCheck(),
                    Map.of(LABEL_TYPE, ContainerStatus.ContainerType.internal.name()));

            dockerService.runContainer(KARAVAN_CONTAINER_NAME);
            LOGGER.info("Karavan headless is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public void deleteKaravanHeadlessContainer() {
        try {
            dockerService.stopContainer(KARAVAN_CONTAINER_NAME);
            dockerService.deleteContainer(KARAVAN_CONTAINER_NAME);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }
}
