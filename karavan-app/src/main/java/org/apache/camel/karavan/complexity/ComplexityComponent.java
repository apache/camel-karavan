package org.apache.camel.karavan.complexity;

import java.util.HashMap;
import java.util.Map;

public class ComplexityComponent {

    private String id;
    private String name;
    private Map<String, String > parameters = new HashMap<>();

    public ComplexityComponent() {
    }

    public ComplexityComponent(String id, String name, Map<String, String> parameters) {
        this.id = id;
        this.name = name;
        this.parameters = parameters;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Map<String, String> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, String> parameters) {
        this.parameters = parameters;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
