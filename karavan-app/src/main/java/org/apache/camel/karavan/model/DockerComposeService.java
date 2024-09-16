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
    private String cpus;
    private String cpu_percent;
    private String mem_limit;
    private String mem_reservation;
    private List<String> ports = new ArrayList<>();
    private List<DockerComposeVolume> volumes = new ArrayList<>();
    private List<String> expose = new ArrayList<>();
    private List<String> depends_on = new ArrayList<>();
    private List<String> networks = new ArrayList<>();
    private Map<String,String> environment = new HashMap<>();
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

    public List<String> getNetworks() {
        return networks;
    }

    public void setNetworks(List<String> networks) {
        this.networks = networks;
    }

    public String getCpu_percent() {
        return cpu_percent;
    }

    public void setCpu_percent(String cpu_percent) {
        this.cpu_percent = cpu_percent;
    }

    public String getCpus() {
        return cpus;
    }

    public void setCpus(String cpus) {
        this.cpus = cpus;
    }

    public String getMem_limit() {
        return mem_limit;
    }

    public void setMem_limit(String mem_limit) {
        this.mem_limit = mem_limit;
    }

    public String getMem_reservation() {
        return mem_reservation;
    }

    public void setMem_reservation(String mem_reservation) {
        this.mem_reservation = mem_reservation;
    }

    public List<DockerComposeVolume> getVolumes() {
        return volumes;
    }

    public void setVolumes(List<DockerComposeVolume> volumes) {
        this.volumes = volumes;
    }

    @Override
    public String toString() {
        return "DockerComposeService {" +
                "container_name='" + container_name + '\'' +
                ", image='" + image + '\'' +
                ", restart='" + restart + '\'' +
                ", cpus='" + cpus + '\'' +
                ", cpu_percent='" + cpu_percent + '\'' +
                ", mem_limit='" + mem_limit + '\'' +
                ", mem_reservation='" + mem_reservation + '\'' +
                ", ports=" + ports +
                ", networks=" + networks +
                ", expose=" + expose +
                ", depends_on='" + depends_on + '\'' +
                ", environment=" + environment +
                ", healthcheck=" + healthcheck +
                ", volumes=" + volumes +
                ", environment=" + environment +
                '}';
    }

}
