package org.apache.camel.karavan.model;

import com.google.common.base.CaseFormat;
import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class Project {
    public static final String CACHE = "projects";

    @ProtoField(number = 1)
    String groupId;
    @ProtoField(number = 2)
    String artifactId;
    @ProtoField(number = 3)
    String version;
    @ProtoField(number = 4)
    String folder;
    @ProtoField(number = 5)
    Project.CamelRuntime runtime;
    @ProtoField(number = 6)
    String lastCommit;

    public enum CamelRuntime {
        @ProtoEnumValue(number = 0, name = "Quarkus")
        QUARKUS,
        @ProtoEnumValue(number = 1, name = "Spring")
        SPRING
    }

    @ProtoFactory
    public Project(String groupId, String artifactId, String version, String folder, CamelRuntime runtime, String lastCommit) {
        this.groupId = groupId;
        this.artifactId = artifactId;
        this.version = version;
        this.folder = folder;
        this.runtime = runtime;
        this.lastCommit = lastCommit;
    }

    public Project(String groupId, String artifactId, String version, String folder, CamelRuntime runtime) {
        this.groupId = groupId;
        this.artifactId = artifactId;
        this.version = version;
        this.folder = folder != null && folder.trim().length() > 0 ? folder : toFolder(artifactId, version);
        this.runtime = runtime;
    }

    public static String toFolder(String artifactId, String version){
        String folder = (artifactId+version).replaceAll("[^A-Za-z0-9 ]", "_");
        return CaseFormat.UPPER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, folder);
    }

    public static String toKey(String groupId, String artifactId, String version){
        return groupId + ":" + artifactId + ":" + version;
    }

    public String getKey(){
        return toKey(groupId, artifactId, version);
    }

    public Project() {
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public void setArtifactId(String artifactId) {
        this.artifactId = artifactId;
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

    public CamelRuntime getRuntime() {
        return runtime;
    }

    public void setRuntime(CamelRuntime runtime) {
        this.runtime = runtime;
    }

    public String getLastCommit() {
        return lastCommit;
    }

    public void setLastCommit(String lastCommit) {
        this.lastCommit = lastCommit;
    }
}
