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
import org.apache.camel.karavan.api.KameletResources;
import org.apache.camel.karavan.code.model.DockerComposeHealthCheck;
import org.apache.camel.karavan.cache.model.ContainerPort;
import org.apache.camel.karavan.cache.model.ContainerStatus;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.DecimalFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.shared.Constants.*;

public class DockerServiceUtils {

    protected static final DecimalFormat formatCpu = new DecimalFormat("0.00");
    protected static final DecimalFormat formatMiB = new DecimalFormat("0.0");
    protected static final DecimalFormat formatGiB = new DecimalFormat("0.00");
    protected static final Map<String, Tuple2<Long, Long>> previousStats = new ConcurrentHashMap<>();

    protected ContainerStatus getContainerStatus(Container container, String environment) {
        String name = container.getNames()[0].replace("/", "");
        List<ContainerPort> ports = Arrays.stream(container.getPorts())
                .map(p -> new ContainerPort(p.getPrivatePort(), p.getPublicPort(), p.getType()))
                .collect(Collectors.toList());
        List<ContainerStatus.Command> commands = getContainerCommand(container.getState());
        ContainerStatus.ContainerType type = getContainerType(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        String projectId = container.getLabels().getOrDefault(LABEL_PROJECT_ID, name);
        String camelRuntime = container.getLabels().getOrDefault(LABEL_CAMEL_RUNTIME, "");
        return ContainerStatus.createWithId(projectId, name, environment, container.getId(), container.getImage(), ports, type, commands, container.getState(), created, camelRuntime);
    }

    protected void updateStatistics(ContainerStatus containerStatus, Statistics stats) {
        if (stats != null && stats.getMemoryStats() != null) {
            String memoryUsageString = formatMemory(stats.getMemoryStats().getUsage());
            String memoryLimitString = formatMemory(stats.getMemoryStats().getLimit());
            containerStatus.setMemoryInfo(memoryUsageString + " / " + memoryLimitString);
            containerStatus.setCpuInfo(formatCpu(containerStatus.getContainerName(), stats));
        } else {
            containerStatus.setMemoryInfo("0MiB/0MiB");
            containerStatus.setCpuInfo("0%");
        }
    }

    protected HealthCheck getHealthCheck(DockerComposeHealthCheck config) {
        if (config != null) {
            HealthCheck healthCheck = new HealthCheck().withTest(config.getTest());
            if (config.getInterval() != null) {
                healthCheck.withInterval(durationNanos(config.getInterval()));
            }
            if (config.getTimeout() != null) {
                healthCheck.withTimeout(durationNanos(config.getTimeout()));
            }
            if (config.getStart_period() != null) {
                healthCheck.withStartPeriod(durationNanos(config.getStart_period()));
            }
            if (config.getRetries() != null) {
                healthCheck.withRetries(config.getRetries());
            }
            return healthCheck;
        }
        return new HealthCheck();
    }

    protected static String getResourceFile(String path) {
        try {
            InputStream inputStream = KameletResources.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }

    protected static long durationNanos(String s) {
        if (Pattern.compile("\\d+d\\s").matcher(s).find()) {
            int idxSpace = s.indexOf(" ");
            s = "P" + s.substring(0, idxSpace) + "T" + s.substring(idxSpace + 1);
        } else
            s = "PT" + s;
        s = s.replace(" ", "");
        return Duration.parse(s).toMillis() * 1000000L;
    }

    protected Ports getPortBindings(Map<Integer, Integer> ports) {
        Ports portBindings = new Ports();

        ports.forEach((hostPort, containerPort) -> {
            Ports.Binding binding = Ports.Binding.bindPort(hostPort);
            portBindings.bind(ExposedPort.tcp(containerPort), binding);
        });
        return portBindings;
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
        } else if (Objects.equals(type, ContainerStatus.ContainerType.build.name())) {
            return ContainerStatus.ContainerType.build;
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
