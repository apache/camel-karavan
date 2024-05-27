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
package org.apache.camel.karavan.status.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.InvocationBuilder;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.camel.karavan.status.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.util.*;

@ApplicationScoped
public class DockerAPI {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    private DockerClient dockerClient;

    public List<ContainerStatus> collectContainersStatuses() {
        List<ContainerStatus> result = new ArrayList<>();
        getDockerClient().listContainersCmd().withShowAll(true).exec().forEach(container -> {
            ContainerStatus containerStatus = DockerUtils.getContainerStatus(container, environment);
            result.add(containerStatus);
        });
        return result;
    }

    public ContainerStatus collectContainerStatistics(ContainerStatus containerStatus) {
        Container container = getContainerByName(containerStatus.getContainerName());
        Statistics stats = getContainerStats(container.getId());
        DockerUtils.updateStatistics(containerStatus, stats);
        return containerStatus;
    }

    public Container getContainerByName(String name) {
        List<Container> containers = findContainer(name);
        return !containers.isEmpty() ? containers.get(0) : null;
    }

    public Statistics getContainerStats(String containerId) {
        InvocationBuilder.AsyncResultCallback<Statistics> callback = new InvocationBuilder.AsyncResultCallback<>();
        getDockerClient().statsCmd(containerId).withContainerId(containerId).withNoStream(true).exec(callback);
        Statistics stats = null;
        try {
            stats = callback.awaitResult();
            callback.close();
        } catch (RuntimeException | IOException e) {
            // you may want to throw an exception here
        }
        return stats;
    }

    public List<Container> findContainer(String containerName) {
        return getDockerClient().listContainersCmd().withShowAll(true).withNameFilter(List.of(containerName)).exec()
                .stream().filter(c -> Objects.equals(c.getNames()[0].replaceFirst("/", ""), containerName)).toList();
    }

    private DockerClientConfig getDockerClientConfig() {
        DefaultDockerClientConfig.Builder builder =  DefaultDockerClientConfig.createDefaultConfigBuilder();
        return builder.build();
    }

    private DockerHttpClient getDockerHttpClient(DockerClientConfig config) {
        return new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(100)
                .build();
    }

    public DockerClient getDockerClient() {
        if (dockerClient == null) {
            DockerClientConfig config = getDockerClientConfig();
            DockerHttpClient httpClient = getDockerHttpClient(config);
            dockerClient = DockerClientImpl.getInstance(config, httpClient);
        }
        return dockerClient;
    }
}
