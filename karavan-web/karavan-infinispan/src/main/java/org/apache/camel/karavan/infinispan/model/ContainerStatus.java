package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.ArrayList;
import java.util.List;

public class ContainerStatus {

    public enum CType {
        @ProtoEnumValue(number = 0, name = "internal") internal,
        @ProtoEnumValue(number = 1, name = "devmode") devmode,
        @ProtoEnumValue(number = 2, name = "devservice") devservice,
        @ProtoEnumValue(number = 4, name = "project") project,
        @ProtoEnumValue(number = 5, name = "unknown") unknown,
    }

    public enum Lifecycle {
        @ProtoEnumValue(number = 0, name = "init") init,
        @ProtoEnumValue(number = 1, name = "ready") ready,
        @ProtoEnumValue(number = 2, name = "deleting") deleting,
    }

    public static final String CACHE = "container_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String containerName;
    @ProtoField(number = 3)
    String containerId;
    @ProtoField(number = 4)
    String image;
    @ProtoField(number = 5, collectionImplementation = ArrayList.class)
    List<Integer> ports;
    @ProtoField(number = 6)
    String env;
    @ProtoField(number = 7)
    CType type;
    @ProtoField(number = 8)
    String memoryInfo;
    @ProtoField(number = 9)
    String cpuInfo;
    @ProtoField(number = 10)
    String created;
    @ProtoField(number = 11)
    Lifecycle lifeCycle;
    @ProtoField(number = 12)
    Boolean codeLoaded;
    @ProtoField(number = 13)
    Boolean logging;

    @ProtoFactory
    public ContainerStatus(String projectId, String containerName, String containerId, String image, List<Integer> ports, String env, CType type, String memoryInfo, String cpuInfo, String created, Lifecycle lifeCycle, Boolean codeLoaded, Boolean logging) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.containerId = containerId;
        this.image = image;
        this.ports = ports;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
        this.lifeCycle = lifeCycle;
        this.codeLoaded = codeLoaded;
        this.logging = logging;
    }

    public ContainerStatus(String containerName, Lifecycle lifeCycle, String projectId, String env, CType type, String memoryInfo, String cpuInfo, String created) {
        this.containerName = containerName;
        this.lifeCycle = lifeCycle;
        this.projectId = projectId;
        this.env = env;
        this.type = type;
        this.memoryInfo = memoryInfo;
        this.cpuInfo = cpuInfo;
        this.created = created;
    }

    public ContainerStatus(String containerName, Lifecycle lifeCycle, String projectId, String env, CType type, String created) {
        this.containerName = containerName;
        this.lifeCycle = lifeCycle;
        this.projectId = projectId;
        this.env = env;
        this.created = created;
        this.type = type;
    }

    public static ContainerStatus createDevMode(String projectId, String env) {
        return new ContainerStatus(projectId, projectId, null, null, null, env, CType.devmode, null, null, null,  Lifecycle.init, false, false);
    }

    public static ContainerStatus createWithId(String name, String env, String containerId, String image, List<Integer> ports, CType type, Lifecycle lifeCycle, String created) {
        return new ContainerStatus(name, name, containerId, image, ports, env, type,
                null, null, created,  lifeCycle, false, false);
    }

    public ContainerStatus() {
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<Integer> getPorts() {
        return ports;
    }

    public void setPorts(List<Integer> ports) {
        this.ports = ports;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public CType getType() {
        return type;
    }

    public void setType(CType type) {
        this.type = type;
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

    public Lifecycle getLifeCycle() {
        return lifeCycle;
    }

    public void setLifeCycle(Lifecycle lifeCycle) {
        this.lifeCycle = lifeCycle;
    }

    public Boolean getCodeLoaded() {
        return codeLoaded;
    }

    public void setCodeLoaded(Boolean codeLoaded) {
        this.codeLoaded = codeLoaded;
    }

    public Boolean getLogging() {
        return logging;
    }

    public void setLogging(Boolean logging) {
        this.logging = logging;
    }
}
