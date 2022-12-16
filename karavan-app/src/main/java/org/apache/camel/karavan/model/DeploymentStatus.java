package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class DeploymentStatus {
    public static final String CACHE = "deployment_statuses";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String namespace;
    @ProtoField(number = 3)
    String env;
    @ProtoField(number = 4)
    String cluster;
    @ProtoField(number = 5)
    String image;
    @ProtoField(number = 6)
    Integer replicas;
    @ProtoField(number = 7)
    Integer readyReplicas;
    @ProtoField(number = 8)
    Integer unavailableReplicas;

    public DeploymentStatus(String name, String namespace, String cluster, String env) {
        this.name = name;
        this.namespace = namespace;
        this.cluster = cluster;
        this.env = env;
        this.image = "";
        this.replicas = 0;
        this.readyReplicas = 0;
        this.unavailableReplicas = 0;
    }

    @ProtoFactory
    public DeploymentStatus(String name, String namespace, String cluster, String env, String image, Integer replicas, Integer readyReplicas, Integer unavailableReplicas) {
        this.name = name;
        this.namespace = namespace;
        this.env = env;
        this.cluster = cluster;
        this.image = image;
        this.replicas = replicas;
        this.readyReplicas = readyReplicas;
        this.unavailableReplicas = unavailableReplicas;
    }

    public String getId() {
        return name + ":" + namespace + ":" + cluster;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
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

    public String getCluster() {
        return cluster;
    }

    public void setCluster(String cluster) {
        this.cluster = cluster;
    }
}
