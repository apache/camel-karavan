package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;

public class DevModeCommand {

    public static final String CACHE = "devmode_commands";
    public static final String DEVMODE_SUFFIX = "-devmode";
    @ProtoField(number = 1)
    DevModeCommandName commandName;
    @ProtoField(number = 2)
    String projectId;
    @ProtoField(number = 3)
    String containerName;
    @ProtoField(number = 4)
    DevModeCommandType type;
    @ProtoField(number = 5)
    Long time;

    @ProtoFactory
    public DevModeCommand(DevModeCommandName commandName, String projectId, String containerName, DevModeCommandType type, Long time) {
        this.commandName = commandName;
        this.projectId = projectId;
        this.containerName = containerName;
        this.type = type;
        this.time = time;
    }

    public static DevModeCommand createForProject(DevModeCommandName commandName, String projectId) {
        return new DevModeCommand(commandName, projectId, projectId + DEVMODE_SUFFIX, DevModeCommandType.DEVMODE, Instant.now().toEpochMilli());
    }

    public static DevModeCommand createForContainer(DevModeCommandName commandName, String containerName) {
        return new DevModeCommand(commandName, null, containerName, DevModeCommandType.DEVMODE, Instant.now().toEpochMilli());
    }

    public static DevModeCommand createDevServiceCommand(DevModeCommandName commandName, String serviceName) {
        return new DevModeCommand(commandName, null, serviceName, DevModeCommandType.DEVSERVICE, Instant.now().toEpochMilli());
    }

    public DevModeCommandName getCommandName() {
        return commandName;
    }

    public void setCommandName(DevModeCommandName commandName) {
        this.commandName = commandName;
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

    public DevModeCommandType getType() {
        return type;
    }

    public void setType(DevModeCommandType type) {
        this.type = type;
    }

    public Long getTime() {
        return time;
    }

    public void setTime(Long time) {
        this.time = time;
    }
}
