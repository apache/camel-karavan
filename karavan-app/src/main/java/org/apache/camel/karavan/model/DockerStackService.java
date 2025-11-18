package org.apache.camel.karavan.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Represents a service definition for a Docker Stack (Swarm mode).
 * * Note: Assumes you also have/create DockerVolumeDefinition and DockerHealthCheckDefinition
 * classes, which would be the stack-compatible versions of your
 * DockerComposeVolume and DockerComposeHealthCheck classes.
 */
public class DockerStackService {

    // Fields that are the same as DockerComposeService
    private String image;
    private String hostname;
    private String command;
    private List<String> ports = new ArrayList<>();
    private List<DockerConfigDefinition> configs = new ArrayList<>();
    private List<DockerVolumeDefinition> volumes = new ArrayList<>();
    private List<String> expose = new ArrayList<>();
    private List<String> depends_on = new ArrayList<>();
    private List<String> networks = new ArrayList<>();
    private Map<String,String> environment = new HashMap<>();
    private DockerHealthCheckDefinition healthcheck; // Renamed class
    private Map<String,String> labels = new HashMap<>();

    // --- Fields moved from top-level to the 'deploy' block ---
    // container_name: REMOVED (not supported in stack)
    // restart: MOVED to deploy.restart_policy
    // cpus, cpu_percent, mem_limit, mem_reservation: MOVED to deploy.resources

    /**
     * NEW: The 'deploy' block for Swarm-specific configuration
     */
    private Deploy deploy;

    public DockerStackService() {
    }

    // --- Getters and Setters for existing fields ---

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }

    public List<String> getPorts() {
        return ports;
    }

    public void setPorts(List<String> ports) {
        this.ports = ports;
    }

    public Map<Integer, Integer> getPortsMap() {
        Map<Integer, Integer> p = new HashMap<>();
        if (ports != null && !ports.isEmpty()) {
            ports.forEach(s -> {
                String[] values = s.split(":");
                p.put(Integer.parseInt(values[0]), Integer.parseInt(values[1]));
            });
        }
        return p;
    }

    public List<String> getExpose() {
        return expose;
    }

    public void setExpose(List<String> expose) {
        this.expose = expose;
    }

    public List<String> getDepends_on() {
        return depends_on;
    }

    public void setDepends_on(List<String> depends_on) {
        this.depends_on = depends_on;
    }

    public Map<String, String> getEnvironment() {
        return environment != null ? environment : new HashMap<>();
    }

    public List<String> getEnvironmentList() {
        return environment != null
                ? environment.entrySet().stream() .map(e -> e.getKey().concat("=").concat(e.getValue())).collect(Collectors.toList())
                : new ArrayList<>();
    }

    public void addEnvironment(String key, String value) {
        Map<String, String> map = getEnvironment();
        map.put(key, value);
        setEnvironment(map);
    }

    public void setEnvironment(Map<String, String> environment) {
        this.environment = environment;
    }

    public DockerHealthCheckDefinition getHealthcheck() {
        return healthcheck;
    }

    public void setHealthcheck(DockerHealthCheckDefinition healthcheck) {
        this.healthcheck = healthcheck;
    }

    public List<String> getNetworks() {
        return networks;
    }

    public void setNetworks(List<String> networks) {
        this.networks = networks;
    }

    public List<DockerConfigDefinition> getConfigs() {
        return configs;
    }

    public void setConfigs(List<DockerConfigDefinition> configs) {
        this.configs = configs;
    }

    public void addConfig(DockerConfigDefinition  config) {
        this.configs.add(config);
    }

    public List<DockerVolumeDefinition> getVolumes() {
        return volumes;
    }

    public void setVolumes(List<DockerVolumeDefinition> volumes) {
        this.volumes = volumes;
    }

    public Map<String,String> getLabels() {
        return labels;
    }

    public void setLabels(Map<String,String> labels) {
        this.labels = labels;
    }

    public void addLabel(String key, String value) {
        this.labels.put(key, value);
    }

    // --- Getter and Setter for NEW 'deploy' block ---

    public Deploy getDeploy() {
        return deploy;
    }

    public void setDeploy(Deploy deploy) {
        this.deploy = deploy;
    }

    @Override
    public String toString() {
        return "DockerStackService {" +
                "image='" + image + '\'' +
                ", ports=" + ports +
                ", networks=" + networks +
                ", expose=" + expose +
                ", depends_on='" + depends_on + '\'' +
                ", environment=" + environment +
                ", healthcheck=" + healthcheck +
                ", volumes=" + volumes +
                ", labels=" + labels +
                ", deploy=" + deploy + // Added deploy
                '}';
    }

    // --- NESTED CLASSES FOR THE 'deploy' BLOCK ---

    /**
     * Corresponds to the 'deploy' section of a stack file.
     */
    public static class Deploy {
        private Integer replicas;
        private RestartPolicy restart_policy;
        private Resources resources;
        private Map<String, String> labels; // Note: these are *container* labels, not *service* labels

        // Getters and Setters
        public Integer getReplicas() { return replicas; }
        public void setReplicas(Integer replicas) { this.replicas = replicas; }
        public RestartPolicy getRestart_policy() { return restart_policy; }
        public void setRestart_policy(RestartPolicy restart_policy) { this.restart_policy = restart_policy; }
        public Resources getResources() { return resources; }
        public void setResources(Resources resources) { this.resources = resources; }
        public Map<String, String> getLabels() { return labels; }
        public void setLabels(Map<String, String> labels) { this.labels = labels; }
    }

    /**
     * Corresponds to 'deploy.restart_policy'
     */
    public static class RestartPolicy {
        private String condition; // e.g., "on-failure", "any"
        private String delay; // e.g., "5s"
        private Integer max_attempts;
        private String window; // e.g., "120s"

        // Getters and Setters
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        public String getDelay() { return delay; }
        public void setDelay(String delay) { this.delay = delay; }
        public Integer getMax_attempts() { return max_attempts; }
        public void setMax_attempts(Integer max_attempts) { this.max_attempts = max_attempts; }
        public String getWindow() { return window; }
        public void setWindow(String window) { this.window = window; }
    }

    /**
     * Corresponds to 'deploy.resources'
     */
    public static class Resources {
        private ResourceLimit limits;
        private ResourceLimit reservations;

        // Getters and Setters
        public ResourceLimit getLimits() { return limits; }
        public void setLimits(ResourceLimit limits) { this.limits = limits; }
        public ResourceLimit getReservations() { return reservations; }
        public void setReservations(ResourceLimit reservations) { this.reservations = reservations; }
    }

    /**
     * Corresponds to 'deploy.resources.limits' and 'deploy.resources.reservations'
     */
    public static class ResourceLimit {
        private String cpus; // e.g., "0.50"
        private String memory; // e.g., "512M"

        // Getters and Setters
        public String getCpus() { return cpus; }
        public void setCpus(String cpus) { this.cpus = cpus; }
        public String getMemory() { return memory; }
        public void setMemory(String memory) { this.memory = memory; }
    }

    // You would also need to define these classes,
    // presumably by renaming/adapting them from your DockerCompose versions.
    // public static class DockerVolumeDefinition { /* ... */ }
    // public static class DockerHealthCheckDefinition { /* ... */ }
}