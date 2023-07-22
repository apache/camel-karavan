package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class ContainerStatus {

    public enum CType {
        @ProtoEnumValue(number = 0, name = "devmode") devmode,
        @ProtoEnumValue(number = 1, name = "devservice") devservice,
        @ProtoEnumValue(number = 2, name = "pod") pod,
        @ProtoEnumValue(number = 3, name = "container") container,
    }

    public static final String CACHE = "pod_statuses";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    Boolean ready;
    @ProtoField(number = 3)
    String projectId;
    @ProtoField(number = 4)
    String env;
    @ProtoField(number = 5)
    CType type;
    @ProtoField(number = 6)
    String memoryInfo;
    @ProtoField(number = 7)
    String cpuInfo;
    @ProtoField(number = 8)
    String created;

    @ProtoFactory
    public ContainerStatus(String name, Boolean ready, String projectId, String env, CType type, String memoryInfo, String cpuInfo, String created) {
        this.name = name;
        this.ready = ready;
        this.projectId = projectId;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
    }

    public ContainerStatus(String name, Boolean ready, String projectId, String env, CType type, String created) {
        this.name = name;
        this.ready = ready;
        this.projectId = projectId;
        this.env = env;
        this.created = created;
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getReady() {
        return ready;
    }

    public void setReady(Boolean ready) {
        this.ready = ready;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public String getMemoryInfo() {
        return memoryInfo;
    }

    public void setMemoryInfo(String memoryInfo) {
        this.memoryInfo = memoryInfo;
    }

    public String getCpuInfo() {
        return cpuInfo;
    }

    public void setCpuInfo(String cpuInfo) {
        this.cpuInfo = cpuInfo;
    }

    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public CType getType() {
        return type;
    }

    public void setType(CType type) {
        this.type = type;
    }
}
