package org.apache.camel.karavan.docker.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DockerComposeService {

    private String container_name;
    private String image;
    private String restart;
    private List<String> ports;
    private List<String> expose;
    private List<String> depends_on;
    private Map<String,String> environment;
    private HealthCheckConfig healthcheck;

    public DockerComposeService() {
    }

    public String getContainer_name() {
        return container_name;
    }

    public void setContainer_name(String container_name) {
        this.container_name = container_name;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getRestart() {
        return restart;
    }

    public void setRestart(String restart) {
        this.restart = restart;
    }

    public List<String> getPorts() {
        return ports;
    }

    public void setPorts(List<String> ports) {
        this.ports = ports;
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

    public HealthCheckConfig getHealthcheck() {
        return healthcheck;
    }

    public void setHealthcheck(HealthCheckConfig healthcheck) {
        this.healthcheck = healthcheck;
    }

    @Override
    public String toString() {
        return "DockerComposeService {" +
                "container_name='" + container_name + '\'' +
                ", image='" + image + '\'' +
                ", restart='" + restart + '\'' +
                ", ports=" + ports +
                ", expose=" + expose +
                ", depends_on='" + depends_on + '\'' +
                ", environment=" + environment +
                ", healthcheck=" + healthcheck +
                '}';
    }
}
