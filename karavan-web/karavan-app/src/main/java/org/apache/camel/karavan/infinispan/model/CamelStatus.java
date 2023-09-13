package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.ArrayList;
import java.util.List;

public class CamelStatus {

    public static final String CACHE = "camel_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String containerName;
    @ProtoField(number = 3, collectionImplementation = ArrayList.class)
    List<CamelStatusValue> statuses;
    @ProtoField(number = 4)
    String env;

    @ProtoFactory
    public CamelStatus(String projectId, String containerName, List<CamelStatusValue> statuses, String env) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.statuses = statuses;
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

    public List<CamelStatusValue> getStatuses() {
        return statuses;
    }

    public void setStatuses(List<CamelStatusValue> statuses) {
        this.statuses = statuses;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }
}
