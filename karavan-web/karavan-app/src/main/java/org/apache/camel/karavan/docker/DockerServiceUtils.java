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

import com.github.dockerjava.api.model.*;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.api.KameletResources;
import org.apache.camel.karavan.docker.model.DevService;
import org.apache.camel.karavan.docker.model.HealthCheckConfig;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.apache.camel.karavan.service.CodeService;
import org.yaml.snakeyaml.Yaml;

import jakarta.inject.Inject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.DecimalFormat;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.Constants.LABEL_TYPE;

public class DockerServiceUtils {

    protected static final DecimalFormat formatCpu = new DecimalFormat("0.00");
    protected static final DecimalFormat formatMiB = new DecimalFormat("0.0");
    protected static final DecimalFormat formatGiB = new DecimalFormat("0.00");
    protected static final Map<String, Tuple2<Long, Long>> previousStats = new ConcurrentHashMap<>();

    @Inject
    CodeService codeService;


    protected ContainerStatus getContainerStatus(Container container, String environment) {
        String name = container.getNames()[0].replace("/", "");
        List<Integer> ports = Arrays.stream(container.getPorts()).map(ContainerPort::getPrivatePort).filter(Objects::nonNull).collect(Collectors.toList());
        List<ContainerStatus.Command> commands = getContainerCommand(container.getState());
        ContainerStatus.ContainerType type = getContainerType(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        return ContainerStatus.createWithId(name, environment, container.getId(), container.getImage(), ports, type, commands, container.getState(), created);
    }

    protected void updateStatistics(ContainerStatus containerStatus, Container container, Statistics stats) {
        if (stats != null && stats.getMemoryStats() != null) {
            String memoryUsage = formatMemory(stats.getMemoryStats().getUsage());
            String memoryLimit = formatMemory(stats.getMemoryStats().getLimit());
            containerStatus.setMemoryInfo(memoryUsage + " / " + memoryLimit);
            containerStatus.setCpuInfo(formatCpu(containerStatus.getContainerName(), stats));
        }
    }

    public DevService getDevService(String code, String name) {
        Yaml yaml = new Yaml();
        Map<String, Object> obj = yaml.load(code);
        JsonObject json = JsonObject.mapFrom(obj);
        JsonObject services = json.getJsonObject("services");
        if (services.containsKey(name)) {
            DevService ds = services.getJsonObject(name).mapTo(DevService.class);
            if (ds.getContainer_name() == null) {
                ds.setContainer_name(name);
            }
            return ds;
        } else {
            Optional<JsonObject> j = services.fieldNames().stream()
                    .map(services::getJsonObject)
                    .filter(s -> {
                        s.getJsonObject("container_name");
                        return false;
                    }).findFirst();
            if (j.isPresent()) {
                return j.get().mapTo(DevService.class);
            }
        }
        return null;
    }

    protected HealthCheck getHealthCheck(HealthCheckConfig config) {
        if (config != null) {
            HealthCheck healthCheck = new HealthCheck().withTest(config.getTest());
            if (config.getInterval() != null) {
                healthCheck.withInterval(convertDuration(config.getInterval()));
            }
            if (config.getTimeout() != null) {
                healthCheck.withTimeout(convertDuration(config.getTimeout()));
            }
            if (config.getStart_period() != null) {
                healthCheck.withStartPeriod(convertDuration(config.getStart_period()));
            }
            if (config.getRetries() != null) {
                healthCheck.withRetries(config.getRetries());
            }
            return healthCheck;
        }
        return new HealthCheck();
    }

    protected Long convertDuration(String value) {
        return Long.parseLong(value.replace("s", "")) * 1000000000L;
    }

    protected String getResourceFile(String path) {
        try {
            InputStream inputStream = KameletResources.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }

    protected HostConfig getHostConfig(String ports, List<ExposedPort> exposedPorts, boolean inRange, String network) {
        Ports portBindings = new Ports();

        getPortsFromString(ports).forEach((hostPort, containerPort) -> {
            Ports.Binding binding = (exposedPorts.stream().anyMatch(e -> e.getPort() == containerPort))
                    ? (inRange ? Ports.Binding.bindPortRange(hostPort, hostPort + 1000) : Ports.Binding.bindPort(hostPort))
                    : Ports.Binding.bindPort(hostPort);
            portBindings.bind(ExposedPort.tcp(containerPort), binding);
        });
        return new HostConfig()
                .withPortBindings(portBindings)
                .withNetworkMode(network);
    }

    protected Map<Integer, Integer> getPortsFromString(String ports) {
        Map<Integer, Integer> p = new HashMap<>();
        if (ports != null && !ports.isEmpty()) {
            Arrays.stream(ports.split(",")).forEach(s -> {
                String[] values = s.split(":");
                p.put(Integer.parseInt(values[0]), Integer.parseInt(values[1]));
            });
        }
        return p;
    }

    protected String formatMemory(Long memory) {
        try {
            if (memory < (1073741824)) {
                return formatMiB.format(memory.doubleValue() / 1048576) + "MiB";
            } else {
                return formatGiB.format(memory.doubleValue() / 1073741824) + "GiB";
            }
        } catch (Exception e) {
            return "";
        }
    }

    protected ContainerStatus.ContainerType getContainerType(Map<String, String> labels) {
        String type = labels.get(LABEL_TYPE);
        if (Objects.equals(type, ContainerStatus.ContainerType.devmode.name())) {
            return ContainerStatus.ContainerType.devmode;
        } else if (Objects.equals(type, ContainerStatus.ContainerType.devservice.name())) {
            return ContainerStatus.ContainerType.devservice;
        } else if (Objects.equals(type, ContainerStatus.ContainerType.project.name())) {
            return ContainerStatus.ContainerType.project;
        } else if (Objects.equals(type, ContainerStatus.ContainerType.internal.name())) {
            return ContainerStatus.ContainerType.internal;
        }
        return ContainerStatus.ContainerType.unknown;
    }

    protected List<ContainerStatus.Command> getContainerCommand(String state) {
        List<ContainerStatus.Command> result = new ArrayList<>();
        if (Objects.equals(state, ContainerStatus.State.created.name())) {
            result.add(ContainerStatus.Command.run);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.exited.name())) {
            result.add(ContainerStatus.Command.run);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.running.name())) {
            result.add(ContainerStatus.Command.pause);
            result.add(ContainerStatus.Command.stop);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.paused.name())) {
            result.add(ContainerStatus.Command.run);
            result.add(ContainerStatus.Command.stop);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.dead.name())) {
            result.add(ContainerStatus.Command.delete);
        }
        return result;
    }

    protected String formatCpu(String containerName, Statistics stats) {
        try {
            double cpuUsage = 0;
            long previousCpu = previousStats.containsKey(containerName) ? previousStats.get(containerName).getItem1() : -1;
            long previousSystem = previousStats.containsKey(containerName) ? previousStats.get(containerName).getItem2() : -1;

            CpuStatsConfig cpuStats = stats.getCpuStats();
            if (cpuStats != null) {
                CpuUsageConfig cpuUsageConfig = cpuStats.getCpuUsage();
                long systemUsage = cpuStats.getSystemCpuUsage();
                long totalUsage = cpuUsageConfig.getTotalUsage();

                if (previousCpu != -1 && previousSystem != -1) {
                    float cpuDelta = totalUsage - previousCpu;
                    float systemDelta = systemUsage - previousSystem;

                    if (cpuDelta > 0 && systemDelta > 0) {
                        cpuUsage = cpuDelta / systemDelta * cpuStats.getOnlineCpus() * 100;
                    }
                }
                previousStats.put(containerName, Tuple2.of(totalUsage, systemUsage));
            }
            return formatCpu.format(cpuUsage) + "%";
        } catch (Exception e) {
            return "";
        }
    }
}
