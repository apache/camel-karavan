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

import java.util.*;
import java.util.stream.Collectors;

public final class CamelDefinitionGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/CamelDefinition.header.ts";
    final static String modelTemplate = "karavan-generator/src/main/resources/CamelDefinition.ts";
    final static String targetModel = "karavan-core/src/core/model/CamelDefinition.ts";

    public static void main(String[] args) throws Exception {
        CamelDefinitionGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelDefinitionGenerator g = new CamelDefinitionGenerator();
        g.createCamelDefinitions();
    }

    private void createCamelDefinitions() throws Exception {
        StringBuilder camelModel = new StringBuilder();
        camelModel.append(readFileText(modelHeader));

        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        // Prepare stepNames map
        Map<String, String> stepNames = getProcessorStepName(new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("properties"));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.ProcessorDefinition").getJsonObject("properties")));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonObject("properties")));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.dataformat.DataFormatsDefinition").getJsonObject("properties")));

        // add additional classes
        getClasses(definitions, "org.apache.camel.model").forEach(s -> {
            String className = classSimple(s);
            if (!stepNames.containsKey(className)) {
                String stepName = deCapitalize(className.replace("Definition", ""));
                stepNames.put(className, stepName);
            }
        });

        List<String> modelList = getClasses(definitions, "org.apache.camel");
        modelList.forEach(className -> {
            String model = generateModel(className, definitions.getJsonObject(className), definitions, stepNames, getDslMetadata());
            camelModel.append(model).append(System.lineSeparator());
        });

        writeFileText(targetModel, camelModel.toString());
    }

    private String generateModel(String classFullName, JsonObject obj, JsonObject definitions, Map<String, String> stepNames, Map<String, JsonObject> dslMetadata) {
        String className = classSimple(classFullName);
        JsonObject properties = obj.containsKey("oneOf")
                ? obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties")
                : obj.getJsonObject("properties");

        List<String> required = obj.containsKey("required") ? obj.getJsonArray("required").getList() : List.of();
        List<String> attrs = new ArrayList<>();
        String stepName = stepNames.get(className);
        if (className.endsWith("Definition") && stepNames.containsKey(className)) {
            attrs.add("    stepName?: string = '" + stepName + "'");
        } else if (className.endsWith("Expression") && stepNames.containsKey(className)) {
            attrs.add("    expressionName?: string = '" + stepNames.get(className) + "'");
        } else if (className.endsWith("DataFormat") && stepNames.containsKey(className)) {
            attrs.add("    dataFormatName?: string = '" + stepNames.get(className) + "'");
        }
        if (properties != null) {
            properties.getMap().keySet().stream().sorted(getComparator(stepName)).forEach(name -> {
                JsonObject attributeValue = properties.getJsonObject(name);
                boolean req = required.contains(name);
                String generatedValue = ("id".equals(name) && stepName != null && !"routeConfiguration".equals(stepName)) ? "'" + stepName + "-' + uuidv4().substring(0,4)" : null;
                String attributeType = getAttributeType(attributeValue, req, definitions, generatedValue);
                String r = req ? "" : "?";
                name = name.equals("constructor") ? "_constructor" : name; // exception for YAMLDataFormat
                if (className.equals("ChoiceDefinition") && name.equals("steps")) { // exception for ChoiceDefinition
                } else if (className.equals("SwitchDefinition") && name.equals("steps")) { // exception for SwitchDefinition
                } else if (className.equals("KameletDefinition") && name.equals("steps")) { // exception for KameletDefinition
                } else {
                    attrs.add("    " + name + r + ": " + attributeType);
                }
            });
        }
        String s2 = attrs.stream().collect(Collectors.joining(";\n")) + ((attrs.isEmpty()) ? "" : ";");
        return String.format(readFileText(modelTemplate), className, s2);
    }

    private Comparator<String> getComparator(String stepName) {
        String json = getMetaModel(stepName);
        if (json != null) {
            JsonObject props = new JsonObject(json).getJsonObject("properties");
            List propsLowerCase = props.getMap().keySet().stream().map(s -> s.toLowerCase()).collect(Collectors.toList());
            return Comparator.comparing(e -> {
                if (propsLowerCase.contains(e.toLowerCase())) return propsLowerCase.indexOf(e.toLowerCase());
                else return propsLowerCase.size() + 1;
            });
        }
        return Comparator.comparing(s -> 0);
    }

    private String getAttributeType(JsonObject attribute, boolean required, JsonObject definitions, String generatedValue) {
        if (attribute.containsKey("$ref")) {
            String classFullName = attribute.getString("$ref");
            JsonObject clazz = getDefinition(definitions, classFullName);
            String oneOfString = (clazz.containsKey("oneOf") && clazz.getJsonArray("oneOf").getJsonObject(0).getString("type").equals("string")) ? " | string" : "";
            String className = classSimple(classFullName);
            if (className.equals("SagaActionUriDefinition")) return "string" + (required ? " = ''" : ""); // exception for SagaActionUriDefinition
            if (className.equals("ToDefinition")) return "string" + (required ? " = ''" : ""); // exception for ToDefinition (in REST Methods)
            if (className.equals("ToDynamicDefinition")) return "string" + (required ? " = ''" : ""); // exception for ToDynamicDefinition (in REST Methods)
            return className + (required ? " = new " + className + "()" : oneOfString);
        } else if (attribute.containsKey("type") && attribute.getString("type").equals("array")) {
            JsonObject items = attribute.getJsonObject("items");
            if (items.containsKey("$ref") && items.getString("$ref").equals("#/items/definitions/org.apache.camel.model.ProcessorDefinition")) {
                return "CamelElement[] = []";
            } else if (items.containsKey("$ref")) {
                String className = classSimple(items.getString("$ref"));
                return className + "[] = []";
            } else {
                return items.getString("type") + "[] = []";
            }
        } else if (attribute.containsKey("type") && attribute.getString("type").equals("object")) {
            return "any = {}";
        } else {
            String defaultValue = generatedValue != null ? " = " + generatedValue : (required ? " = ''" : "");
            return attribute.getString("type") + defaultValue;
        }
    }
}
