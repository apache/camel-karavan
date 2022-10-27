package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class PodStatus {
    public static final String CACHE = "pod_statuses";
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
    @ProtoField(number = 6)
    String env;

    public PodStatus(String env) {
        this.name = "";
        this.started = false;
        this.ready = false;
        this.reason = "";
        this.deployment = "";
        this.env = "";
    }

    @ProtoFactory
    public PodStatus(String name, Boolean started, Boolean ready, String reason, String deployment, String env) {
        this.name = name;
        this.started = started;
        this.ready = ready;
        this.reason = reason;
        this.deployment = deployment;
        this.env = env;
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

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }
}
