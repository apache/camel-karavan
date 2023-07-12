package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class DevModeStatus {
    public static final String CACHE = "devmode_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String containerName;
    @ProtoField(number = 3)
    String containerId;
    @ProtoField(number = 4)
    Boolean codeLoaded;

    @ProtoFactory
    public DevModeStatus(String projectId, String containerName, String containerId, Boolean codeLoaded) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.containerId = containerId;
        this.codeLoaded = codeLoaded;
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

    public String getContainerId() {
        return containerId;
    }

    public void setContainerId(String containerId) {
        this.containerId = containerId;
    }

    public Boolean isCodeLoaded() {
        return codeLoaded;
    }

    public void setCodeLoaded(Boolean codeLoaded) {
        this.codeLoaded = codeLoaded;
    }
}
