package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class ProjectEnvStatus {
    @ProtoField(number = 1)
    String environment;
    @ProtoField(number = 2)
    Status status;

    public enum Status {
        @ProtoEnumValue(number = 0, name = "DOWN")
        DOWN,
        @ProtoEnumValue(number = 1, name = "UP")
        UP
    }

    @ProtoFactory
    public ProjectEnvStatus(String environment, Status status) {
        this.environment = environment;
        this.status = status;
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
}
