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
    String reason;
    @ProtoField(number = 6)
    String deployment;
    @ProtoField(number = 7)
    String env;

    public PodStatus(String name, String deployment, String env) {
        this.name = name;
        this.phase = "";
        this.initialized = false;
        this.ready = false;
        this.reason = "";
        this.deployment = deployment;
        this.env = env;
    }

    @ProtoFactory
    public PodStatus(String name, String phase, Boolean initialized, Boolean ready, String reason, String deployment, String env) {
        this.name = name;
        this.phase = phase;
        this.initialized = initialized;
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
