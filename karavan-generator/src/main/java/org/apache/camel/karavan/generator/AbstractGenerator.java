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
import org.apache.camel.catalog.CamelCatalog;
import org.apache.camel.catalog.DefaultCamelCatalog;
import org.apache.camel.catalog.VersionHelper;
import org.apache.camel.dsl.yaml.YamlRoutesBuilderLoader;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class AbstractGenerator {

    public static final List<String> deprecatedClasses = new ArrayList<>();

    Logger LOGGER = Logger.getLogger(AbstractGenerator.class.getName());
    protected static boolean print = false;

    protected void print(String line) {
        if (print) {
            System.out.println(line);
        }
    }

    protected Vertx vertx = Vertx.vertx();

    protected JsonObject getDefinitions(String source) {
        Buffer buffer = vertx.fileSystem().readFileBlocking(source);
        return new JsonObject(buffer).getJsonObject("items").getJsonObject("definitions");
    }

    protected JsonObject getDefinitions() {
        String camelYamlDSL = getCamelYamlDSL();
        return new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");
    }

    protected String getStepNameForClass(String className) {
        if (className.equals("CatchDefinition")) {
            className = "doCatch";
        } else if (className.equals("ConvertBodyDefinition")) {
            className = "convertBodyTo";
        } else if (className.equals("ConvertHeaderDefinition")) {
            className = "convertHeaderTo";
        } else if (className.equals("ConvertVariableDefinition")) {
            className = "convertVariableTo";
        } else if (className.equals("TryDefinition")) {
            className = "doTry";
        } else if (className.equals("LangChain4jTokenizerDefinition")) {
            className = "langChain4j";
        } else if (className.equals("FinallyDefinition")) {
            className = "doFinally";
        } else if (className.equals("ToDynamicDefinition")) {
            className = "toD";
        } else if (className.equals("SamplingDefinition")) {
            className = "sample";
        } else if (className.equals("BeanPropertiesDefinition")) {
            className = "properties";
        } else if (className.equals("BatchResequencerConfig")) {
            className = "batchConfig";
        } else if (className.equals("StreamResequencerConfig")) {
            className = "streamConfig";
        } else if (className.equals("RestSecuritiesDefinition")) {
            className = "securityDefinitions";
        } else if (className.endsWith("Definition")) {
            className = className.substring(0, className.length() - 10);
        } else if (className.endsWith("DataFormat")) {
            return getDataFormatStepNameForClass().get(className);
        } else if (className.endsWith("Expression")) {
            return getExpressionStepNameForClass().get(className);
        }
        return deCapitalize(className);
    }

    protected Map<String, String> getDataFormatStepNameForClass() {
        Map<String, String> stepNames = new LinkedHashMap<>();
        JsonObject definitions = getDefinitions();
        JsonObject props = definitions.getJsonObject("org.apache.camel.model.dataformat.DataFormatsDefinition").getJsonObject("properties");
        props.getMap().keySet().forEach(key -> {
            String className = classSimple(props.getJsonObject(key).getString("$ref"));
            stepNames.put(className, key);
        });
        return stepNames;
    }

    protected Map<String, String> getExpressionStepNameForClass() {
        Map<String, String> stepNames = new LinkedHashMap<>();
        JsonObject definitions = getDefinitions();
        JsonArray props = definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonArray("anyOf").getJsonObject(0).getJsonArray("oneOf");
        for (int i = 0; i < props.size(); i++) {
            JsonObject prop = props.getJsonObject(i);
            String key = prop.getJsonObject("properties").getMap().keySet().iterator().next();
            String fullClassName = prop.getJsonObject("properties").getJsonObject(key).getString("$ref");
            String className = classSimple(fullClassName);
            stepNames.put(className, key);
        }
        return stepNames;
    }

    private Map<String, JsonObject> getJsonObjectProperties(JsonObject val) {
        Map<String, JsonObject> properties = new LinkedHashMap<>();
        val.getMap().keySet().forEach(s -> {
            JsonObject value = val.getJsonObject(s);
            if (!value.getMap().isEmpty()) {
                properties.put(s, val.getJsonObject(s));
            } else if (s.equals("expression")) {
                properties.put(s, JsonObject.of("$ref", "#/items/definitions/org.apache.camel.model.language.ExpressionDefinition"));
            }
        });
        return properties;
    }

    protected Map<String, JsonObject> getClassProperties(String stepName, JsonObject obj) {
        Map<String, JsonObject> properties = new LinkedHashMap<>();
        obj.getMap().keySet().forEach(key -> {
            if (key.equals("oneOf")) {
                JsonObject val = obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties");
                properties.putAll(getJsonObjectProperties(val));
            } else if (key.equals("properties")) {
                JsonObject val = obj.getJsonObject("properties");
                properties.putAll(getJsonObjectProperties(val));
            } else if (key.equals("anyOf")) {
                JsonArray anyOfs = obj.getJsonArray("anyOf");
                anyOfs.forEach(o -> {
                    JsonObject ob = (JsonObject) o;
                    JsonArray vals = ob.getJsonArray("oneOf");
                    for (int i = 0; i < vals.size(); i++) {
                        JsonObject data = vals.getJsonObject(i);
                        if (!data.containsKey("not") && data.containsKey("type")) {
                            JsonObject val = data.getJsonObject("properties");
                            properties.putAll(getJsonObjectProperties(val));
                        }
                    }
                });
            }
        });
        return properties;
    }

    protected Comparator<String> getComparator(String stepName) {
        String json = getMetaModel(stepName);
        if (json != null) {
            JsonObject props = new JsonObject(json).getJsonObject("properties");
            List propsLowerCase = props.getMap().keySet().stream().map(String::toLowerCase).collect(Collectors.toList());
            return Comparator.comparing(e -> {
                if (propsLowerCase.contains(e.toLowerCase())) return propsLowerCase.indexOf(e.toLowerCase());
                else return propsLowerCase.size() + 1;
            });
        }
        return Comparator.comparing(s -> 0);
    }

//    protected Map<String, String> getStepNames(){
//        // Prepare stepNames map
//        JsonObject definitions = getDefinitions();
//        Map<String, String> stepNames = getProcessorStepName(new JsonObject(getCamelYamlDSL()).getJsonObject("items").getJsonObject("properties"));
//        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.ProcessorDefinition").getJsonObject("properties")));
//        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonObject("properties")));
//        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonObject("properties")));
//        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.dataformat.DataFormatsDefinition").getJsonObject("properties")));
//        return stepNames;
//    }

    protected Map<String, JsonObject> getDslMetadata() {
        // Generate DSL Metadata
        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        // Prepare stepNames map
        Map<String, String> stepNames = getProcessorStepNameMap();

        Map<String, JsonObject> classProps = new LinkedHashMap<>();
        Map<String, Object> defsMap = new LinkedHashMap<>();
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
//            LOGGER.info("Saving file " + targetFile.getAbsolutePath());
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

    protected boolean excludeProperty(String stepName, String name, String attributeType) {
        var hasModelInCatalog = hasModelInCatalog(stepName);
        var hasInCatalog = hasPropertyInCatalogIgnoreCase(stepName, name);
        var clazz = attributeType.contains("|") ? attributeType.split("\\|")[0].trim() : "";

        if (hasModelInCatalog
                && !hasInCatalog
                && !attributeType.contains("[]")
                && !attributeType.contains("{}")
                && !attributeType.contains("Definition")
                && !attributeType.contains("DataFormat")
                && !attributeType.contains("FilterConfiguration")
                && !attributeType.contains("BatchResequencerConfig")
                && !attributeType.contains("StreamResequencerConfig")
                && !attributeType.contains("Expression")) {
            return true;
        } else if (getDeprecatedClasses().contains(clazz)) {
            return true;
        }
        return false;
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

    protected String getMetaModelApp(String name) {
        try {
            InputStream inputStream = CamelCatalog.class.getResourceAsStream("/org/apache/camel/catalog/models-app/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.lineSeparator()));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    protected String readBean(String name) {
        InputStream inputStream = DefaultCamelCatalog.class.getResourceAsStream("/org/apache/camel/catalog/beans/" + name + ".json");
        return new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))
                .lines().collect(Collectors.joining(System.lineSeparator()));
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

    protected String getPropertyTypeInCatalog(String model, String property) {
        String json = getMetaModel(model);
        if (json != null) {
            JsonObject props = new JsonObject(json).getJsonObject("properties");
            JsonObject values = props.getJsonObject(property);
            return values != null ? values.getString("type") : null;
        }
        return null;
    }

    protected boolean hasPropertyInCatalog(String model, String property) {
        String json = getMetaModel(model);
        if (json != null) {
            JsonObject props = new JsonObject(json).getJsonObject("properties");
            return props.containsKey(property);
        }
        return false;
    }

    protected boolean hasPropertyInCatalogIgnoreCase(String model, String property) {
        String json = getMetaModel(model);
        if (json != null) {
            JsonObject props = new JsonObject(json).getJsonObject("properties");
            return props.getMap().keySet().stream().map(String::toLowerCase).anyMatch(k -> Objects.equals(k, property.toLowerCase()));
        }
        return false;
    }

    protected boolean hasModelInCatalog(String model) {
        String json = getMetaModel(model);
        return json != null;
    }

    protected String getMetaDataFormat(String name) {
        try {
            InputStream inputStream = VersionHelper.class.getResourceAsStream("/org/apache/camel/catalog/models/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

//    protected List<String> listResources(String resourceFolder) {
//        List<Path> filePaths = new ArrayList<>();
//        try {
//            URI uri = VersionHelper.class.getResource(resourceFolder).toURI();
//            Path myPath;
//            FileSystem fileSystem = null;
//            if (uri.getScheme().equals("jar")) {
//                fileSystem = FileSystems.newFileSystem(uri, Collections.emptyMap());
//                myPath = fileSystem.getPath(resourceFolder);
//            } else {
//                myPath = Paths.get(uri);
//            }
//            filePaths = Files.walk(myPath, 10).collect(Collectors.toList());
//
//            // Close the file system if opened
//            if (fileSystem != null) {
//                fileSystem.close();
//            }
//        } catch (URISyntaxException | IOException e) {
//            e.printStackTrace();
//        }
//        return filePaths.stream().map(path -> path.getFileName().toString())
//                .collect(Collectors.toList());
//    }

    protected String getMetaLanguage(String name) {
        try {
            InputStream inputStream = VersionHelper.class.getResourceAsStream("/org/apache/camel/catalog/models/" + name + ".json");
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

    protected String getAttributeArrayClass(String stepName, JsonObject attribute) {
        if (attribute.containsKey("items")) {
            JsonObject items = attribute.getJsonObject("items");
            if (items.containsKey("$ref")) {
                return classSimple(items.getString("$ref"));
            } else if (items.containsKey("properties")) {
                JsonObject properties = items.getJsonObject("properties");
                return classSimple(properties.getJsonObject(stepName).getString("$ref"));
            } else {
                return items.getString("type");
            }
        }
        return "string";
    }

    protected String classSimple(String classFullName) {
        String[] def = classFullName.split("\\.");
        return def[def.length - 1];
    }

    protected List<String> getClasses(JsonObject definitions, String filter) {
        List<String> result = new ArrayList<>();
        definitions.getMap().forEach((s, o) -> {
            if (s.startsWith(filter) && !s.equals("org.apache.camel.dsl.yaml.deserializers.RouteFromDefinitionDeserializer")) {
                if (!getDeprecatedClasses().contains(classSimple(s))) {
                    result.add(s);
                }
            }
        });
        return result;
    }

    protected Map<String, String> getProcessorStepNameMapForObject(String key, JsonObject jsonObject) {
        Map<String, String> result = new LinkedHashMap<>();

        jsonObject.fieldNames().forEach(k -> {
            Object object = jsonObject.getValue(k);
            if (object instanceof JsonObject) {
                JsonObject value = jsonObject.getJsonObject(k);
                result.putAll(getProcessorStepNameMapForObject(k, value));
            } else if (object instanceof JsonArray) {
                JsonArray value = jsonObject.getJsonArray(k);
                result.putAll(getProcessorStepNameMapForArray(value));
            } else if (object instanceof String && k.equals("$ref") && !object.toString().contains(".deserializers.")) {
                String ref = jsonObject.getString(k);
                String className = classSimple(ref);
                if (!getDeprecatedClasses().contains(className)) {
                    result.put(className, key);
                }
            }
        });
        return result;
    }

    protected Map<String, String> getProcessorStepNameMapForArray(JsonArray jsonArray) {
        Map<String, String> result = new LinkedHashMap<>();

        jsonArray.forEach(object -> {
            if (object instanceof JsonObject) {
                result.putAll(getProcessorStepNameMapForObject(null, (JsonObject) object));
            } else if (object instanceof JsonArray) {
                result.putAll(getProcessorStepNameMapForArray((JsonArray) object));
            }
        });
        return result;
    }

    protected Map<String, String> getProcessorStepNameMap() {
        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL);
        return new LinkedHashMap<>(getProcessorStepNameMapForObject(null, definitions));
    }

    protected Map<String, String> getProcessorDefinitionStepNameMap() {
        Map<String, String> result = new LinkedHashMap<>();
        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL);

        JsonObject properties = definitions
                .getJsonObject("items")
                .getJsonObject("definitions")
                .getJsonObject("org.apache.camel.model.ProcessorDefinition")
                .getJsonObject("properties");

        properties.getMap().forEach((key, o) -> {
            String ref = ((Map) o).get("$ref").toString();
            String className = classSimple(ref);
            if (!getDeprecatedClasses().contains(className)) {
                result.put(className, key);
            }
        });
        return result;
    }

    protected JsonObject getDefinition(JsonObject definitions, String className) {
        return definitions.getJsonObject(className.replace("#/items/definitions/", ""));
    }

    protected boolean isAttributeRefArray(JsonObject attribute) {
        return attribute.containsKey("type") && attribute.getString("type").equals("array");
    }

    protected List<String> getDeprecatedClasses() {
        if (deprecatedClasses.isEmpty()) {
            String camelYamlDSL = getCamelYamlDSL();
            JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

            definitions.getMap().forEach((s, o) -> {
                if (s.startsWith("org.apache.camel") && !s.equals("org.apache.camel.dsl.yaml.deserializers.RouteFromDefinitionDeserializer")) {
                    JsonObject classObject = definitions.getJsonObject(s);
                    if (classObject.containsKey("deprecated") && classObject.getBoolean("deprecated")) {
                        String className = classSimple(s);
                        deprecatedClasses.add(className);
                    }
                }
            });
        }
        return deprecatedClasses;
    }

    public List<String> listResources(String resourceFolder) {
        List<String> result = new ArrayList<>();
        try {
            URI uri = Objects.requireNonNull(KaravanGenerator.class.getResource(resourceFolder)).toURI();
            Path myPath;
            FileSystem fileSystem = null;
            if (uri.getScheme().equals("jar")) {
                fileSystem = FileSystems.newFileSystem(uri, Collections.emptyMap());
                myPath = fileSystem.getPath(resourceFolder);
            } else {
                myPath = Paths.get(uri);
            }

            try (var pathsStream = Files.walk(myPath, 10)) {
                pathsStream
                        .filter(Files::isRegularFile)
                        .map(path -> path.getFileName().toString())
                        .forEach(result::add);
            } catch (IOException e) {
                var error = e.getCause() != null ? e.getCause() : e;
                LOGGER.severe("IOException " + error.getMessage());
            }
            if (fileSystem != null) {
                fileSystem.close();
            }
        } catch (URISyntaxException | IOException e) {
            var error = e.getCause() != null ? e.getCause() : e;
            LOGGER.severe("URISyntaxException | IOException " + error.getMessage());
        }
        return result;
    }

    static void clearDirectory(File directoryToBeDeleted) {
        File[] allContents = directoryToBeDeleted.listFiles();
        if (allContents != null) {
            for (File file : allContents) {
                if (!file.getName().endsWith("gitignore")) file.delete();
            }
        }
    }
}
