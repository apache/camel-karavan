package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class CamelStatus {
    public static final String CACHE = "camel_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String containerName;
    @ProtoField(number = 3)
    CamelStatusName name;
    @ProtoField(number = 4)
    String status;
    @ProtoField(number = 5)
    String env;

    @ProtoFactory
    public CamelStatus(String projectId, String containerName, CamelStatusName name, String status, String env) {
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

    public CamelStatusName getName() {
        return name;
    }

    public void setName(CamelStatusName name) {
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
