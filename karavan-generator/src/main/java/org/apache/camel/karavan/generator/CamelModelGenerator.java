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

import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.catalog.CamelCatalog;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public final class CamelModelGenerator extends AbstractGenerator {

    public static void main(String[] args) throws Exception {
        CamelModelGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelModelGenerator g = new CamelModelGenerator();
        g.createModels(
                "karavan-generator/src/main/resources/CamelModel.ts",
                "karavan-generator/src/main/resources/camel-metadata.template",
                "karavan-core/src/core/model/CamelModel.ts",
                "karavan-core/src/core/api/CamelApi.ts",
                "karavan-core/src/core/api/CamelYamlSteps.ts",
                "karavan-core/src/core/api/CamelMetadata.ts"
        );
    }

    private void createModels(String template, String metadataTemplate, String targetModel, String targetApi, String camelYamlSteps, String targetMetadata) throws Exception {

        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        Buffer templateBuffer = vertx.fileSystem().readFileBlocking(template);

        StringBuilder camelModel = new StringBuilder();
        camelModel.append(templateBuffer.toString());

        // generate properties for elements
        Map<String, List<ElementProp>> models = new HashMap<>();
        Map<String, String> propertyToMapStrings = new HashMap<>();
        // from
        JsonObject fromList = getProperties(definitions, "org.apache.camel.dsl.yaml.deserializers.RouteFromDefinitionDeserializer");
        List<ElementProp> fProps = generateElementProp("from", fromList, definitions, Map.of());
        models.put("from", fProps);
        // expression
        JsonObject expression = getProperties(definitions, "org.apache.camel.model.language.ExpressionDefinition");
        List<ElementProp> eProps = generateElementProp("expression", expression, definitions, Map.of());
        models.put("expression", eProps);
        // processors
        JsonObject procList = getProperties(definitions, "org.apache.camel.model.ProcessorDefinition");
        // fill processors name + class
        Map<String, String> processors = new HashMap();
        procList.getMap().entrySet().stream()
                .filter(e -> !e.getKey().equals("step"))
                .collect(Collectors.toMap(
                        e -> e.getKey(),
                        e -> e.getValue()
                )).forEach((s, o) -> {
                    String name = camelize(s, "-");
                    if (name.equalsIgnoreCase("tod")) name = "ToD";
                    String className = classNameFromRef(procList.getJsonObject(s).getString("$ref"));
                    processors.put(className, name);
                });
        procList.getMap().entrySet().stream()
                .filter(e -> !e.getKey().equals("step"))
                .forEach((s) -> {
                    String name = camelize(s.getKey(), "-");
                    String className = classNameFromRef(procList.getJsonObject(s.getKey()).getString("$ref"));
                    JsonObject props = getProperties(definitions, className);
                    List<ElementProp> elProps = generateElementProp(name, props, definitions, processors);
                    String propertyToMapString = getPropertyToMapString(definitions, className);
                    propertyToMapStrings.put(name, propertyToMapString);
                    models.put(name, elProps);
                });

        // generate models code
        models.forEach((name, elementProps) -> {
            String pcode = generateElementCode(name, elementProps);
            camelModel.append(pcode).append(System.lineSeparator());
        });

        vertx.fileSystem().writeFileBlocking(targetModel, Buffer.buffer(camelModel.toString()));


        //  generate API
        String api = new CamelApiGenerator().generate(models, processors, propertyToMapStrings);
        vertx.fileSystem().writeFileBlocking(targetApi, Buffer.buffer(api));


        // Generate CamelYamlStepApi
        String code = new CamelYamlStepsGenerator().generate(models, processors, propertyToMapStrings);
        vertx.fileSystem().writeFileBlocking(camelYamlSteps, Buffer.buffer(code));

        // Generate Camel Models Metadata
        StringBuilder metadata = new StringBuilder(readFileText(metadataTemplate));
        metadata.append(generateCamelModelMetadata(models));

        // Generate Camel DataFormat Metadata
        metadata.append(generateCamelDataFormatMetadata(models));
        writeFileText(targetMetadata, metadata.toString());
    }

    private List<ElementProp> generateElementProp(String name, JsonObject properties, JsonObject definitions, Map<String, String> processors) {
        String modelName = deCapitalize(name.equals("Tod") ? "toD" : name);
        String json = getMetaModel(modelName);
        if (json == null) return List.of();
        JsonObject p = new JsonObject(json).getJsonObject("properties");
        List<ElementProp> props = new ArrayList<>();
        Set<String> keys = new HashSet<>();
        properties.getMap().entrySet().stream().filter(e -> {
                    // workaround because camel-yaml-dsl.json and camel-catalogue are not sync
                    if (e.getKey().equals("inherit-error-handler")) {
                        JsonObject o = p.getJsonObject("inheritErrorHandler");
                        return o != null;
                    }
                    return true;
                }
        ).forEach(e -> {
            String attr = e.getKey();
            String propName = deCapitalize(camelize(attr, "-"));
            boolean notStepsForChoice = !(name.equalsIgnoreCase("Choice") && propName.equals("steps"));
            boolean notStepsForKamelet = !(name.equalsIgnoreCase("Kamelet") && propName.equals("steps"));
            if (!keys.contains(propName) && notStepsForChoice && notStepsForKamelet) {
                String type = properties.getJsonObject(attr).getString("type");
                String ref = properties.getJsonObject(attr).getString("$ref");
                if (type != null) {
                    if (type.equals("array") && isArrayTypeIsClass(properties.getJsonObject(attr))) {
                        String arrayTypeClass = getArrayTypeClass(properties.getJsonObject(attr));
                        String arrayType = processors.get(arrayTypeClass);
                        if (arrayType != null) {
                            String typeCode = propName.equals("when") ? getTypeCode(type, arrayType) : getTypeCode(type, arrayType);
                            props.add(new ElementProp(propName, type, false, true, true, arrayType, false, typeCode));
                        } else if (arrayTypeClass.equals("org.apache.camel.model.ProcessorDefinition")) {
                            props.add(new ElementProp(propName, type, false, true, true, arrayType, true, getTypeCode(type, "CamelElement")));
                        }
                    } else if (type.equals("array") && !isArrayTypeIsClass(properties.getJsonObject(attr))) {
                        String arrayType = getArrayType(properties.getJsonObject(attr));
                        props.add(new ElementProp(propName, type, false, true, false, arrayType, false, getTypeCode(type, arrayType)));
                    } else {
                        props.add(new ElementProp(propName, type, false, false, false, null, false, getTypeCode(type, null)));
                    }
                } else if (ref != null) {
                    String className = classNameFromRef(ref);
                    String processorName = processors.get(className);

                    if (name.equalsIgnoreCase("Expression") && propName.equalsIgnoreCase("language")) {
                        props.add(new ElementProp(propName, "string", false, false, false, null, false, "string"));
                    } else if (processorName != null) {
                        props.add(new ElementProp(propName, processorName, true, false, false, null, false, capitalize(processorName)));
                    } else if (className.startsWith("org.apache.camel.model.dataformat")) {
                        String dataFormatClass = className.replace("org.apache.camel.model.dataformat.", "");
                        props.add(new ElementProp(propName, dataFormatClass, true, false, false, null, false, "dataFormat." + dataFormatClass));
                    } else if (isClassOneOfString(className, definitions)) {
                        props.add(new ElementProp(propName, "string", false, false, false, null, false, "string"));
                    } else if ("org.apache.camel.model.language.ExpressionDefinition".equals(className)
                            || "org.apache.camel.model.ExpressionSubElementDefinition".equals(className)) {
                        props.add(new ElementProp(propName, "Expression", true, false, false, null, false, "Expression"));
                    }
                }
            }
            keys.add(propName);
        });
        return props;
    }

    private String generateElementCode(String name, List<ElementProp> elementProps) {
        StringBuilder element = new StringBuilder();
        element.append("export class ").append(capitalize(name)).append(" extends CamelElement { \n");
        Set<String> keys = new HashSet<>();
        elementProps.forEach((e) -> {
            element.append(getTabs(1)).append(e.name).append("?: ").append(e.typeCode).append(System.lineSeparator());
            keys.add(e.name);
        });
        element.append("\n");
        element.append("    public constructor(init?: Partial<").append(capitalize(name)).append(">) { \n");
        element.append("        super('").append(deCapitalize(name)).append("')\n");
        if (name.equals("expression")) {
            element.append("        if (init && init.language === undefined) init.language = CamelApi.getExpressionLanguage(init);\n");
        }
        element.append("        Object.assign(this, init)\n");
        element.append("    }\n");
        element.append("}");
        return element.toString();
    }

    private String generateCamelModelMetadata(Map<String, List<ElementProp>> models) {
        // Generate Metadata
        StringBuilder metadata = new StringBuilder("export const Languages: [string, string, string][] = [\n");
        models.get("expression").forEach(el -> {
            String name = el.name;
            String json = getMetaModel(name);
            JsonObject model = new JsonObject(json).getJsonObject("model");
            String title = model.getString("title");
            String description = model.getString("description");
            metadata.append(String.format("    ['%s','%s',\"%s\"],\n", name, title, description));
        });
        metadata.append("]\n");

        metadata.append("export const CamelModelMetadata: ElementMeta[] = [\n");
        models.keySet().forEach(s -> {
            String name = deCapitalize(s);
            String json = getMetaModel(name);
            if (json != null) {
                JsonObject model = new JsonObject(json).getJsonObject("model");
                JsonObject props = new JsonObject(json).getJsonObject("properties");
                String title = model.getString("title");
                String description = model.getString("description");
                String label = model.getString("label");
                metadata.append(String.format("    new ElementMeta('%s', '%s', '%s', '%s', [\n", name, title, description, label));
                models.get(s).forEach(el -> {
                    String pname = el.name;
                    JsonObject p = props.getJsonObject(pname);
                    if ("inheritErrorHandler".equals(pname) && p == null) {
                    } else {
                        String displayName = p != null && p.containsKey("displayName") ? p.getString("displayName") : pname;
                        String desc = p != null && p.containsKey("description") ? p.getString("description") : pname;
                        String en = p != null && p.containsKey("enum") ? p.getString("enum").replace("[", "").replace("]", "") : "";
                        String type = p != null && p.containsKey("desc") ? p.getString("type") : el.type;
                        Boolean required = p != null && p.containsKey("required") ? p.getBoolean("required") : false;
                        Boolean secret = p != null && p.containsKey("secret") ? p.getBoolean("secret") : false;
                        String defaultValue = p != null && p.containsKey("defaultValue") ? p.getString("defaultValue") : "";
                        metadata.append(String.format("        new PropertyMeta('%s', '%s', \"%s\", '%s', '%s', '%s', %b, %b, %b, %b),\n", pname, displayName, desc, type, en, defaultValue, required, secret, el.isArray, (el.isArray ? el.isArrayTypeClass : el.isObject)));
                    }
                });
                metadata.append("    ]),\n");
            }
        });
        metadata.append("]\n");
        return metadata.toString();
    }

    private String generateCamelDataFormatMetadata(Map<String, List<ElementProp>> models) {

        List<String> dataformats = models.get("Marshal").stream()
                .filter(e -> e.typeCode.startsWith("dataFormat."))
                .map(e -> e.name).collect(Collectors.toList());
        StringBuilder metadata = new StringBuilder("export const DataFormats: [string, string, string][] = [\n");
        dataformats.forEach(name -> {
            String json = getMetaDataFormat(name);
            if (json != null) {
                JsonObject model = new JsonObject(json).getJsonObject("model");
                String title = model.getString("title");
                String description = model.getString("description");
                metadata.append(String.format("    ['%s','%s',\"%s\"],\n", name, title, description));
            }
        });
        metadata.append("]\n");

        metadata.append("export const CamelDataFormatMetadata: ElementMeta[] = [\n");
        dataformats.forEach(s -> {
            String name = deCapitalize(s);
            String json = getMetaDataFormat(name);
            if (json != null) {
                JsonObject model = new JsonObject(json).getJsonObject("model");
                JsonObject props = new JsonObject(json).getJsonObject("properties");
                String title = model.getString("title");
                String description = model.getString("description");
                String label = model.getString("label");
                metadata.append(String.format("    new ElementMeta('%s', '%s', \"%s\", '%s', [\n", name, title, description, label));
                props.stream().forEach(e -> {
                    String pname = e.getKey();
                    JsonObject p = props.getJsonObject(pname);
                    String displayName = p != null && p.containsKey("displayName") ? p.getString("displayName") : pname;
                    String desc = p != null && p.containsKey("description") ? p.getString("description") : pname;
                    String en = p != null && p.containsKey("enum") ? p.getString("enum").replace("[", "").replace("]", "") : "";
                    String type = p.getString("type");
                    Boolean required = p != null && p.containsKey("required") ? p.getBoolean("required") : false;
                    Boolean secret = p != null && p.containsKey("secret") ? p.getBoolean("secret") : false;
                    String defaultValue = p != null && p.containsKey("defaultValue") ? p.getString("defaultValue") : "";
                    boolean isObject = false; //(el.isArray ? el.isArrayTypeClass : el.isObject);
                    metadata.append(String.format("        new PropertyMeta('%s', '%s', \"%s\", '%s', '%s', '%s', %b, %b, %b, %b),\n", pname, displayName, desc, type, en, defaultValue, required, secret, "array".equals(type), isObject));
                });
                metadata.append("    ]),\n");
            }
        });
        metadata.append("]\n");
        return metadata.toString();
    }

    private boolean isClassOneOfString(String classname, JsonObject definitions) {
        return definitions.getJsonObject(classname).containsKey("oneOf") && definitions.getJsonObject(classname).getJsonArray("oneOf").getJsonObject(0).getString("type").equals("string");
    }

    private String getTabs(int n) {
        return IntStream.range(0, n).mapToObj(value -> "    ").collect(Collectors.joining());
    }

    private boolean isArrayTypeIsClass(JsonObject obj) {
        return obj.getJsonObject("items").containsKey("$ref");
    }

    private String getArrayTypeClass(JsonObject obj) {
        return classNameFromRef(obj.getJsonObject("items").getString("$ref"));
    }

    private String getArrayType(JsonObject obj) {
        return classNameFromRef(obj.getJsonObject("items").getString("type"));
    }

    private String classNameFromRef(String ref) {
        return ref.replace("#/items/definitions/", "");
    }

    private String getTypeCode(String type, String arrayClassName) {
        switch (type) {
            case "object":
                return "any";
            case "number":
                return "number";
            case "boolean":
                return "boolean";
            case "array":
                return arrayClassName + " [] = []";
            default:
                return "string";
        }
    }


    public String getMetaModel(String name) {
        try {
            InputStream inputStream = CamelCatalog.class.getResourceAsStream("/org/apache/camel/catalog/models/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    public String getMetaDataFormat(String name) {
        try {
            InputStream inputStream = RouteBuilder.class.getResourceAsStream("/org/apache/camel/model/dataformat/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }



}
