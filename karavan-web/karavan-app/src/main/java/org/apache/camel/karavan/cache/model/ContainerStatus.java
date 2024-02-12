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

package org.apache.camel.karavan.cache.model;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public class ContainerStatus implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;

    public enum State {
        created,
        running,
        restarting,
        paused,
        exited,
        dead
    }

    public enum ContainerType {
        internal,
        devmode,
        devservice,
        project,
        build,
        unknown,
    }

    public enum Command {
        run,
        pause,
        stop,
        delete,
    }

    public static final String CACHE = "container_statuses";
    String projectId;
    String containerName;
    String containerId;
    String image;
    List<ContainerPort> ports;
    String env;
    ContainerType type;
    String memoryInfo;
    String cpuInfo;
    String created;
    String finished;
    List<Command> commands;
    String state;
    String phase;
    Boolean codeLoaded;
    Boolean inTransit = false;
    String initDate;
    String podIP;
    String camelRuntime;

    public ContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, String phase, Boolean codeLoaded, Boolean inTransit, String initDate, String podIP, String camelRuntime) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.containerId = containerId;
        this.image = image;
        this.ports = ports;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
        this.finished = finished;
        this.commands = commands;
        this.state = state;
        this.phase = phase;
        this.codeLoaded = codeLoaded;
        this.inTransit = inTransit;
        this.initDate = initDate;
        this.podIP = podIP;
        this.camelRuntime = camelRuntime;
    }

    public ContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, String phase, Boolean codeLoaded, Boolean inTransit, String initDate) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.containerId = containerId;
        this.image = image;
        this.ports = ports;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
        this.finished = finished;
        this.commands = commands;
        this.state = state;
        this.phase = phase;
        this.codeLoaded = codeLoaded;
        this.inTransit = inTransit;
        this.initDate = initDate;
    }

    public ContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, Boolean codeLoaded, Boolean inTransit, String camelRuntime) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.containerId = containerId;
        this.image = image;
        this.ports = ports;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
        this.finished = finished;
        this.commands = commands;
        this.state = state;
        this.codeLoaded = codeLoaded;
        this.camelRuntime = camelRuntime;
        this.inTransit = inTransit;
        this.initDate = Instant.now().toString();
    }

    public ContainerStatus(String containerName, List<Command> commands, String projectId, String env, ContainerType type, String memoryInfo, String cpuInfo, String created) {
        this.containerName = containerName;
        this.commands = commands;
        this.projectId = projectId;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
        this.initDate = Instant.now().toString();
    }

    public ContainerStatus(String containerName, List<Command> commands, String projectId, String env, ContainerType type, String created) {
        this.containerName = containerName;
        this.commands = commands;
        this.projectId = projectId;
        this.env = env;
        this.created = created;
        this.type = type;
        this.initDate = Instant.now().toString();
    }

    public static ContainerStatus createDevMode(String projectId, String env) {
        return new ContainerStatus(projectId, projectId, null, null, null, env, ContainerType.devmode, null, null, null, null, List.of(Command.run), null, false, false, "");
    }

    public static ContainerStatus createByType(String name, String env, ContainerType type) {
        return new ContainerStatus(name, name, null, null, null, env, type, null, null, null, null, List.of(Command.run), null, false, false, "");
    }

    public static ContainerStatus createWithId(String projectId, String containerName, String env, String containerId, String image, List<ContainerPort> ports, ContainerType type, List<Command> commands, String status, String created, String camelRuntime) {
        return new ContainerStatus(projectId, containerName, containerId, image, ports, env, type,
                null, null, created, null,  commands, status, false, false, camelRuntime);
    }

    public ContainerStatus() {
    }

    public String getPodIP() {
        return podIP;
    }

    public void setPodIP(String podIP) {
        this.podIP = podIP;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public String getContainerId() {
        return containerId;
    }

    public void setContainerId(String containerId) {
        this.containerId = containerId;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<ContainerPort> getPorts() {
        return ports;
    }

    public void setPorts(List<ContainerPort> ports) {
        this.ports = ports;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public ContainerType getType() {
        return type;
    }

    public void setType(ContainerType type) {
        this.type = type;
    }

    public String getMemoryInfo() {
        return memoryInfo;
    }

    public void setMemoryInfo(String memoryInfo) {
        this.memoryInfo = memoryInfo;
    }

    public String getCpuInfo() {
        return cpuInfo;
    }

    public void setCpuInfo(String cpuInfo) {
        this.cpuInfo = cpuInfo;
    }

    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public List<Command> getCommands() {
        return commands;
    }

    public void setCommands(List<Command> commands) {
        this.commands = commands;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Boolean getCodeLoaded() {
        return codeLoaded;
    }

    public void setCodeLoaded(Boolean codeLoaded) {
        this.codeLoaded = codeLoaded;
    }

    public Boolean getInTransit() {
        return inTransit;
    }

    public void setInTransit(Boolean inTransit) {
        this.inTransit = inTransit;
    }

    public String getFinished() {
        return finished;
    }

    public void setFinished(String finished) {
        this.finished = finished;
    }

    public String getInitDate() {
        return initDate;
    }

    public void setInitDate(String initDate) {
        this.initDate = initDate;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }

    public String getCamelRuntime() {
        return camelRuntime;
    }

    public void setCamelRuntime(String camelRuntime) {
        this.camelRuntime = camelRuntime;
    }

    @Override
    public String toString() {
        return "ContainerStatus{" +
                "projectId='" + projectId + '\'' +
                ", containerName='" + containerName + '\'' +
                ", containerId='" + containerId + '\'' +
                ", image='" + image + '\'' +
                ", ports=" + ports +
                ", env='" + env + '\'' +
                ", type=" + type +
                ", memoryInfo='" + memoryInfo + '\'' +
                ", cpuInfo='" + cpuInfo + '\'' +
                ", created='" + created + '\'' +
                ", finished='" + finished + '\'' +
                ", commands=" + commands +
                ", state='" + state + '\'' +
                ", phase='" + phase + '\'' +
                ", codeLoaded=" + codeLoaded +
                ", inTransit=" + inTransit +
                ", initDate='" + initDate + '\'' +
                ", podIP='" + podIP + '\'' +
                '}';
    }
}
