package org.apache.camel.karavan.code.model;

import java.util.HashMap;
import java.util.Map;

public class DockerCompose {
    private Map<String, DockerComposeService> services;

    public DockerCompose() {
    }

    public DockerCompose(Map<String, DockerComposeService> services) {
        this.services = services;
    }

    public static DockerCompose create(DockerComposeService service) {
        Map<String, DockerComposeService> map = new HashMap<>();
        map.put(service.getContainer_name(), service);
        return new DockerCompose(map);
    }

    public Map<String, DockerComposeService> getServices() {
        return services;
    }

    public void setServices(Map<String, DockerComposeService> services) {
        this.services = services;
    }
}
