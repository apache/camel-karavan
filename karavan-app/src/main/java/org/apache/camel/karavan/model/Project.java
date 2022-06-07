package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class Project {
    public static final String CACHE = "projects";

    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String version;
    @ProtoField(number = 3)
    String folder;
    @ProtoField(number = 4)
    ProjectType type;
    @ProtoField(number = 5)
    String lastCommit;

    public enum ProjectType {
        @ProtoEnumValue(number = 0, name = "Karavan")
        KARAVAN,
        @ProtoEnumValue(number = 1, name = "Quarkus")
        QUARKUS,
        @ProtoEnumValue(number = 2, name = "Spring")
        SPRING
    }

    @ProtoFactory
    public Project(String name, String version, String folder, ProjectType type, String lastCommit) {
        this.name = name;
        this.version = version;
        this.folder = folder;
        this.type = type;
        this.lastCommit = lastCommit;
    }

    public Project(String name, String version, String folder, ProjectType type) {
        this.name = name;
        this.version = version;
        this.folder = folder;
        this.type = type;
    }

    public Project() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public ProjectType getType() {
        return type;
    }

    public void setType(ProjectType type) {
        this.type = type;
    }

    public String getLastCommit() {
        return lastCommit;
    }

    public void setLastCommit(String lastCommit) {
        this.lastCommit = lastCommit;
    }
}
