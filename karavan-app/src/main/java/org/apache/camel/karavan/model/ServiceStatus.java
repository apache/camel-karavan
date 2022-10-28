package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class ServiceStatus {
    public static final String CACHE = "service_statuses";
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String namespace;
    @ProtoField(number = 3)
    String env;
    @ProtoField(number = 4)
    String cluster;
    @ProtoField(number = 5)
    Integer port;
    @ProtoField(number = 6)
    Integer targetPort;
    @ProtoField(number = 7)
    String clusterIP;
    @ProtoField(number = 8)
    String type;

    @ProtoFactory
    public ServiceStatus(String name, String namespace, String env, String cluster, Integer port, Integer targetPort, String clusterIP, String type) {
        this.name = name;
        this.namespace = namespace;
        this.env = env;
        this.cluster = cluster;
        this.port = port;
        this.targetPort = targetPort;
        this.clusterIP = clusterIP;
        this.type = type;
    }

    public ServiceStatus(String name, String namespace, String cluster, String env) {
        this.name = name;
        this.namespace = namespace;
        this.env = env;
        this.cluster = cluster;
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

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public String getCluster() {
        return cluster;
    }

    public void setCluster(String cluster) {
        this.cluster = cluster;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Integer getTargetPort() {
        return targetPort;
    }

    public void setTargetPort(Integer targetPort) {
        this.targetPort = targetPort;
    }

    public String getClusterIP() {
        return clusterIP;
    }

    public void setClusterIP(String clusterIP) {
        this.clusterIP = clusterIP;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
