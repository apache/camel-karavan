package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.ArrayList;
import java.util.List;

public class ProjectStatus {
    public static final String CACHE = "project_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2, collectionImplementation = ArrayList.class)
    List<ProjectEnvStatus> statuses;
    @ProtoField(number = 3)
    Long lastUpdate;
    @ProtoField(number = 4)
    String pipeline;

    public enum Status {
        @ProtoEnumValue(number = 0, name = "DOWN")
        DOWN,
        @ProtoEnumValue(number = 1, name = "UP")
        UP
    }

    @ProtoFactory
    public ProjectStatus(String projectId, List<ProjectEnvStatus> statuses, Long lastUpdate, String pipeline) {
        this.projectId = projectId;
        this.statuses = statuses;
        this.lastUpdate = lastUpdate;
        this.pipeline = pipeline;
    }

    public ProjectStatus() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public List<ProjectEnvStatus> getStatuses() {
        return statuses;
    }

    public void setStatuses(List<ProjectEnvStatus> statuses) {
        this.statuses = statuses;
    }

    public Long getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Long lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public String getPipeline() {
        return pipeline;
    }

    public void setPipeline(String pipeline) {
        this.pipeline = pipeline;
    }
}
