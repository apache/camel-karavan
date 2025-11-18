package org.apache.camel.karavan.docker;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.model.DockerStack;
import org.apache.camel.karavan.model.DockerStackService;
import org.apache.camel.karavan.model.DockerVolumeDefinition;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.introspector.Property;
import org.yaml.snakeyaml.nodes.*;
import org.yaml.snakeyaml.representer.Representer;

import java.util.Map;

import static com.github.dockerjava.api.model.MountType.BIND;
import static com.github.dockerjava.api.model.MountType.VOLUME;

/**
 * Utility class to convert docker-stack.yaml <-> DockerStack model.
 * Handles short syntax for environment, labels, and volumes.
 */
public class DockerStackConverter {

    private static final String ENVIRONMENT = "environment";
    private static final String LABELS = "labels";
    private static final String VOLUMES = "volumes";

    public static DockerStack fromCode(String code) {
        Yaml yaml = new Yaml();
        Map<String, Object> obj = yaml.load(code);
        JsonObject json = JsonObject.mapFrom(obj);
        JsonObject services = json.getJsonObject("services");
        JsonObject stackServices = new JsonObject();

        if (services != null) {
            services.getMap().forEach((name, value) -> {
                JsonObject serviceJson = services.getJsonObject(name);
                DockerStackService service = convertToDockerStackService(name, serviceJson);
                stackServices.put(name, service);
            });
        }
        json.put("services", stackServices);
        return json.mapTo(DockerStack.class);
    }

    public static DockerStackService fromCode(String code, String serviceName) {
        DockerStack stack = fromCode(code);
        return stack.getServices().get(serviceName);
    }

    public static String toCode(DockerStack stack) {
        Yaml yaml = new Yaml(new StackRepresenter());
        return yaml.dumpAs(stack, Tag.MAP, DumperOptions.FlowStyle.BLOCK);
    }

    /**
     * Converts a single service to YAML.
     * @param service The service object
     * @param serviceName The name (key) for the service (e.g., "my-app")
     * @return A YAML string
     */
    public static String toCode(DockerStackService service, String serviceName) {
        DockerStack ds = new DockerStack();
        ds.getServices().put(serviceName, service);
        return toCode(ds);
    }

    private static DockerStackService convertToDockerStackService(String name, JsonObject service) {
        // This logic is identical for docker-compose and docker-stack
        if (service.containsKey(ENVIRONMENT) && service.getValue(ENVIRONMENT) instanceof JsonArray) {
            JsonObject env = new JsonObject();
            service.getJsonArray(ENVIRONMENT).forEach(o -> {
                String[] kv = o.toString().split("=", 2); // Split only on the first =
                if (kv.length == 2) {
                    env.put(kv[0], kv[1]);
                }
            });
            service.put(ENVIRONMENT, env);
        }

        // This logic is identical for docker-compose and docker-stack
        if (service.containsKey(LABELS) && service.getValue(LABELS) instanceof JsonArray) {
            JsonObject labels = new JsonObject();
            service.getJsonArray(LABELS).forEach(o -> {
                String[] kv = o.toString().split("=", 2); // Split only on the first =
                if (kv.length == 2) {
                    labels.put(kv[0], kv[1]);
                }
            });
            service.put(LABELS, labels);
        }

        // This logic is identical for docker-compose and docker-stack
        // It converts short syntax volumes to the long syntax (type, source, target)
        if (service.containsKey(VOLUMES) && service.getValue(VOLUMES) instanceof JsonArray) {
            JsonArray volumes = new JsonArray();
            JsonArray yamlVolumes = service.getJsonArray(VOLUMES);
            yamlVolumes.forEach(o -> {
                if (o instanceof JsonObject) {
                    volumes.add(o);
                } else if (o instanceof String) {
                    var parts = ((String) o).split(":");
                    if (parts.length == 2) {
                        var part0 = parts[0];
                        // Guess type: if it looks like a path, it's a bind mount.
                        var type = (part0.startsWith("/") || part0.startsWith("~") || part0.startsWith("./")) ? BIND : VOLUME;
                        volumes.add(JsonObject.mapFrom(new DockerVolumeDefinition(type.name().toLowerCase(), parts[0], parts[1])));
                    } else if (parts.length == 1) {
                        // Anonymous volume
                        volumes.add(JsonObject.mapFrom(new DockerVolumeDefinition(VOLUME.name().toLowerCase(), null, parts[0])));
                    }
                }
            });
            service.put(VOLUMES, volumes);
        }

        // Map to the DockerStackService class
        DockerStackService ds = service.mapTo(DockerStackService.class);

        // **REMOVED**: container_name is not supported in docker-stack
        // if (ds.getContainer_name() == null) {
        //     ds.setContainer_name(name);
        // }

        return ds;
    }

    /**
     * Custom SnakeYAML Representer to skip nulls and empty collections/maps.
     */
    private static class StackRepresenter extends Representer {

        public StackRepresenter() {
            super(create());
        }

        private static DumperOptions create() {
            DumperOptions options = new DumperOptions();
            options.setExplicitStart(true);
            options.setDefaultScalarStyle(DumperOptions.ScalarStyle.PLAIN);
            options.setLineBreak(DumperOptions.LineBreak.UNIX);
            return options;
        }

        @Override
        protected NodeTuple representJavaBeanProperty(Object javaBean, Property property, Object propertyValue, Tag customTag) {
            if (propertyValue == null) {
                return null; // skip 'null' values
            } else {
                NodeTuple tuple = super.representJavaBeanProperty(javaBean, property, propertyValue, customTag);
                Node valueNode = tuple.getValueNode();
                if (Tag.NULL.equals(valueNode.getTag())) {
                    return null; // skip 'null' values
                }
                if (propertyValue instanceof String && (((String) propertyValue).isEmpty() || ((String) propertyValue).isBlank()) ) {
                    return null; // skip '' values
                }
                if (valueNode instanceof CollectionNode) {
                    if (Tag.SEQ.equals(valueNode.getTag())) {
                        SequenceNode seq = (SequenceNode) valueNode;
                        if (seq.getValue().isEmpty()) {
                            return null; // skip empty lists
                        }
                    }
                    if (Tag.MAP.equals(valueNode.getTag())) {
                        MappingNode seq = (MappingNode) valueNode;
                        if (seq.getValue().isEmpty()) {
                            return null; // skip empty maps
                        }
                    }
                }
                return tuple;
            }
        }
    }
}