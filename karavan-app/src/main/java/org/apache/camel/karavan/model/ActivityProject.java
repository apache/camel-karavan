package org.apache.camel.karavan.model;

import java.time.Instant;

public class ActivityProject {

    private String userName;
    private String projectId;
    private Instant timeStamp;
    private ActivityCommand command;

    public ActivityProject() {
    }

    public static ActivityProject createAdd(String userName, String projectId) {
        return new ActivityProject(userName, projectId, Instant.now(), ActivityCommand.ADD);
    }

    public static ActivityProject createDelete() {
        return new ActivityProject(null, null, Instant.now(), ActivityCommand.DELETE);
    }

    public ActivityProject(String userName, String projectId, Instant timeStamp, ActivityCommand command) {
        this.userName = userName;
        this.projectId = projectId;
        this.timeStamp = timeStamp;
        this.command = command;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Instant getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(Instant timeStamp) {
        this.timeStamp = timeStamp;
    }

    public ActivityCommand getCommand() {
        return command;
    }

    public void setCommand(ActivityCommand command) {
        this.command = command;
    }
}
