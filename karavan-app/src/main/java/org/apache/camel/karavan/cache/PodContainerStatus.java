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

package org.apache.camel.karavan.cache;

import org.infinispan.api.annotations.indexing.Embedded;
import org.infinispan.api.annotations.indexing.Indexed;
import org.infinispan.api.annotations.indexing.Keyword;
import org.infinispan.api.annotations.indexing.Text;
import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Indexed
public class PodContainerStatus {

    @Indexed
    public enum State {
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 0, name = "created")
        created,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 1, name = "running")
        running,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 2, name = "restarting")
        restarting,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 3, name = "paused")
        paused,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 4, name = "exited")
        exited,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 5, name = "dead")
        dead
    }

    @Indexed
    public enum Command {
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 0, name = "run")
        run,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 1, name = "pause")
        pause,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 2, name = "stop")
        stop,
        @Keyword(projectable = true, sortable = true)
        @ProtoEnumValue(number = 3, name = "delete")
        delete,
    }

    @Keyword(projectable = true, sortable = true)
    @ProtoField(1)
    String projectId;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(2)
    String containerName;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(3)
    String containerId;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(4)
    String image;
    @Embedded
    @ProtoField(value = 5, collectionImplementation = ArrayList.class)
    List<ContainerPort> ports;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(6)
    String env;
    @Embedded
    @ProtoField(7)
    ContainerType type;
    @Text
    @ProtoField(8)
    String memoryInfo;
    @Text
    @ProtoField(9)
    String cpuInfo;
    @ProtoField(10)
    String created;
    @ProtoField(11)
    String finished;
    @Embedded
    @ProtoField(value = 12, collectionImplementation =  ArrayList.class)
    List<Command> commands;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(13)
    String state;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(14)
    String phase;
    @ProtoField(15)
    Boolean codeLoaded;
    @ProtoField(16)
    Boolean inTransit = false;
    @ProtoField(17)
    String initDate;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(18)
    String podIP;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(19)
    String camelRuntime;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(20)
    String commit;
    @ProtoField(value = 21, mapImplementation = HashMap.class)
    Map<String, String> labels;

    @ProtoFactory
    public PodContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, String phase, Boolean codeLoaded, Boolean inTransit, String initDate, String podIP, String camelRuntime, String commit, Map<String, String> labels) {
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
        this.commit = commit;
        this.labels = labels;
    }

    public PodContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, String phase, Boolean codeLoaded, Boolean inTransit, String initDate, String podIP, String camelRuntime) {
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

    public PodContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, String phase, Boolean codeLoaded, Boolean inTransit, String initDate, Map<String, String> labels) {
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
        this.labels = labels;
    }

    public PodContainerStatus(String projectId, String containerName, String containerId, String image, List<ContainerPort> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, Boolean codeLoaded, Boolean inTransit, String camelRuntime, Map<String, String> labels) {
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
        this.labels = labels;
    }

    public PodContainerStatus(String containerName, List<Command> commands, String projectId, String env, ContainerType type, String memoryInfo, String cpuInfo, String created) {
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

    public PodContainerStatus(String containerName, List<Command> commands, String projectId, String env, ContainerType type, String created) {
        this.containerName = containerName;
        this.commands = commands;
        this.projectId = projectId;
        this.env = env;
        this.created = created;
        this.type = type;
        this.initDate = Instant.now().toString();
    }

    public static PodContainerStatus createDevMode(String projectId, String env) {
        return new PodContainerStatus(projectId, projectId, null, null, null, env, ContainerType.devmode, null, null, null, null, List.of(Command.run), null, false, false, "", new HashMap<>());
    }

    public static PodContainerStatus createBuildMode(String projectId, String env) {
        return new PodContainerStatus(projectId, projectId, null, null, null, env, ContainerType.build, null, null, null, null, List.of(Command.run), null, false, false, "", new HashMap<>());
    }

    public static PodContainerStatus createByType(String name, String env, ContainerType type) {
        return new PodContainerStatus(name, name, null, null, null, env, type, null, null, null, null, List.of(Command.run), null, false, false, "", new HashMap<>());
    }

    public static PodContainerStatus createWithId(String projectId, String containerName, String env, String containerId, String image, List<ContainerPort> ports, ContainerType type, List<Command> commands, String status, String created, String camelRuntime, Map<String, String> labels) {
        return new PodContainerStatus(projectId, containerName, containerId, image, ports, env, type,
                null, null, created, null,  commands, status, false, false, camelRuntime, labels);
    }

    public PodContainerStatus() {
    }

    public PodContainerStatus copy() {
        return new PodContainerStatus(
                projectId, containerName, containerId, image, ports, env, type, memoryInfo, cpuInfo, created, finished, commands, state, phase, codeLoaded, inTransit, initDate, podIP, camelRuntime, commit, labels
        );
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

    public String getCommit() {
        return commit;
    }

    public void setCommit(String commit) {
        this.commit = commit;
    }

    public Map<String, String> getLabels() {
        return labels;
    }

    public void setLabels(Map<String, String> labels) {
        this.labels = labels;
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
                ", commit='" + commit + '\'' +
                ", labels='" + labels + '\'' +
                '}';
    }
}
