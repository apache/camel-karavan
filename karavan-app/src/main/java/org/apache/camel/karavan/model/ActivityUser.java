package org.apache.camel.karavan.model;

import java.time.Instant;

public class ActivityUser {

    private String userName;
    private Instant timeStamp;

    public ActivityUser() {
    }

    public ActivityUser(String userName) {
        this.userName = userName;
        this.timeStamp = Instant.now();
    }

    public ActivityUser(String userName, Instant timeStamp) {
        this.userName = userName;
        this.timeStamp = timeStamp;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Instant getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(Instant timeStamp) {
        this.timeStamp = timeStamp;
    }
}
