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
    boolean codeLoaded;

    @ProtoFactory
    public DevModeStatus(String projectId, String containerName, boolean codeLoaded) {
        this.projectId = projectId;
        this.containerName = containerName;
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

    public boolean isCodeLoaded() {
        return codeLoaded;
    }

    public void setCodeLoaded(boolean codeLoaded) {
        this.codeLoaded = codeLoaded;
    }
}
