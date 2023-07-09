package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class DevModeCommand {

    public static final String CACHE = "devmode_commands";
    @ProtoField(number = 1)
    CommandName commandName;
    @ProtoField(number = 2)
    String projectId;
    @ProtoField(number = 3)
    Long time;

    @ProtoFactory
    public DevModeCommand(CommandName commandName, String projectId, Long time) {
        this.commandName = commandName;
        this.projectId = projectId;
        this.time = time;
    }

    public DevModeCommand(CommandName commandName, Long time) {
        this.commandName = commandName;
        this.time = time;
    }

    public DevModeCommand() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public CommandName getCommandName() {
        return commandName;
    }

    public void setCommandName(CommandName commandName) {
        this.commandName = commandName;
    }

    public Long getTime() {
        return time;
    }

    public void setTime(Long time) {
        this.time = time;
    }
}
