package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class ProjectEnvStatus {
    @ProtoField(number = 1)
    String environment;
    @ProtoField(number = 2)
    Status status;
    @ProtoField(number = 3)
    Status contextStatus;
    @ProtoField(number = 4)
    Status consumerStatus;
    @ProtoField(number = 5)
    Status routesStatus;
    @ProtoField(number = 6)
    Status registryStatus;
    @ProtoField(number = 7)
    String contextVersion;
    @ProtoField(number = 8)
    String lastPipelineRun;
    @ProtoField(number = 9)
    String lastPipelineRunResult;
    @ProtoField(number = 10)
    Long lastPipelineRunTime;
    @ProtoField(number = 11)
    DeploymentStatus deploymentStatus;
    @ProtoField(number = 12)
    String lastPipelineRunStartTime;

    public enum Status {
        @ProtoEnumValue(number = 0, name = "DOWN")
        DOWN,
        @ProtoEnumValue(number = 1, name = "UP")
        UP,
        @ProtoEnumValue(number = 2, name = "NA")
        NA
    }

    @ProtoFactory
    public ProjectEnvStatus(String environment, Status status, Status contextStatus, Status consumerStatus, Status routesStatus, Status registryStatus, String contextVersion,
                            String lastPipelineRun, String lastPipelineRunResult, Long lastPipelineRunTime, DeploymentStatus deploymentStatus, String lastPipelineRunStartTime) {
        this.environment = environment;
        this.status = status;
        this.contextStatus = contextStatus;
        this.consumerStatus = consumerStatus;
        this.routesStatus = routesStatus;
        this.registryStatus = registryStatus;
        this.contextVersion = contextVersion;
        this.lastPipelineRun = lastPipelineRun;
        this.lastPipelineRunResult = lastPipelineRunResult;
        this.lastPipelineRunTime = lastPipelineRunTime;
        this.deploymentStatus = deploymentStatus;
        this.lastPipelineRunStartTime = lastPipelineRunStartTime;
    }

    public ProjectEnvStatus(String environment) {
        this.environment = environment;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Status getContextStatus() {
        return contextStatus;
    }

    public void setContextStatus(Status contextStatus) {
        this.contextStatus = contextStatus;
    }

    public Status getConsumerStatus() {
        return consumerStatus;
    }

    public void setConsumerStatus(Status consumerStatus) {
        this.consumerStatus = consumerStatus;
    }

    public Status getRoutesStatus() {
        return routesStatus;
    }

    public void setRoutesStatus(Status routesStatus) {
        this.routesStatus = routesStatus;
    }

    public Status getRegistryStatus() {
        return registryStatus;
    }

    public void setRegistryStatus(Status registryStatus) {
        this.registryStatus = registryStatus;
    }

    public String getLastPipelineRun() {
        return lastPipelineRun;
    }

    public void setLastPipelineRun(String lastPipelineRun) {
        this.lastPipelineRun = lastPipelineRun;
    }

    public String getLastPipelineRunResult() {
        return lastPipelineRunResult;
    }

    public void setLastPipelineRunResult(String lastPipelineRunResult) {
        this.lastPipelineRunResult = lastPipelineRunResult;
    }

    public DeploymentStatus getDeploymentStatus() {
        return deploymentStatus;
    }

    public void setDeploymentStatus(DeploymentStatus deploymentStatus) {
        this.deploymentStatus = deploymentStatus;
    }

    public String getContextVersion() {
        return contextVersion;
    }

    public void setContextVersion(String contextVersion) {
        this.contextVersion = contextVersion;
    }

    public Long getLastPipelineRunTime() {
        return lastPipelineRunTime;
    }

    public void setLastPipelineRunTime(Long lastPipelineRunTime) {
        this.lastPipelineRunTime = lastPipelineRunTime;
    }

    public String getLastPipelineRunStartTime() {
        return lastPipelineRunStartTime;
    }

    public void setLastPipelineRunStartTime(String lastPipelineRunStartTime) {
        this.lastPipelineRunStartTime = lastPipelineRunStartTime;
    }
}
