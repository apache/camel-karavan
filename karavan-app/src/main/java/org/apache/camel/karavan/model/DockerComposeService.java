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

package org.apache.camel.karavan.model;

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
    private List<String> env_file;
    private List<String> networks;
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

    public List<String> getEnv_file() {
        return env_file;
    }

    public void setEnv_file(List<String> env_file) {
        this.env_file = env_file;
    }

    public List<String> getNetworks() {
        return networks;
    }

    public void setNetworks(List<String> networks) {
        this.networks = networks;
    }

    @Override
    public String toString() {
        return "DockerComposeService {" +
                "container_name='" + container_name + '\'' +
                ", image='" + image + '\'' +
                ", restart='" + restart + '\'' +
                ", ports=" + ports +
                ", env_file=" + env_file +
                ", networks=" + networks +
                ", expose=" + expose +
                ", depends_on='" + depends_on + '\'' +
                ", environment=" + environment +
                ", healthcheck=" + healthcheck +
                '}';
    }
}
