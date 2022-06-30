package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class PodStatus {
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    Boolean started;
    @ProtoField(number = 3)
    Boolean ready;
    @ProtoField(number = 4)
    String reason;
    @ProtoField(number = 5)
    String deployment;

    public PodStatus() {
        this.name = "";
        this.started = false;
        this.ready = false;
        this.reason = "";
        this.deployment = "";
    }

    @ProtoFactory
    public PodStatus(String name, Boolean started, Boolean ready, String reason, String deployment) {
        this.name = name;
        this.started = started;
        this.ready = ready;
        this.reason = reason;
        this.deployment = deployment;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getStarted() {
        return started;
    }

    public void setStarted(Boolean started) {
        this.started = started;
    }

    public Boolean getReady() {
        return ready;
    }

    public void setReady(Boolean ready) {
        this.ready = ready;
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
}
