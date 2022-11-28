package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoDoc;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;

public class ProjectFile {
    public static final String CACHE = "project_files";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String code;
    @ProtoField(number = 3)
    @ProtoDoc("@Field(index=Index.YES, analyze = Analyze.YES, store = Store.NO)")
    String projectId;
    @ProtoField(number = 4)
    Long lastUpdate;

    @ProtoFactory
    public ProjectFile(String name, String code, String projectId, Long lastUpdate) {
        this.name = name;
        this.code = code;
        this.projectId = projectId;
        this.lastUpdate = lastUpdate;
    }

    public ProjectFile() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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
                ", code='" + code + '\'' +
                ", projectId='" + projectId + '\'' +
                ", lastUpdate=" + lastUpdate +
                '}';
    }
}
