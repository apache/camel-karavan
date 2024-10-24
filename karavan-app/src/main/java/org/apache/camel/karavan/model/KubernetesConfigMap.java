package org.apache.camel.karavan.model;

import java.util.Map;

public class KubernetesConfigMap {

    private String name;
    private Map<String, String> data;

    public KubernetesConfigMap() {
    }

    public KubernetesConfigMap(String name, Map<String, String> data) {
        this.name = name;
        this.data = data;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Map<String, String> getData() {
        return data;
    }

    public void setData(Map<String, String> data) {
        this.data = data;
    }
}
