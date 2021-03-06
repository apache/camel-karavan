package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoDoc;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class ProjectFile {
    public static final String CACHE = "project_files";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String code;
    @ProtoField(number = 3)
    @ProtoDoc("@Field(index=Index.YES, analyze = Analyze.YES, store = Store.NO)")
    String projectId;

    @ProtoFactory
    public ProjectFile(String name, String code, String projectId) {
        this.name = name;
        this.code = code;
        this.projectId = projectId;
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
}
