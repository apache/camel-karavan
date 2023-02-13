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
package org.apache.camel.karavan.generator;

import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.catalog.CamelCatalog;
import org.apache.camel.dsl.yaml.YamlRoutesBuilderLoader;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class AbstractGenerator {

    Logger LOGGER = Logger.getLogger(AbstractGenerator.class.getName());

    protected Vertx vertx = Vertx.vertx();

    protected JsonObject getDefinitions(String source) {
        Buffer buffer = vertx.fileSystem().readFileBlocking(source);
        return new JsonObject(buffer).getJsonObject("items").getJsonObject("definitions");
    }

    protected JsonObject getDefinitions(){
        String camelYamlDSL = getCamelYamlDSL();
        return new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");
    }

    protected Map<String, String> getStepNames(){
        // Prepare stepNames map
        JsonObject definitions = getDefinitions();
        Map<String, String> stepNames = getProcessorStepName(new JsonObject(getCamelYamlDSL()).getJsonObject("items").getJsonObject("properties"));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.ProcessorDefinition").getJsonObject("properties")));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonObject("properties")));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonObject("properties")));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.dataformat.DataFormatsDefinition").getJsonObject("properties")));
        return stepNames;
    }

    protected Map<String, JsonObject> getDslMetadata(){
        // Generate DSL Metadata
        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        // Prepare stepNames map
        Map<String, String> stepNames = getStepNames();

        Map<String, JsonObject> classProps = new HashMap<>();
        Map<String, Object> defsMap = new HashMap<>();
        defsMap.putAll(definitions.getJsonObject("org.apache.camel.model.ProcessorDefinition").getJsonObject("properties").getMap());
        defsMap.putAll(new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("properties").getMap());

        classProps.clear();
        defsMap.forEach((s, o) -> {
            String ref = ((Map) o).get("$ref").toString();
            String name = classSimple(ref);
            JsonObject obj = getDefinition(definitions, ref);
            JsonObject props = obj.containsKey("oneOf") ? obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties") : obj.getJsonObject("properties");
            classProps.put(name, props);
        });

        // add additional classes
        getClasses(definitions, "org.apache.camel.model").forEach(s -> {
            String className = classSimple(s);
            if (!stepNames.containsKey(className)) {
                String stepName = deCapitalize(className.replace("Definition", ""));
                stepNames.put(className, stepName);
            }
        });

        definitions.getMap().forEach((s, o) -> {
            if (s.startsWith("org.apache.camel.model.") && s.endsWith("Definition")) {
                String name = classSimple(s);
                JsonObject obj = getDefinition(definitions, s);
                JsonObject props = obj.containsKey("oneOf") ? obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties") : obj.getJsonObject("properties");
                classProps.put(name, props);
            }
        });

        return classProps;
    }

    protected String getCamelYamlDSL() {
        try {
            InputStream inputStream = YamlRoutesBuilderLoader.class.getResourceAsStream("/schema/camelYamlDsl.json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    protected String readFileText(String template) {
        Buffer templateBuffer = vertx.fileSystem().readFileBlocking(template);
        return templateBuffer.toString();
    }

    protected void saveFile(String folder, String fileName, String text) {
        Path path = Paths.get(folder);
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
            File targetFile = Paths.get(folder, fileName).toFile();
            LOGGER.info("Saving file " + targetFile.getAbsolutePath());
            Files.copy(new ByteArrayInputStream(text.getBytes()), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    protected void writeFileText(String filePath, String data) throws IOException {
        Files.writeString(Paths.get(filePath), data);
    }

    protected JsonObject getProperties(JsonObject definitions, String classname) {
        JsonObject root = definitions.getJsonObject(classname);
        JsonObject props = root.getJsonObject("properties");
        JsonArray oneOf = root.getJsonArray("oneOf");
        if (props != null) {
            return props;
        } else {
            return oneOf.getJsonObject(1).getJsonObject("properties");
        }
    }

    protected String getPropertyToMapString(JsonObject definitions, String classname) {
        JsonObject root = definitions.getJsonObject(classname);
        JsonArray oneOf = root.getJsonArray("oneOf");
        JsonArray required = root.getJsonArray("required");
        if (oneOf != null && required != null) {
            return required.getString(0);
        }
        return null;
    }

    protected String camelize(String name, String separator) {
        return Arrays.stream(name.split(separator)).map(s -> capitalize(s)).collect(Collectors.joining());
    }

    protected String capitalize(String str) {
        return str.length() == 0 ? str
                : str.length() == 1 ? str.toUpperCase()
                : str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    protected String deCapitalize(String str) {
        return str.length() == 0 ? str
                : str.length() == 1 ? str.toLowerCase()
                : str.substring(0, 1).toLowerCase() + str.substring(1);
    }

    protected String getMetaModel(String name) {
        try {
            InputStream inputStream = CamelCatalog.class.getResourceAsStream("/org/apache/camel/catalog/models/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    protected String getMetaDataFormat(String name) {
        try {
            InputStream inputStream = RouteBuilder.class.getResourceAsStream("/org/apache/camel/model/dataformat/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    protected String getMetaLanguage(String name) {
        try {
            InputStream inputStream = RouteBuilder.class.getResourceAsStream("/org/apache/camel/model/language/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    protected boolean isAttributeRef(JsonObject attribute) {
        return attribute.containsKey("$ref");
    }

    protected String getAttributeClass(JsonObject attribute) {
        return classSimple(attribute.getString("$ref"));
    }

    protected String getAttributeArrayClass(JsonObject attribute) {
        return classSimple(attribute.getJsonObject("items").getString("$ref"));
    }

    protected String classSimple(String classFullName) {
        String[] def = classFullName.split("\\.");
        return def[def.length - 1];
    }

    protected List<String> getClasses(JsonObject definitions, String filter) {
        List<String> result = new ArrayList<>();
        definitions.getMap().forEach((s, o) -> {
            if (s.startsWith(filter) && !s.equals("org.apache.camel.dsl.yaml.deserializers.RouteFromDefinitionDeserializer")) {
                result.add(s);
            }
        });
        return result;
    }

    protected Map<String, String> getProcessorStepName(JsonObject properties) {
        Map<String, String> result = new HashMap<>();
        properties.getMap().forEach((name, o) -> {
            String ref = properties.getJsonObject(name).getString("$ref");
            ref = ref.equals("#/items/definitions/org.apache.camel.dsl.yaml.deserializers.RouteFromDefinitionDeserializer")
                    ? "#/items/definitions/org.apache.camel.model.FromDefinition"
                    : ref;
            ref = ref.equals("#/items/definitions/org.apache.camel.dsl.yaml.deserializers.ErrorHandlerBuilderDeserializer")
                    ? "#/items/definitions/org.apache.camel.model.ErrorHandlerDefinition"
                    : ref;
            String className = classSimple(ref);
            result.put(className, className.equals("ToDynamicDefinition") ? "toD" : name);
        });
        return result;
    }

    protected JsonObject getDefinition(JsonObject definitions, String className) {
        return definitions.getJsonObject(className.replace("#/items/definitions/", ""));
    }
}
