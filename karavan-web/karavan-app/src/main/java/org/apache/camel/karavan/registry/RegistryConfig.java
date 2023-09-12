package org.apache.camel.karavan.registry;

public class RegistryConfig {
    private String registry;
    private String group;
    private String username;
    private String password;

    public RegistryConfig() {
    }

    public RegistryConfig(String registry, String group, String username, String password) {
        this.registry = registry;
        this.group = group;
        this.username = username;
        this.password = password;
    }

    public String getRegistry() {
        return registry;
    }

    public String getGroup() {
        return group;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }
}
