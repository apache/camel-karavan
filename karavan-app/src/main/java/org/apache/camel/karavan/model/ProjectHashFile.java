package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoDoc;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;

public class ProjectHashFile {
    public static final String CACHE = "project_hash_files";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String hash;
    @ProtoField(number = 3)
    @ProtoDoc("@Field(index=Index.YES, analyze = Analyze.YES, store = Store.NO)")
    String projectId;
    @ProtoField(number = 4)
    Long lastUpdate;

    @ProtoFactory
    public ProjectHashFile(String name, String hash, String projectId, Long lastUpdate) {
        this.name = name;
        this.hash = hash;
        this.projectId = projectId;
        this.lastUpdate = lastUpdate;
    }

    public ProjectHashFile() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return hash;
    }

    public void setCode(String hash) {
        this.hash = hash;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Long getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Long lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    @Override
    public String toString() {
        return "ProjectFile{" +
                "name='" + name + '\'' +
                ", code='" + hash + '\'' +
                ", projectId='" + projectId + '\'' +
                ", lastUpdate=" + lastUpdate +
                '}';
    }
}
