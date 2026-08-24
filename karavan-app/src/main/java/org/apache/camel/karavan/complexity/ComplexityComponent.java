package org.apache.camel.karavan.complexity;

import io.vertx.core.json.JsonObject;

import java.util.HashMap;
import java.util.Map;

public class ComplexityComponent {

    private String id;
    private String name;
    private boolean remote;
    private Map<String, String > parameters = new HashMap<>();

    public ComplexityComponent() {
    }

    public ComplexityComponent(String id, String name, boolean remote, Map<String, String> parameters) {
        this.id = id;
        this.name = name;
        this.remote = remote;
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

    public boolean isRemote() {
        return remote;
    }

    public void setRemote(boolean remote) {
        this.remote = remote;
    }

    public ComplexityComponent copy() {
        var json = JsonObject.mapFrom(this).encode();
        return new JsonObject(json).mapTo(ComplexityComponent.class);
    }
}
