/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.camel.karavan.docker;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.model.DockerCompose;
import org.apache.camel.karavan.model.DockerComposeService;
import org.apache.camel.karavan.model.DockerComposeVolume;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.introspector.Property;
import org.yaml.snakeyaml.nodes.*;
import org.yaml.snakeyaml.representer.Representer;

import java.util.Map;

import static com.github.dockerjava.api.model.MountType.BIND;
import static com.github.dockerjava.api.model.MountType.VOLUME;

public class DockerComposeConverter {

    private static final String ENVIRONMENT = "environment";
    private static final String VOLUMES = "volumes";

    public static DockerCompose fromCode(String code) {
        Yaml yaml = new Yaml();
        Map<String, Object> obj = yaml.load(code);
        JsonObject json = JsonObject.mapFrom(obj);
        JsonObject services = json.getJsonObject("services");
        JsonObject composeServices = new JsonObject();

        services.getMap().forEach((name, value) -> {
            JsonObject serviceJson = services.getJsonObject(name);
            DockerComposeService service = convertToDockerComposeService(name, serviceJson);
            composeServices.put(name, service);
        });
        json.put("services", composeServices);
        return json.mapTo(DockerCompose.class);
    }

    public static DockerComposeService fromCode(String code, String serviceName) {
        DockerCompose compose = fromCode(code);
        return compose.getServices().get(serviceName);
    }

    public static String toCode(DockerCompose compose) {
        Yaml yaml = new Yaml(new ComposeRepresenter());
        return yaml.dumpAs(compose, Tag.MAP, DumperOptions.FlowStyle.BLOCK);
    }

    public static String toCode(DockerComposeService service) {
        DockerCompose dc = DockerCompose.create(service);
        return toCode(dc);
    }

    private static DockerComposeService convertToDockerComposeService(String name, JsonObject service) {
        if (service.containsKey(ENVIRONMENT) && service.getValue(ENVIRONMENT) instanceof JsonArray) {
            JsonObject env = new JsonObject();
            service.getJsonArray(ENVIRONMENT).forEach(o -> {
                String[] kv = o.toString().split("=");
                if (kv.length == 2) {
                    env.put(kv[0], kv[1]);
                }
            });
            service.put(ENVIRONMENT, env);
        }
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
                        var type = (part0.startsWith("/") || part0.startsWith("~") || part0.startsWith("./")) ? BIND : VOLUME;
                        volumes.add(JsonObject.mapFrom(new DockerComposeVolume(type.name().toLowerCase(), parts[0], parts[1])));
                    } else if (parts.length == 1) {
                        volumes.add(JsonObject.mapFrom(new DockerComposeVolume(VOLUME.name().toLowerCase(), null, parts[0])));
                    }
                }
            });
            service.put(VOLUMES, volumes);
        }

        DockerComposeService ds = service.mapTo(DockerComposeService.class);
        if (ds.getContainer_name() == null) {
            ds.setContainer_name(name);
        }
        return ds;
    }

    private static class ComposeRepresenter extends Representer {

        public ComposeRepresenter() {
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
                return null;
            } else {
                NodeTuple tuple = super.representJavaBeanProperty(javaBean, property, propertyValue, customTag);
                Node valueNode = tuple.getValueNode();
                if (Tag.NULL.equals(valueNode.getTag())) {
                    return null;// skip 'null' values
                }
                if (propertyValue instanceof String && (((String) propertyValue).isEmpty() || ((String) propertyValue).isBlank()) ) {
                    return null;// skip '' values
                }
                if (valueNode instanceof CollectionNode) {
                    if (Tag.SEQ.equals(valueNode.getTag())) {
                        SequenceNode seq = (SequenceNode) valueNode;
                        if (seq.getValue().isEmpty()) {
                            return null;// skip empty lists
                        }
                    }
                    if (Tag.MAP.equals(valueNode.getTag())) {
                        MappingNode seq = (MappingNode) valueNode;
                        if (seq.getValue().isEmpty()) {
                            return null;// skip empty maps
                        }
                    }
                }
                return tuple;
            }
        }
    }
}