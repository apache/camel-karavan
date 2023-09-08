package org.apache.camel.karavan.code.model;

import java.util.*;
import java.util.stream.Collectors;

public class DockerComposeService {

    private String container_name;
    private String image;
    private String restart;
    private List<String> ports;
    private List<String> expose;
    private List<String> depends_on;
    private Map<String,String> environment;
    private DockerComposeHealthCheck healthcheck;

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

    public DockerComposeHealthCheck getHealthcheck() {
        return healthcheck;
    }

    public void setHealthcheck(DockerComposeHealthCheck healthcheck) {
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
