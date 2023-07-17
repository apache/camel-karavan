package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class PodStatus {
    public static final String CACHE = "pod_statuses";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    Boolean ready;
    @ProtoField(number = 3)
    String deployment;
    @ProtoField(number = 4)
    String projectId;
    @ProtoField(number = 5)
    String env;
    @ProtoField(number = 6)
    Integer exposedPort;
    @ProtoField(number = 7)
    Boolean inDevMode;
    @ProtoField(number = 8)
    String memoryInfo;
    @ProtoField(number = 9)
    String cpuInfo;
    @ProtoField(number = 10)
    String created;

    @ProtoFactory
    public PodStatus(String name, Boolean ready, String deployment, String projectId, String env, Integer exposedPort, Boolean inDevMode, String memoryInfo, String cpuInfo, String created) {
        this.name = name;
        this.ready = ready;
        this.deployment = deployment;
        this.projectId = projectId;
        this.env = env;
        this.exposedPort = exposedPort;
        this.inDevMode = inDevMode;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
    }

    public PodStatus(String name, Boolean ready, String deployment, String projectId, String env, Boolean inDevMode, String memoryInfo, String cpuInfo, String created) {
        this.name = name;
        this.ready = ready;
        this.deployment = deployment;
        this.projectId = projectId;
        this.env = env;
        this.inDevMode = inDevMode;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
    }

    public PodStatus(String name, Boolean ready, String deployment, String projectId, String env, Boolean inDevMode, String created, Integer exposedPort) {
        this.name = name;
        this.ready = ready;
        this.deployment = deployment;
        this.projectId = projectId;
        this.env = env;
        this.inDevMode = inDevMode;
        this.created = created;
        this.exposedPort = exposedPort;
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

    public String getDeployment() {
        return deployment;
    }

    public void setDeployment(String deployment) {
        this.deployment = deployment;
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

    public Boolean getInDevMode() {
        return inDevMode;
    }

    public void setInDevMode(Boolean inDevMode) {
        this.inDevMode = inDevMode;
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

    public Integer getExposedPort() {
        return exposedPort;
    }

    public void setExposedPort(Integer exposedPort) {
        this.exposedPort = exposedPort;
    }
}
