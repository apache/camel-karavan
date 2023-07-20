package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class CamelStatus {

    public enum Name {

        @ProtoEnumValue(number = 0, name = "context") context,
        @ProtoEnumValue (number = 1, name = "inflight") inflight,
        @ProtoEnumValue (number = 2, name = "memory") memory,
        @ProtoEnumValue (number = 3, name = "properties") properties,
        @ProtoEnumValue (number = 4, name = "route") route,
        @ProtoEnumValue (number = 5, name = "trace") trace,
        @ProtoEnumValue (number = 6, name = "jvm") jvm,
        @ProtoEnumValue (number = 7, name = "source") source
    }

    public static final String CACHE = "camel_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String containerName;
    @ProtoField(number = 3)
    Name name;
    @ProtoField(number = 4)
    String status;
    @ProtoField(number = 5)
    String env;

    @ProtoFactory
    public CamelStatus(String projectId, String containerName, Name name, String status, String env) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.name = name;
        this.status = status;
        this.env = env;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public Name getName() {
        return name;
    }

    public void setName(Name name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }
}
