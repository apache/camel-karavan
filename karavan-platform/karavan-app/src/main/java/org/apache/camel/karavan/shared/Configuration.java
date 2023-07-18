package org.apache.camel.karavan.shared;

import java.util.List;

public class Configuration {
    private String version;
    private String infrastructure;
    private String environment;
    private List<String> environments;
    private String runtime;
    private List<String> runtimes;

    public Configuration() {
    }

    public Configuration(String version, String infrastructure, String environment, List<String> environments, String runtime, List<String> runtimes) {
        this.version = version;
        this.infrastructure = infrastructure;
        this.environment = environment;
        this.environments = environments;
        this.runtime = runtime;
        this.runtimes = runtimes;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getInfrastructure() {
        return infrastructure;
    }

    public void setInfrastructure(String infrastructure) {
        this.infrastructure = infrastructure;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public List<String> getEnvironments() {
        return environments;
    }

    public void setEnvironments(List<String> environments) {
        this.environments = environments;
    }

    public String getRuntime() {
        return runtime;
    }

    public void setRuntime(String runtime) {
        this.runtime = runtime;
    }

    public List<String> getRuntimes() {
        return runtimes;
    }

    public void setRuntimes(List<String> runtimes) {
        this.runtimes = runtimes;
    }
}
