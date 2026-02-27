package org.apache.camel.karavan.model;

import java.time.Instant;

public class ActivityUser {

    public enum ActivityType{
        HEARTBEAT, WORKING
    }

    private String userName;
    private ActivityType type;
    private Long timeStamp;

    public ActivityUser() {
    }

    public ActivityUser(String userName) {
        this.userName = userName;
        this.type = ActivityType.HEARTBEAT;
        this.timeStamp = Instant.now().getEpochSecond() * 1000L;
    }

    public ActivityUser(String userName, ActivityType type) {
        this.userName = userName;
        this.type = type;
        this.timeStamp = Instant.now().getEpochSecond() * 1000L;
    }

    public ActivityUser(String userName, ActivityType type, Long timeStamp) {
        this.userName = userName;
        this.type = type;
        this.timeStamp = timeStamp;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public ActivityType getType() {
        return type;
    }

    public void setType(ActivityType type) {
        this.type = type;
    }

    public Long getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(Long timeStamp) {
        this.timeStamp = timeStamp;
    }
}
