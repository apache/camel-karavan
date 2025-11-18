package org.apache.camel.karavan.model;

import java.time.Instant;

public class ActivityContainer {

    private String userName;
    private String containerName;
    private Instant timeStamp;

    public ActivityContainer() {
    }

    public ActivityContainer(String userName, String containerName) {
        this.userName = userName;
        this.containerName = containerName;
        this.timeStamp = Instant.now();
    }

    public ActivityContainer(String userName, String containerName, Instant timeStamp) {
        this.userName = userName;
        this.containerName = containerName;
        this.timeStamp = timeStamp;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public Instant getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(Instant timeStamp) {
        this.timeStamp = timeStamp;
    }
}
