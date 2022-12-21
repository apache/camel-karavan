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

import io.vertx.core.json.JsonObject;
import org.apache.camel.util.SensitiveUtils;

import java.util.*;
import java.util.stream.Collectors;

public final class CamelMetadataGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/CamelMetadata.header.ts";
    final static String targetModel = "karavan-core/src/core/model/CamelMetadata.ts";

    public static void main(String[] args) throws Exception {
        CamelMetadataGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelMetadataGenerator g = new CamelMetadataGenerator();
        g.createCamelDefinitions();
    }

    private void createCamelDefinitions() throws Exception {
        StringBuilder camelModel = new StringBuilder();
        camelModel.append(readFileText(modelHeader));

        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        // Generate DataFormats
        JsonObject dataformats = getProperties(definitions, "org.apache.camel.model.dataformat.DataFormatsDefinition");
        camelModel.append("\nexport const DataFormats: [string, string, string][] = [\n");
        dataformats.getMap().forEach((name, val) -> {
            String json = getMetaDataFormat(name);
            JsonObject model = new JsonObject(json).getJsonObject("model");
            String title = model.getString("title");
            String description = model.getString("description");
            camelModel.append(String.format("    ['%s','%s',\"%s\"],\n", name, title, description));
        });
        camelModel.append("]\n\n");

        // Prepare stepNames map
        Map<String, String> stepNames = getStepNames();

        Map<String, JsonObject> classProps = new HashMap<>();
        // Generate DataFormatMetadata
        definitions.getMap().forEach((s, o) -> {
            if (s.startsWith("org.apache.camel.model.dataformat")) {
                String name = classSimple(s);
                JsonObject obj = getDefinition(definitions, s);
                JsonObject props = obj.containsKey("oneOf") ? obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties") : obj.getJsonObject("properties");
                classProps.put(name, props);
            }
        });

        camelModel.append(getMetadataCode("CamelDataFormatMetadata", classProps, stepNames, "dataformat"));


        // Generate Languages
        JsonObject expression = getProperties(definitions, "org.apache.camel.model.language.ExpressionDefinition");
        camelModel.append("export const Languages: [string, string, string][] = [\n");
        expression.getMap().forEach((name, val) -> {
            String json = getMetaModel(name);
            JsonObject model = new JsonObject(json).getJsonObject("model");
            String title = model.getString("title");
            String description = model.getString("description");
            camelModel.append(String.format("    ['%s','%s',\"%s\"],\n", name, title, description));
        });
        camelModel.append("]\n\n");

        // Generate LanguageMetadata
        classProps.clear();
        definitions.getMap().forEach((s, o) -> {
            if (s.startsWith("org.apache.camel.model.language")) {
                String name = classSimple(s);
                JsonObject obj = getDefinition(definitions, s);
                JsonObject props = obj.containsKey("oneOf") ? obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties") : obj.getJsonObject("properties");
                classProps.put(name, props);
            }
        });

        camelModel.append(getMetadataCode("CamelLanguageMetadata", classProps, stepNames, "language"));

        // Generate DSL Metadata
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

        camelModel.append(getMetadataCode("CamelModelMetadata", classProps, stepNames, "model"));

        // add Sensitive keys
        List<String> sk = new ArrayList(SensitiveUtils.getSensitiveKeys());
        camelModel.append("export const SensitiveKeys: string[] = [\n");
        for (int i = 0; i < sk.size(); i++) {
            camelModel.append("    \"").append(sk.get(i)).append("\"").append(i < sk.size() - 1 ? "," : "").append("\n");
        }
        camelModel.append("]");

        writeFileText(targetModel, camelModel.toString());
    }

    private String getMetadataCode(String className, Map<String, JsonObject> classProps, Map<String, String> stepNames, String folder) {
        StringBuilder code = new StringBuilder();
        code.append(String.format("export const %s: ElementMeta[] = [\n", className));
        classProps.forEach((name, properties) -> {
            String stepName = stepNames.get(name);
            String json = folder.equals("model") ? getMetaModel(stepName) : (folder.equals("language") ? getMetaLanguage(stepName) : getMetaDataFormat(stepName));
            if (json != null) {
                JsonObject model = new JsonObject(json).getJsonObject("model");
                JsonObject props = new JsonObject(json).getJsonObject("properties");
                List propsLowerCase = props.getMap().keySet().stream().map(s -> s.toLowerCase()).collect(Collectors.toList());

                Comparator<String> comparator = Comparator.comparing(e -> {
                    if (propsLowerCase.contains(e.toLowerCase())) return propsLowerCase.indexOf(e.toLowerCase());
                    else return propsLowerCase.size() + 1;
                });

                String title = model.getString("title");
                String description = model.getString("description");
                String label = model.getString("label");
                code.append(String.format("    new ElementMeta('%s', '%s', '%s', \"%s\", '%s', [\n", stepName, name, title, description, label));
                properties.getMap().keySet().stream().sorted(comparator).forEach((pname) -> {
                    Object v = properties.getMap().get(pname);
                    JsonObject p = props.getJsonObject(pname);
                    if ("inheritErrorHandler".equals(pname) && p == null) {
                    } else {

                        PropertyMeta pm = getAttributeType(new JsonObject((Map) v));
                        String displayName = p != null && p.containsKey("displayName") ? p.getString("displayName") : pname;
                        String desc = p != null && p.containsKey("description") ? p.getString("description") : pname;
                        String en = p != null && p.containsKey("enum") ? p.getString("enum").replace("[", "").replace("]", "") : "";
                        Boolean required = p != null && p.containsKey("required") ? p.getBoolean("required") : false;
                        Boolean secret = p != null && p.containsKey("secret") ? p.getBoolean("secret") : false;
                        String defaultValue = p != null && p.containsKey("defaultValue") ? p.getString("defaultValue") : "";
                        defaultValue = defaultValue.length() == 1 && defaultValue.toCharArray()[0] == '\\' ? "\\\\" : defaultValue;
                        String labels = p != null && p.containsKey("label") ? p.getString("label") : "";
                        String javaType = getJavaType(p);
                        if (name.equals("ProcessDefinition") && pname.equals("ref")) javaType = "org.apache.camel.Processor"; // exception for processor
                        code.append(String.format(
                                "        new PropertyMeta('%s', '%s', \"%s\", '%s', '%s', '%s', %b, %b, %b, %b, '%s', '%s'),\n",
                                pname, displayName, desc, pm.type, en, defaultValue, required, secret, pm.isArray, (pm.isArray ? pm.type : pm.isObject), labels, javaType));
                    }
                });
                code.append("    ]),\n");
            }
        });
        code.append("]\n\n");
        return code.toString();
    }

    private String getJavaType(JsonObject p) {
        if (p != null
                && p.containsKey("type")
                && p.getString("type").equals("object")
                && (p.getString("javaType").equals("org.apache.camel.AggregationStrategy") || p.getString("javaType").equals("org.apache.camel.Processor")) ) {
            String javaName = p.getString("javaType");
            try {
                Class clazz = Class.forName(javaName);
                if (clazz.isInterface() && clazz.getPackageName().equals("org.apache.camel")) return javaName;
            } catch (ClassNotFoundException e) {
               return "";
            }
        }
        return "";
    }

    private PropertyMeta getAttributeType(JsonObject attribute) {
        if (attribute.containsKey("$ref")) {
            String classFullName = attribute.getString("$ref");
            String className = classSimple(classFullName);
            if (className.equals("SagaActionUriDefinition"))
                return new PropertyMeta("string", false, false);  // exception for SagaActionUriDefinition
            if (className.equals("ToDefinition"))
                return new PropertyMeta("string", false, false);  // exception for ToDefinition (in REST Methods)
            if (className.equals("ToDynamicDefinition"))
                return new PropertyMeta("string", false, false);  // exception for ToDynamicDefinition (in REST Methods)
            return new PropertyMeta(className, false, true);
        } else if (attribute.containsKey("type") && attribute.getString("type").equals("array")) {
            JsonObject items = attribute.getJsonObject("items");
            if (items.containsKey("$ref") && items.getString("$ref").equals("#/items/definitions/org.apache.camel.model.ProcessorDefinition")) {
                return new PropertyMeta("CamelElement", true, true);
            } else if (items.containsKey("$ref")) {
                String className = classSimple(items.getString("$ref"));
                return new PropertyMeta(className, true, true);
            } else {
                return new PropertyMeta(items.getString("type"), true, false);
            }
        } else if (attribute.containsKey("type") && attribute.getString("type").equals("object")) {
            return new PropertyMeta(attribute.getString("type"), false, false);
        } else {
            return new PropertyMeta(attribute.getString("type"), false, false);
        }
    }

    class PropertyMeta {
        public String type;
        public Boolean isArray;
        public Boolean isObject;

        public PropertyMeta(String type, Boolean isArray, Boolean isObject) {
            this.type = type;
            this.isArray = isArray;
            this.isObject = isObject;
        }

        @Override
        public String toString() {
            return "PropertyMeta{" +
                    "type='" + type + '\'' +
                    ", isArray=" + isArray +
                    ", isObject=" + isObject +
                    '}';
        }
    }
}
