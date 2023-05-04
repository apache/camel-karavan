package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class PodStatus {
    public static final String CACHE = "pod_statuses";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String phase;
    @ProtoField(number = 3)
    Boolean initialized;
    @ProtoField(number = 4)
    Boolean ready;
    @ProtoField(number = 5)
    Boolean terminating;
    @ProtoField(number = 6)
    String reason;
    @ProtoField(number = 7)
    String deployment;
    @ProtoField(number = 8)
    String project;
    @ProtoField(number = 9)
    String env;
    @ProtoField(number = 10)
    Boolean runner;
    @ProtoField(number = 11)
    String requestMemory;
    @ProtoField(number = 12)
    String requestCpu;
    @ProtoField(number = 13)
    String limitMemory;
    @ProtoField(number = 14)
    String limitCpu;
    @ProtoField(number = 15)
    String creationTimestamp;

    public PodStatus(String name, String project, String env) {
        this.name = name;
        this.phase = "";
        this.initialized = false;
        this.ready = false;
        this.terminating = false;
        this.reason = "";
        this.project = project;
        this.env = env;
    }

    @ProtoFactory
    public PodStatus(String name, String phase, Boolean initialized, Boolean ready, Boolean terminating, String reason, String deployment, String project, String env, Boolean runner, String requestMemory, String requestCpu, String limitMemory, String limitCpu, String creationTimestamp) {
        this.name = name;
        this.phase = phase;
        this.initialized = initialized;
        this.ready = ready;
        this.terminating = terminating;
        this.reason = reason;
        this.deployment = deployment;
        this.project = project;
        this.env = env;
        this.runner = runner;
        this.requestMemory = requestMemory;
        this.requestCpu = requestCpu;
        this.limitMemory = limitMemory;
        this.limitCpu = limitCpu;
        this.creationTimestamp = creationTimestamp;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }

    public Boolean getInitialized() {
        return initialized;
    }

    public void setInitialized(Boolean initialized) {
        this.initialized = initialized;
    }

    public Boolean getReady() {
        return ready;
    }

    public void setReady(Boolean ready) {
        this.ready = ready;
    }

    public Boolean getTerminating() {
        return terminating;
    }

    public void setTerminating(Boolean terminating) {
        this.terminating = terminating;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDeployment() {
        return deployment;
    }

    public void setDeployment(String deployment) {
        this.deployment = deployment;
    }

    public String getProject() {
        return project;
    }

    public void setProject(String project) {
        this.project = project;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public Boolean getRunner() {
        return runner;
    }

    public void setRunner(Boolean runner) {
        this.runner = runner;
    }

    public String getRequestMemory() {
        return requestMemory;
    }

    public void setRequestMemory(String requestMemory) {
        this.requestMemory = requestMemory;
    }

    public String getRequestCpu() {
        return requestCpu;
    }

    public void setRequestCpu(String requestCpu) {
        this.requestCpu = requestCpu;
    }

    public String getLimitMemory() {
        return limitMemory;
    }

    public void setLimitMemory(String limitMemory) {
        this.limitMemory = limitMemory;
    }

    public String getLimitCpu() {
        return limitCpu;
    }

    public void setLimitCpu(String limitCpu) {
        this.limitCpu = limitCpu;
    }

    public String getCreationTimestamp() {
        return creationTimestamp;
    }

    public void setCreationTimestamp(String creationTimestamp) {
        this.creationTimestamp = creationTimestamp;
    }
}
