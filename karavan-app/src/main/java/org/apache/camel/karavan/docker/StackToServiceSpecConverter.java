package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.model.*;
import org.apache.camel.karavan.model.*;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Converts a docker-stack.yaml file, parsed by DockerStackConverter,
 * into a List of docker-java ServiceSpec objects.
 */
public class StackToServiceSpecConverter {

    /**
     * Parses a docker-stack.yaml file content and converts all defined services
     * into a list of docker-java ServiceSpec objects.
     *
     * @param stackFileContent The raw string content of the docker-stack.yaml
     * @return A list of ServiceSpec objects ready for the Docker API
     */
    public static List<ServiceSpec> convertStack(String stackFileContent) {
        DockerStack stack = DockerStackConverter.fromCode(stackFileContent);
        return convertStack(stack);
    }

    public static List<ServiceSpec> convertStack(DockerStack stack) {
        if (stack.getServices() == null) {
            return new ArrayList<>();
        }

        // 2. Map each DockerStackService entry to a ServiceSpec
        return stack.getServices().entrySet().stream()
                .map(entry -> convertService(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    /**
     * Converts a single DockerStackService (your POJO) into a ServiceSpec (docker-java model)
     *
     * @param serviceName The name of the service (from the YAML key)
     * @param service     The parsed service object
     * @return A docker-java ServiceSpec
     */
    public static ServiceSpec convertService(String serviceName, DockerStackService service) {
        ServiceSpec spec = new ServiceSpec();

        // Top-level properties
        spec.withName(serviceName);
        spec.withLabels(service.getLabels());

        // --- Task Template (The "container" definition) ---
        spec.withTaskTemplate(buildTaskSpec(service));

        // --- Networks ---
        if (service.getNetworks() != null && !service.getNetworks().isEmpty()) {
            spec.withNetworks(buildNetworks(service.getNetworks()));
        }

        // --- Ports / EndpointSpec ---
        if (service.getPorts() != null && !service.getPorts().isEmpty()) {
            spec.withEndpointSpec(buildEndpointSpec(service.getPorts()));
        }

        // --- Deploy Mode (Replicas) ---
        if (service.getDeploy() != null) {
            spec.withMode(buildServiceMode(service.getDeploy()));
        }

        // Note: UpdateConfig and RollbackConfig are not fully modeled
        // in your DockerStackService.Deploy object, so they are omitted here.

        return spec;
    }

    /**
     * Builds the TaskSpec, which contains the ContainerSpec, Resources, and RestartPolicy
     */
    private static TaskSpec buildTaskSpec(DockerStackService service) {
        TaskSpec taskSpec = new TaskSpec();

        // --- ContainerSpec ---
        taskSpec.withContainerSpec(buildContainerSpec(service));

        // --- Resources and RestartPolicy (from 'deploy' block) ---
        if (service.getDeploy() != null) {
            if (service.getDeploy().getResources() != null) {
                taskSpec.withResources(buildResources(service.getDeploy().getResources()));
            }
            if (service.getDeploy().getRestart_policy() != null) {
                taskSpec.withRestartPolicy(buildRestartPolicy(service.getDeploy().getRestart_policy()));
            }
        }

        return taskSpec;
    }

    /**
     * Builds the ContainerSpec, which defines the actual container.
     */
    private static ContainerSpec buildContainerSpec(DockerStackService service) {
        ContainerSpec cs = new ContainerSpec();
        cs.withImage(service.getImage());
        cs.withLabels(service.getLabels());
        cs.withHostname(service.getHostname());
        cs.withConfigs(buildConfigs(service.getConfigs()));
        cs.withCommand(List.of(service.getCommand()));

        // --- Environment Variables ---
        if (service.getEnvironment() != null && !service.getEnvironment().isEmpty()) {
            List<String> env = service.getEnvironment().entrySet().stream()
                    .map(e -> e.getKey() + "=" + e.getValue())
                    .collect(Collectors.toList());
            cs.withEnv(env);
        }

        // --- Command ---
        if (service.getCommand() != null && !service.getCommand().isBlank()) {
            // Docker API 'command' is a list. Stack 'command' can be a string.
            // Best practice is to run string commands in a shell.
            cs.withCommand(Arrays.asList("sh", "-c", service.getCommand()));
        }

        // --- Mounts (Volumes) ---
        if (service.getVolumes() != null && !service.getVolumes().isEmpty()) {
            cs.withMounts(buildMounts(service.getVolumes()));
        }

        // --- Healthcheck ---
        if (service.getHealthcheck() != null) {
            cs.withHealthCheck(buildHealthCheck(service.getHealthcheck()));
        }

        // --- Container Labels (from 'deploy' block) ---
        if (service.getDeploy() != null && service.getDeploy().getLabels() != null) {
            cs.withLabels(service.getDeploy().getLabels());
        }

        // --- Expose (Note: less common in Swarm than 'ports') ---
//        if (service.getExpose() != null && !service.getExpose().isEmpty()) {
//            Map<String, ExposedPort> exposedPorts = service.getExpose().stream()
//                    .collect(Collectors.toMap(
//                            port -> port.contains("/") ? port : port + "/tcp", // Assume TCP if not specified
//                            port -> new ExposedPort()
//                    ));
//        }

        return cs;
    }

    private static List<ContainerSpecConfig> buildConfigs(List<DockerConfigDefinition> configs) {
        List<ContainerSpecConfig> configList = new ArrayList<>();
        for (DockerConfigDefinition config : configs) {

            ContainerSpecFile file = new ContainerSpecFile();
            if (config.getMode() != null) {
                file.withMode(Long.valueOf(config.getMode()));
            }
            file.withName(config.getTarget());

            ContainerSpecConfig containerSpecConfig = new ContainerSpecConfig();
            containerSpecConfig.withFile(file);
            containerSpecConfig.withConfigName(config.getSource());
            configList.add(containerSpecConfig);
        }
        return configList;
    }

    /**
     * Builds the port mappings
     */
    private static EndpointSpec buildEndpointSpec(List<String> ports) {
        List<PortConfig> portConfigs = ports.stream()
                .map(portString -> {
                    // Simple parser, assumes "PUBLISHED:TARGET"
                    // Add more logic here for "IP:PUB:TARGET" or "PUB:TARGET/udp"
                    String[] parts = portString.split(":");
                    Integer published = Integer.parseInt(parts[0]);
                    Integer target = Integer.parseInt(parts[1]);

                    return new PortConfig()
                            .withPublishedPort(published)
                            .withTargetPort(target)
                            .withProtocol(PortConfigProtocol.TCP); // Assume TCP
                })
                .collect(Collectors.toList());

        return new EndpointSpec().withPorts(portConfigs);
    }

    /**
     * Builds the network attachments
     */
    private static List<NetworkAttachmentConfig> buildNetworks(List<String> networks) {
        return networks.stream()
                .map(netName -> new NetworkAttachmentConfig().withTarget(netName))
                .collect(Collectors.toList());
    }

    /**
     * Builds the service mode (e.g., replicated)
     */
    private static ServiceModeConfig buildServiceMode(DockerStackService.Deploy deploy) {
        if (deploy.getReplicas() != null) {
            ServiceReplicatedModeOptions replicated = new ServiceReplicatedModeOptions().withReplicas(deploy.getReplicas());
            return new ServiceModeConfig().withReplicated(replicated);
        }
        // Add logic for 'global' mode if you add it to your Deploy model
        return null;
    }

    /**
     * Builds the task resource constraints
     */
    private static ResourceRequirements buildResources(DockerStackService.Resources res) {
        ResourceRequirements tsr = new ResourceRequirements();

        if (res.getLimits() != null) {
            var resourceSpec = new ResourceSpecs();
            if (res.getLimits().getCpus() != null) {
                resourceSpec.withNanoCPUs(parseCpusToNanoCpus(res.getLimits().getCpus()));
            }
            if (res.getLimits().getMemory() != null) {
                resourceSpec.withMemoryBytes(parseMemoryToBytes(res.getLimits().getMemory()));
            }
            tsr.withLimits(resourceSpec);
        }
        if (res.getReservations() != null) {
            var resourceSpec = new ResourceSpecs();
            if (res.getReservations().getCpus() != null) {
                resourceSpec.withNanoCPUs(parseCpusToNanoCpus(res.getReservations().getCpus()));
            }
            if (res.getReservations().getMemory() != null) {
                resourceSpec.withMemoryBytes(parseMemoryToBytes(res.getReservations().getMemory()));
            }
            tsr.withLimits(resourceSpec);
        }
        return tsr;
    }

    /**
     * Builds the task restart policy
     */
    private static ServiceRestartPolicy buildRestartPolicy(DockerStackService.RestartPolicy policy) {
        ServiceRestartPolicy tsp = new ServiceRestartPolicy();

        if (policy.getCondition() != null) {
            tsp.withCondition(toServiceRestartCondition(policy.getCondition()));
        }
        if (policy.getDelay() != null) {
            tsp.withDelay(parseDurationToNanos(policy.getDelay()));
        }
        if (policy.getMax_attempts() != null) {
            tsp.withMaxAttempts(policy.getMax_attempts().longValue());
        }

        return tsp;
    }

    private static ServiceRestartCondition toServiceRestartCondition(String condition) {
        return switch (condition.toLowerCase()) {
            case "on-failure" -> ServiceRestartCondition.ON_FAILURE;
            case "any" -> ServiceRestartCondition.ANY;
            case "none" -> ServiceRestartCondition.NONE;
            default -> throw new IllegalArgumentException("Unknown restart condition: " + condition);
        };
    }

    /**
     * Builds the mounts
     */
    private static List<Mount> buildMounts(List<DockerVolumeDefinition> volumes) {
        return volumes.stream()
                .map(v -> new Mount()
                                .withType(MountType.valueOf(v.getType().toUpperCase()))
                                .withSource(v.getSource())
                                .withTarget(v.getTarget())
                        // Add more properties like ReadOnly if you model them
                )
                .collect(Collectors.toList());
    }

    /**
     * Builds the health check
     */
    private static HealthCheck buildHealthCheck(DockerHealthCheckDefinition hc) {
        HealthCheck config = new HealthCheck();
        config.withTest(hc.getTest());
        config.withRetries(hc.getRetries());

        if (hc.getInterval() != null) {
            config.withInterval(parseDurationToNanos(hc.getInterval()));
        }
        if (hc.getTimeout() != null) {
            config.withTimeout(parseDurationToNanos(hc.getTimeout()));
        }
        if (hc.getStart_period() != null) {
            config.withStartPeriod(parseDurationToNanos(hc.getStart_period()));
        }
        return config;
    }

    // --- UTILITY HELPERS ---

    /**
     * Converts a duration string (e.g., "30s", "1m", "10000000") into nanoseconds.
     * Accepts:
     *  - ISO-8601 style (e.g., "PT30S", "PT1M")
     *  - Simplified Docker style (e.g., "30s", "1m")
     *  - Plain numeric values (treated as nanoseconds)
     */
    private static Long parseDurationToNanos(String duration) {
        if (duration == null || duration.isBlank()) return null;
        duration = duration.trim();

        // Case 1: plain numeric value (no letters) → assume nanoseconds
        if (duration.matches("^\\d+$")) {
            try {
                return Long.parseLong(duration);
            } catch (NumberFormatException e) {
                System.err.println("Warning: Numeric duration overflow for '" + duration + "'");
                return null;
            }
        }

        // Case 2: textual duration like "30s", "1m", "2h"
        try {
            // Normalize to ISO-8601 by prefixing "PT"
            return Duration.parse("PT" + duration.toUpperCase()).toNanos();
        } catch (Exception e1) {
            // Case 3: user might have provided already valid ISO-8601 like "PT30S"
            try {
                return Duration.parse(duration.toUpperCase()).toNanos();
            } catch (Exception e2) {
                System.err.println("Warning: Could not parse duration '" + duration + "'. " + e2.getMessage());
                return null;
            }
        }
    }


    /**
     * Converts a memory string (e.g., "512M", "1G") into bytes.
     */
    private static Long parseMemoryToBytes(String memory) {
        if (memory == null || memory.isBlank()) {
            return null;
        }

        // This regex captures the numeric value (group 1) and the optional unit (group 2)
        Pattern pattern = Pattern.compile("^(\\d+)([a-zA-Z]*)$");
        Matcher matcher = pattern.matcher(memory.trim());

        if (!matcher.matches()) {
            System.err.println("Warning: Could not parse memory string '" + memory + "'. Invalid format.");
            return null;
        }

        try {
            long value = Long.parseLong(matcher.group(1));
            // Normalize the unit to uppercase to handle "mb", "Mb", "MB", etc.
            String unit = matcher.group(2).toUpperCase();

            return switch (unit) {
                case "G", "GB" -> value * 1024 * 1024 * 1024;
                case "M", "MB" -> value * 1024 * 1024;
                case "K", "KB" -> value * 1024;
                // No unit, or explicitly "B" for bytes
                case "", "B" -> value;
                default -> {
                    System.err.println("Warning: Unknown memory unit '" + matcher.group(2) + "' in '" + memory + "'. Treating as bytes.");
                    yield value;
                }
            };
        } catch (NumberFormatException e) {
            // This should be rare given the regex, but it's safe to handle
            System.err.println("Warning: Could not parse numeric part of memory '" + memory + "'. " + e.getMessage());
            return null;
        }
    }

    /**
     * Converts a CPU string (e.g., "0.5", "1") into nano-CPUs.
     */
    private static Long parseCpusToNanoCpus(String cpus) {
        if (cpus == null) return null;
        try {
            double cpuValue = Double.parseDouble(cpus);
            return (long) (cpuValue * 1_000_000_000L); // 1 CPU = 1e9 nano-CPUs
        } catch (Exception e) {
            System.err.println("Warning: Could not parse cpus '" + cpus + "'. " + e.getMessage());
            return null;
        }
    }
}