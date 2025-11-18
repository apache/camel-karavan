package org.apache.camel.karavan.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents a Docker Stack file (e.g., docker-stack.yml) for Swarm mode.
 * * Assumes you have corresponding classes:
 * - DockerStackService (from the previous response)
 * - DockerNetworkDefinition (represents network definitions)
 * - DockerVolumeDefinition (represents top-level volume definitions)
 */
public class DockerStack {
    private String version;
    private Map<String, DockerStackService> services = new HashMap<>();
    private Map<String, DockerNetworkDefinition> networks = new HashMap<>();
    private Map<String, DockerVolumeDefinition> volumes = new HashMap<>(); // Added for stack files

    public DockerStack() {
    }

    public DockerStack(Map<String, DockerStackService> services) {
        this.services = services;
    }

    // Note: The static 'create' method was removed.
    // It relied on 'container_name', which is not supported in Docker Swarm.
    // You would now add a service like this:
    //   myStack.getServices().put("my-service-name", myStackServiceInstance);

    public Map<String, DockerStackService> getServices() {
        return services;
    }

    public void setServices(Map<String, DockerStackService> services) {
        this.services = services;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Map<String, DockerNetworkDefinition> getNetworks() {
        return networks;
    }

    public void setNetworks(Map<String, DockerNetworkDefinition> networks) {
        this.networks = networks;
    }

    public Map<String, DockerVolumeDefinition> getVolumes() {
        return volumes;
    }

    public void setVolumes(Map<String, DockerVolumeDefinition> volumes) {
        this.volumes = volumes;
    }

    // You would also need to define these helper classes,
    // similar to your DockerComposeNetwork class.
    //
    // public class DockerNetworkDefinition {
    //    private String driver;
    //    private boolean attachable;
    //    private Map<String, String> driver_opts;
    //    private Map<String, String> labels;
    //    // ... getters/setters ...
    // }
    //
    // public class DockerVolumeDefinition {
    //    private String driver;
    //    private Map<String, String> driver_opts;
    //    private Map<String, String> labels;
    //    // ... getters/setters ...
    // }
}