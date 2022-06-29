package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class DeploymentStatus {
    @ProtoField(number = 1)
    String image;
    @ProtoField(number = 2)
    Integer replicas;
    @ProtoField(number = 3)
    Integer readyReplicas;

    public DeploymentStatus() {
    }

    @ProtoFactory
    public DeploymentStatus(String image, Integer replicas, Integer readyReplicas) {
        this.image = image;
        this.replicas = replicas;
        this.readyReplicas = readyReplicas;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Integer getReplicas() {
        return replicas;
    }

    public void setReplicas(Integer replicas) {
        this.replicas = replicas;
    }

    public Integer getReadyReplicas() {
        return readyReplicas;
    }

    public void setReadyReplicas(Integer readyReplicas) {
        this.readyReplicas = readyReplicas;
    }
}
