package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.ArrayList;
import java.util.List;

public class ContainerInfo {
    public static final String CACHE = "container_infos";
    @ProtoField(number = 1)
    String containerName;
    @ProtoField(number = 2)
    String containerId;
    @ProtoField(number = 3)
    String image;
    @ProtoField(number = 4, collectionImplementation = ArrayList.class)
    List<Integer> ports;
    @ProtoField(number = 5)
    String env;

    @ProtoFactory
    public ContainerInfo(String containerName, String containerId, String image, List<Integer> ports, String env) {
        this.containerName = containerName;
        this.containerId = containerId;
        this.image = image;
        this.ports = ports;
        this.env = env;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public String getContainerId() {
        return containerId;
    }

    public void setContainerId(String containerId) {
        this.containerId = containerId;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<Integer> getPorts() {
        return ports;
    }

    public void setPorts(List<Integer> ports) {
        this.ports = ports;
    }
}
