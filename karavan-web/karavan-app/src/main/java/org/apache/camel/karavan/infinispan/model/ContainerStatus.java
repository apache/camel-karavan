package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ContainerStatus {

    public enum State {
        created,
        running,
        restarting,
        paused,
        exited,
        dead
    }

    public enum ContainerType {
        @ProtoEnumValue(number = 0, name = "internal") internal,
        @ProtoEnumValue(number = 1, name = "devmode") devmode,
        @ProtoEnumValue(number = 2, name = "devservice") devservice,
        @ProtoEnumValue(number = 4, name = "project") project,
        @ProtoEnumValue(number = 5, name = "build") build,
        @ProtoEnumValue(number = 6, name = "unknown") unknown,
    }

    public enum Command {
        @ProtoEnumValue(number = 0, name = "run") run,
        @ProtoEnumValue(number = 1, name = "pause") pause,
        @ProtoEnumValue(number = 2, name = "stop") stop,
        @ProtoEnumValue(number = 3, name = "delete") delete,
    }

    public static final String CACHE = "container_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String containerName;
    @ProtoField(number = 3)
    String containerId;
    @ProtoField(number = 4)
    String image;
    @ProtoField(number = 5, collectionImplementation = ArrayList.class)
    List<Integer> ports;
    @ProtoField(number = 6)
    String env;
    @ProtoField(number = 7)
    ContainerType type;
    @ProtoField(number = 8)
    String memoryInfo;
    @ProtoField(number = 9)
    String cpuInfo;
    @ProtoField(number = 10)
    String created;
    @ProtoField(number = 11)
    String finished;
    @ProtoField(number = 12)
    List<Command> commands;
    @ProtoField(number = 13)
    String state;
    @ProtoField(number = 14)
    String phase;
    @ProtoField(number = 15)
    Boolean codeLoaded;
    @ProtoField(number = 16)
    Boolean inTransit = false;
    @ProtoField(number = 17)
    String initDate;

    @ProtoFactory
    public ContainerStatus(String projectId, String containerName, String containerId, String image, List<Integer> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, String phase, Boolean codeLoaded, Boolean inTransit, String initDate) {
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

    public ContainerStatus(String projectId, String containerName, String containerId, String image, List<Integer> ports, String env, ContainerType type, String memoryInfo, String cpuInfo, String created, String finished, List<Command> commands, String state, Boolean codeLoaded, Boolean inTransit) {
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
        return new ContainerStatus(projectId, projectId, null, null, null, env, ContainerType.devmode, null, null, null, null, List.of(Command.run), null, false, false);
    }

    public static ContainerStatus createByType(String name, String env, ContainerType type) {
        return new ContainerStatus(name, name, null, null, null, env, type, null, null, null, null, List.of(Command.run), null, false, false);
    }

    public static ContainerStatus createWithId(String projectId, String containerName, String env, String containerId, String image, List<Integer> ports, ContainerType type, List<Command> commands, String status, String created) {
        return new ContainerStatus(projectId, containerName, containerId, image, ports, env, type,
                null, null, created, null,  commands, status, false, false);
    }

    public ContainerStatus() {
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

    public List<Integer> getPorts() {
        return ports;
    }

    public void setPorts(List<Integer> ports) {
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
                ", status='" + phase + '\'' +
                ", codeLoaded=" + codeLoaded +
                ", inTransit=" + inTransit +
                ", initDate='" + initDate + '\'' +
                '}';
    }
}
