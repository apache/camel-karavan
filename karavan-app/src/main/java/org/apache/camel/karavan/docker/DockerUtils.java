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
import org.apache.camel.karavan.cache.ContainerPort;
import org.apache.camel.karavan.cache.ContainerType;
import org.apache.camel.karavan.cache.PodContainerStatus;
import org.apache.camel.karavan.model.DockerHealthCheckDefinition;
import org.apache.camel.karavan.model.DockerResourceLimits;
import org.jboss.logging.Logger;

import java.text.DecimalFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.*;

public class DockerUtils {

    private static final Logger LOGGER = Logger.getLogger(DockerUtils.class.getName());

    protected static final DecimalFormat formatCpu = new DecimalFormat("0.00");
    protected static final DecimalFormat formatMiB = new DecimalFormat("0.0");
    protected static final DecimalFormat formatGiB = new DecimalFormat("0.00");
    protected static final Map<String, Tuple2<Long, Long>> previousStats = new ConcurrentHashMap<>();

    private static final Map<String, Long> UNIT_MULTIPLIERS = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
    static {
        UNIT_MULTIPLIERS.put("", 1L);
        UNIT_MULTIPLIERS.put("b", 1L);
        UNIT_MULTIPLIERS.put("k", 1024L);
        UNIT_MULTIPLIERS.put("kb", 1024L);
        UNIT_MULTIPLIERS.put("kib", 1024L);
        UNIT_MULTIPLIERS.put("m", 1024L * 1024);
        UNIT_MULTIPLIERS.put("mb", 1024L * 1024);
        UNIT_MULTIPLIERS.put("mib", 1024L * 1024);
        UNIT_MULTIPLIERS.put("g", 1024L * 1024 * 1024);
        UNIT_MULTIPLIERS.put("gb", 1024L * 1024 * 1024);
        UNIT_MULTIPLIERS.put("gib", 1024L * 1024 * 1024);
        UNIT_MULTIPLIERS.put("t", 1024L * 1024 * 1024 * 1024);
        UNIT_MULTIPLIERS.put("tb", 1024L * 1024 * 1024 * 1024);
        UNIT_MULTIPLIERS.put("tib", 1024L * 1024 * 1024 * 1024);
    }

    private static final Pattern MEMORY_PATTERN = Pattern.compile("^(\\d+(?:\\.\\d+)?)\\s*([a-zA-Z]*)$");

    // Docker refuses a memory limit below 6MiB.
    static final long MIN_MEMORY = 6L * 1024 * 1024;
    static final long NANO = 1_000_000_000L;
    // 1e6 nanoCPUs (0.001 CPU) is the smallest value the Daemon accepts.
    static final long MIN_NANO_CPUS = 1_000_000L;
    // Relative CPU weight the Linux scheduler gives to a container asking for a single CPU.
    static final int CPU_SHARES_PER_CPU = 1024;
    // Relative CPU weight accepted by the Linux scheduler.
    static final int MIN_CPU_SHARES = 2;
    static final int MAX_CPU_SHARES = 262_144;

    /**
     * Parses a Compose byte value ("512m", "1gb", "1024") into bytes. Compose byte units are
     * powers of 1024, so "1kb" and "1kib" are both 1024 bytes.
     */
    static Long parseMemory(String memory) {
        if (memory == null || memory.isBlank()) {
            return null;
        }
        var matcher = MEMORY_PATTERN.matcher(memory.trim());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid memory value: " + memory);
        }
        double numericValue = Double.parseDouble(matcher.group(1));
        Long multiplier = UNIT_MULTIPLIERS.get(matcher.group(2));
        if (multiplier == null) {
            throw new IllegalArgumentException("Invalid unit in memory: " + matcher.group(2));
        }
        return (long) (numericValue * multiplier);
    }

    /**
     * Parses a Compose {@code cpus} value: a fractional number of CPUs, i.e. "1.5".
     */
    static Double parseCpus(String key, String cpus) {
        if (cpus == null || cpus.isBlank()) {
            return null;
        }
        double value;
        try {
            value = Double.parseDouble(cpus.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid " + key + " value: " + cpus);
        }
        return value > 0 ? value : null;
    }

    /**
     * Converts a Compose {@code cpus} value into nanoCPUs, which is what the Docker Daemon expects.
     */
    static Long parseNanoCpus(String key, String cpus) {
        Double value = parseCpus(key, cpus);
        if (value == null) {
            return null;
        }
        long nanoCpus = Math.round(value * NANO);
        if (nanoCpus < MIN_NANO_CPUS) {
            LOGGER.warnf("%s %s is below the minimum supported by Docker, using %s nanoCPUs", key, cpus, MIN_NANO_CPUS);
            return MIN_NANO_CPUS;
        }
        return nanoCpus;
    }

    /**
     * A CPU reservation cannot be granted by a standalone Daemon, the closest it offers is the
     * relative CPU weight, which is what Compose itself falls back to. One CPU is 1024 shares.
     */
    static Integer toCpuShares(double cpus) {
        long shares = Math.round(cpus * CPU_SHARES_PER_CPU);
        if (shares < MIN_CPU_SHARES) {
            return MIN_CPU_SHARES;
        }
        if (shares > MAX_CPU_SHARES) {
            return MAX_CPU_SHARES;
        }
        return (int) shares;
    }

    /**
     * Parses a Compose {@code pids} limit. {@code -1} means unlimited.
     */
    static Long parsePidsLimit(String pids) {
        if (pids == null || pids.isBlank()) {
            return null;
        }
        long value;
        try {
            value = Long.parseLong(pids.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid pids value: " + pids);
        }
        if (value < 0) {
            return -1L; // unlimited
        }
        return value;
    }

    /**
     * Applies the {@code deploy.resources} limits and reservations to the HostConfig so that the
     * Daemon actually enforces them. Values that are not set are left untouched instead of being
     * sent as 0, which the Daemon reads as "no limit".
     */
    public static void applyResourceLimits(HostConfig hostConfig, DockerResourceLimits limits) {
        if (limits == null) {
            return;
        }

        Long memory = parseMemory(limits.memLimit());
        if (memory != null && memory > 0) {
            if (memory < MIN_MEMORY) {
                LOGGER.warnf("memory limit %s is below the minimum supported by Docker, using %s bytes", limits.memLimit(), MIN_MEMORY);
                memory = MIN_MEMORY;
            }
            hostConfig.withMemory(memory);
            // Without an explicit swap limit the Daemon grants twice the memory limit as swap,
            // which lets the container exceed the configured limit. Pin swap to the limit.
            hostConfig.withMemorySwap(memory);
        } else {
            memory = null;
        }

        Long reservation = parseMemory(limits.memReservation());
        if (reservation != null && reservation > 0) {
            if (memory != null && reservation > memory) {
                LOGGER.warnf("memory reservation %s is greater than the memory limit, using the limit", limits.memReservation());
                reservation = memory;
            }
            hostConfig.withMemoryReservation(reservation);
        }

        Double cpuLimit = parseCpus("cpus limit", limits.cpuLimit());
        Long nanoCpus = parseNanoCpus("cpus limit", limits.cpuLimit());
        if (nanoCpus != null) {
            hostConfig.withNanoCPUs(nanoCpus);
        }

        Double cpuReservation = parseCpus("cpus reservation", limits.cpuReservation());
        if (cpuReservation != null) {
            if (cpuLimit != null && cpuReservation > cpuLimit) {
                LOGGER.warnf("cpus reservation %s is greater than the cpus limit, using the limit", limits.cpuReservation());
                cpuReservation = cpuLimit;
            }
            hostConfig.withCpuShares(toCpuShares(cpuReservation));
        }

        Long pidsLimit = parsePidsLimit(limits.pidsLimit());
        if (pidsLimit != null && pidsLimit != 0) {
            hostConfig.withPidsLimit(pidsLimit);
        }
    }

    static HealthCheck getHealthCheck(DockerHealthCheckDefinition config) {
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

    static List<ExposedPort> getExposedPorts(Map<Integer, Integer> ports) {
        List<ExposedPort> exposedPorts = new ArrayList<>(ports.size());
        ports.forEach((hostPort, containerPort) -> {
            exposedPorts.add(ExposedPort.tcp(containerPort));
        });
        return exposedPorts;
    }

    public static PodContainerStatus getContainerStatus(Container container, String environment) {
        String name = container.getNames()[0].replace("/", "");
        List<ContainerPort> ports = container.getPorts() != null
                ? Arrays.stream(container.getPorts())
                .map(p -> new ContainerPort(p.getPrivatePort(), p.getPublicPort(), p.getType()))
                .collect(Collectors.toList())
                : new ArrayList<>();
        List<PodContainerStatus.Command> commands = getContainerCommand(container.getState());
        ContainerType type = getContainerType(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        String projectId = container.getLabels().getOrDefault(LABEL_PROJECT_ID, name);
        String camelRuntime = container.getLabels().getOrDefault(LABEL_CAMEL_RUNTIME, "");
        return PodContainerStatus.createWithId(projectId, name, environment, container.getId(), container.getImage(),
                ports, type, commands, container.getState(), created, camelRuntime, container.getLabels());
    }

    public static PodContainerStatus getServiceStatus(Service service, Container container, String environment) {
        String name = container.getNames()[0].replace("/", "");
        var spec = service.getSpec();
        var endpoint = spec != null ? spec.getEndpointSpec() : null;
        List<PortConfig> specPorts = endpoint  != null ? endpoint.getPorts() : List.of();
        List<ContainerPort> ports = specPorts != null
                ? specPorts.stream().map(p -> new ContainerPort(p.getTargetPort(), p.getPublishedPort(), p.getPublishMode() !=null ? p.getPublishMode().name() : "")).collect(Collectors.toList())
                : new ArrayList<>();
        List<PodContainerStatus.Command> commands = getContainerCommand(container.getState());
        ContainerType type = getContainerType(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        String projectId = container.getLabels().getOrDefault(LABEL_PROJECT_ID, service.getSpec().getName());
        String camelRuntime = container.getLabels().getOrDefault(LABEL_CAMEL_RUNTIME, "");
        return PodContainerStatus.createWithId(projectId, name, environment, container.getId(), container.getImage(),
                ports, type, commands, container.getState(), created, camelRuntime, container.getLabels());
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

    static ContainerType getContainerType(Map<String, String> labels) {
        String type = labels.get(LABEL_TYPE);
        if (Objects.equals(type, ContainerType.devmode.name())) {
            return ContainerType.devmode;
        } else if (Objects.equals(type, ContainerType.packaged.name())) {
            return ContainerType.packaged;
        } else if (Objects.equals(type, ContainerType.internal.name())) {
            return ContainerType.internal;
        } else if (Objects.equals(type, ContainerType.build.name())) {
            return ContainerType.build;
        }
        return ContainerType.unknown;
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
