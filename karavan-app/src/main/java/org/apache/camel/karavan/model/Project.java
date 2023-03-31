package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;

public class Project {
    public static final String CACHE = "projects";

    public static final String NAME_TEMPLATES = "templates";
    public static final String NAME_KAMELETS = "kamelets";
    public static final String NAME_PIPELINES = "pipelines";

    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String name;
    @ProtoField(number = 3)
    String description;
    @ProtoField(number = 4)
    String runtime;
    @ProtoField(number = 5)
    String lastCommit;
    @ProtoField(number = 6)
    Long lastCommitTimestamp;


    @ProtoFactory
    public Project(String projectId, String name, String description, String runtime, String lastCommit, Long lastCommitTimestamp) {
        this.projectId = projectId;
        this.name = name;
        this.description = description;
        this.runtime = runtime;
        this.lastCommit = lastCommit;
        this.lastCommitTimestamp = lastCommitTimestamp;
    }

    public Project(String projectId, String name, String description, String runtime) {
        this.projectId = projectId;
        this.name = name;
        this.description = description;
        this.runtime = runtime;
        this.lastCommitTimestamp = Instant.now().toEpochMilli();
    }

    public Project() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRuntime() {
        return runtime;
    }

    public void setRuntime(String runtime) {
        this.runtime = runtime;
    }

    public String getLastCommit() {
        return lastCommit;
    }

    public void setLastCommit(String lastCommit) {
        this.lastCommit = lastCommit;
    }

    public Long getLastCommitTimestamp() {
        return lastCommitTimestamp;
    }

    public void setLastCommitTimestamp(Long lastCommitTimestamp) {
        this.lastCommitTimestamp = lastCommitTimestamp;
    }
}
