package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.ArrayList;
import java.util.List;

public class DeploymentStatus {
    @ProtoField(number = 1)
    String image;
    @ProtoField(number = 2)
    Integer replicas;
    @ProtoField(number = 3)
    Integer readyReplicas;
    @ProtoField(number = 4)
    Integer unavailableReplicas;
    @ProtoField(number = 5, collectionImplementation = ArrayList.class)
    List<PodStatus> podStatuses;


    public DeploymentStatus() {
        this.image = "";
        this.replicas = 0;
        this.readyReplicas = 0;
        this.unavailableReplicas = 0;
        this.podStatuses = new ArrayList<>(0);
    }

    @ProtoFactory
    public DeploymentStatus(String image, Integer replicas, Integer readyReplicas, Integer unavailableReplicas, List<PodStatus> podStatuses) {
        this.image = image;
        this.replicas = replicas;
        this.readyReplicas = readyReplicas;
        this.unavailableReplicas = unavailableReplicas;
        this.podStatuses = podStatuses;
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

    public Integer getUnavailableReplicas() {
        return unavailableReplicas;
    }

    public void setUnavailableReplicas(Integer unavailableReplicas) {
        this.unavailableReplicas = unavailableReplicas;
    }

    public List<PodStatus> getPodStatuses() {
        return podStatuses;
    }

    public void setPodStatuses(List<PodStatus> podStatuses) {
        this.podStatuses = podStatuses;
    }
}
