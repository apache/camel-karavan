package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.Map;

public class ProjectStatus {
    public static final String CACHE = "project_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    Map<String, Status> statuses;
    @ProtoField(number = 3)
    long lastUpdate;

    public enum Status {
        @ProtoEnumValue(number = 0, name = "DOWN")
        DOWN,
        @ProtoEnumValue(number = 1, name = "UP")
        UP
    }

    @ProtoFactory

    public ProjectStatus(String projectId, Map<String, Status> statuses, long lastUpdate) {
        this.projectId = projectId;
        this.statuses = statuses;
        this.lastUpdate = lastUpdate;
    }

    public ProjectStatus() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Map<String, Status> getStatuses() {
        return statuses;
    }

    public void setStatuses(Map<String, Status> statuses) {
        this.statuses = statuses;
    }

    public long getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(long lastUpdate) {
        this.lastUpdate = lastUpdate;
    }
}
