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
import org.apache.camel.karavan.model.ContainerPort;
import org.apache.camel.karavan.model.DockerComposeHealthCheck;
import org.apache.camel.karavan.model.PodContainerStatus;

import java.text.DecimalFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.*;

public class DockerUtils {

    protected static final DecimalFormat formatCpu = new DecimalFormat("0.00");
    protected static final DecimalFormat formatMiB = new DecimalFormat("0.0");
    protected static final DecimalFormat formatGiB = new DecimalFormat("0.00");
    protected static final Map<String, Tuple2<Long, Long>> previousStats = new ConcurrentHashMap<>();

    private static final Map<String, Long> UNIT_MULTIPLIERS = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);;
    static {
        UNIT_MULTIPLIERS.put("b", 1L);
        UNIT_MULTIPLIERS.put("k", 1024L);
        UNIT_MULTIPLIERS.put("m", 1024L * 1024);
        UNIT_MULTIPLIERS.put("g", 1024L * 1024 * 1024);
        // Add more units if needed
    }

    static Long parseMemory(String memory) {

        if (memory != null && !memory.isEmpty()) {
            memory = memory.trim();
            String numericPart = memory.replaceAll("[^\\d.]", "");
            double numericValue = Double.parseDouble(numericPart);
            String unitPart = memory.replaceAll("[\\d.]", "").toLowerCase();
            Long multiplier = UNIT_MULTIPLIERS.get(unitPart);
            if (multiplier == null) {
                throw new IllegalArgumentException("Invalid unit in memory: " + unitPart);
            }
            return (long) (numericValue * multiplier);
        }
        return null;
    }

    static HealthCheck getHealthCheck(DockerComposeHealthCheck config) {
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

     public static long durationNanos(String s) {
        if (Pattern.compile("\\d+d\\s").matcher(s).find()) {
            int idxSpace = s.indexOf(" ");
            s = "P" + s.substring(0, idxSpace) + "T" + s.substring(idxSpace + 1);
        } else
            s = "PT" + s;
        s = s.replace(" ", "");
        return Duration.parse(s).toMillis() * 1000000L;
    }

    static Ports getPortBindings(Map<Integer, Integer> ports) {
        Ports portBindings = new Ports();

        ports.forEach((hostPort, containerPort) -> {
            Ports.Binding binding = Ports.Binding.bindPort(hostPort);
            portBindings.bind(ExposedPort.tcp(containerPort), binding);
        });
        return portBindings;
    }

    public static PodContainerStatus getContainerStatus(Container container, String environment) {
        String name = container.getNames()[0].replace("/", "");
        List<ContainerPort> ports = Arrays.stream(container.getPorts())
                .map(p -> new ContainerPort(p.getPrivatePort(), p.getPublicPort(), p.getType()))
                .collect(Collectors.toList());
        List<PodContainerStatus.Command> commands = getContainerCommand(container.getState());
        PodContainerStatus.ContainerType type = getContainerType(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        String projectId = container.getLabels().getOrDefault(LABEL_PROJECT_ID, name);
        String camelRuntime = container.getLabels().getOrDefault(LABEL_CAMEL_RUNTIME, "");
        return PodContainerStatus.createWithId(projectId, name, environment, container.getId(), container.getImage(),
                ports, type, commands, container.getState(), created, camelRuntime);
    }

    public static void updateStatistics(PodContainerStatus podContainerStatus, Statistics stats) {
        if (stats != null && stats.getMemoryStats() != null) {
            String memoryUsageString = formatMemory(stats.getMemoryStats().getUsage());
            String memoryLimitString = formatMemory(stats.getMemoryStats().getLimit());
            podContainerStatus.setMemoryInfo(memoryUsageString + " / " + memoryLimitString);
            podContainerStatus.setCpuInfo(formatCpu(podContainerStatus.getContainerName(), stats));
        } else {
            podContainerStatus.setMemoryInfo("0MiB/0MiB");
            podContainerStatus.setCpuInfo("0%");
        }
    }

    static String formatCpu(String containerName, Statistics stats) {
        try {
            double cpuUsage = 0;
            long previousCpu = previousStats.containsKey(containerName) ? previousStats.get(containerName).getItem1()
                    : -1;
            long previousSystem = previousStats.containsKey(containerName) ? previousStats.get(containerName).getItem2()
                    : -1;

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

    static PodContainerStatus.ContainerType getContainerType(Map<String, String> labels) {
        String type = labels.get(LABEL_TYPE);
        if (Objects.equals(type, PodContainerStatus.ContainerType.devmode.name())) {
            return PodContainerStatus.ContainerType.devmode;
        } else if (Objects.equals(type, PodContainerStatus.ContainerType.devservice.name())) {
            return PodContainerStatus.ContainerType.devservice;
        } else if (Objects.equals(type, PodContainerStatus.ContainerType.project.name())) {
            return PodContainerStatus.ContainerType.project;
        } else if (Objects.equals(type, PodContainerStatus.ContainerType.internal.name())) {
            return PodContainerStatus.ContainerType.internal;
        } else if (Objects.equals(type, PodContainerStatus.ContainerType.build.name())) {
            return PodContainerStatus.ContainerType.build;
        }
        return PodContainerStatus.ContainerType.unknown;
    }

    static List<PodContainerStatus.Command> getContainerCommand(String state) {
        List<PodContainerStatus.Command> result = new ArrayList<>();
        if (Objects.equals(state, PodContainerStatus.State.created.name())) {
            result.add(PodContainerStatus.Command.run);
            result.add(PodContainerStatus.Command.delete);
        } else if (Objects.equals(state, PodContainerStatus.State.exited.name())) {
            result.add(PodContainerStatus.Command.run);
            result.add(PodContainerStatus.Command.delete);
        } else if (Objects.equals(state, PodContainerStatus.State.running.name())) {
            result.add(PodContainerStatus.Command.pause);
            result.add(PodContainerStatus.Command.stop);
            result.add(PodContainerStatus.Command.delete);
        } else if (Objects.equals(state, PodContainerStatus.State.paused.name())) {
            result.add(PodContainerStatus.Command.run);
            result.add(PodContainerStatus.Command.stop);
            result.add(PodContainerStatus.Command.delete);
        } else if (Objects.equals(state, PodContainerStatus.State.dead.name())) {
            result.add(PodContainerStatus.Command.delete);
        }
        return result;
    }

    static String formatMemory(Long memory) {
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
}
