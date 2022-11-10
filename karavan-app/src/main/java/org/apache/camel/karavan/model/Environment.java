package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class Environment {
    public static final String CACHE = "environments";

    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    String cluster;
    @ProtoField(number = 3)
    String namespace;

    @ProtoFactory
    public Environment(String name, String cluster, String namespace) {
        this.name = name;
        this.cluster = cluster;
        this.namespace = namespace;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCluster() {
        return cluster;
    }

    public void setCluster(String cluster) {
        this.cluster = cluster;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }
}
