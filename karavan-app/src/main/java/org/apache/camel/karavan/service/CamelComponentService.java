package org.apache.camel.karavan.service;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.*;

@ApplicationScoped
public class CamelComponentService {

    private static final Logger LOGGER = Logger.getLogger(CamelComponentService.class.getName());

    @Inject
    CodeService codeService;

    private static JsonArray components;

    private JsonArray getComponents() {
        if (components == null) {
            var json = codeService.getResourceFile("/metadata/components-full.json");
            components = new JsonArray(json);
        }
        return components;
    }

    public boolean isComponentRemote(String name) {
        try {
            var comps = getComponents();
            var comp = comps.stream().filter(o -> ((JsonObject) o).getJsonObject("component").getString("name").equals(name)).findFirst().orElse(JsonObject.of());
            if (comp instanceof JsonObject) {
                var component = ((JsonObject) comp).getJsonObject("component");
                if (component != null) {
                    return component.getBoolean("remote");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true;
    }

    public Map<String, String> getComponentDefaultParameters(String name) {
        Map<String, String> result = new HashMap<>();
        try {
            var comps = getComponents();
            var comp = comps.stream().filter(o -> ((JsonObject) o).getJsonObject("component").getString("name").equals(name)).findFirst().orElse(JsonObject.of());
            if (comp instanceof JsonObject) {
                var properties = ((JsonObject) comp).getJsonObject("properties");
                if (properties != null) {
                    for (String key : properties.fieldNames()) {
                        var prop = properties.getJsonObject(key);
                        if (Objects.equals(prop.getString("kind"), "path") || Objects.equals(prop.getBoolean("required"), true)) {
                            result.put(key, prop.getString("defaultValue"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }
}