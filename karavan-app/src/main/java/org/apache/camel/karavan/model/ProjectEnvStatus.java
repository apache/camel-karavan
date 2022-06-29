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
    String lastPipelineRun;
    @ProtoField(number = 4)
    String lastPipelineRunResult;
    @ProtoField(number = 5)
    DeploymentStatus deploymentStatus;

    public enum Status {
        @ProtoEnumValue(number = 0, name = "DOWN")
        DOWN,
        @ProtoEnumValue(number = 1, name = "UP")
        UP
    }

    @ProtoFactory
    public ProjectEnvStatus(String environment, Status status, String lastPipelineRun, String lastPipelineRunResult, DeploymentStatus deploymentStatus) {
        this.environment = environment;
        this.status = status;
        this.lastPipelineRun = lastPipelineRun;
        this.lastPipelineRunResult = lastPipelineRunResult;
        this.deploymentStatus = deploymentStatus;
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
}
