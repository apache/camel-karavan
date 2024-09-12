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

import io.vertx.core.json.JsonArray;
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

        List<String> modelList = getClasses(definitions, "org.apache.camel");
        modelList.forEach(classFullName -> {
            String model = generateModel(classFullName, definitions.getJsonObject(classFullName), definitions);
            camelModel.append(model).append(System.lineSeparator());
        });
        writeFileText(targetModel, camelModel.toString());
    }

    private String generateModel(String classFullName, JsonObject obj, JsonObject definitions) {

        String className = classSimple(classFullName);
        String stepName = getStepNameForClass(className);
        Map<String, JsonObject> properties = getClassProperties(stepName, obj);

        List<String> required = obj.containsKey("required") ? obj.getJsonArray("required").getList() : List.of();
        List<String> attrs = new ArrayList<>();
        if (className.endsWith("Definition")) {
            attrs.add("    stepName?: string = '" + stepName + "'");
        } else if (className.endsWith("Expression")) {
            attrs.add("    expressionName?: string = '" + stepName + "'");
        } else if (className.endsWith("DataFormat")) {
            attrs.add("    dataFormatName?: string = '" + stepName + "'");
        }

        properties.keySet().stream().sorted(getComparator(stepName)).forEach(name -> {
            JsonObject attributeValue = properties.get(name);
            boolean req = required.contains(name);
            String generatedValue = ("id".equals(name) && stepName != null && !"routeConfiguration".equals(stepName)) ? "'" + stepName + "-' + uuidv4().substring(0,4)" : null;
            String attributeType = getAttributeType(name, attributeValue, req, definitions, generatedValue);

            var excludeProperty  = excludeProperty(stepName, name, attributeType);

            String r = req ? "" : "?";
            name = name.equals("constructor") ? "_constructor" : name; // exception for YAMLDataFormat
            if (className.equals("ChoiceDefinition") && name.equals("steps")) { // exception for ChoiceDefinition
            } else if (className.equals("SwitchDefinition") && name.equals("steps")) { // exception for SwitchDefinition
            } else if (className.equals("KameletDefinition") && name.equals("steps")) { // exception for KameletDefinition
            } else if ((className.equals("ParamDefinition") || className.equals("ResponseHeaderDefinition")) && name.equals("allowableValues")) { // exception for ParamDefinition
                attrs.add("    " + name + r + ": string [] = []");
            } else if (excludeProperty) {

            } else if (!Objects.equals(attributeType, "null")) {
                attrs.add("    " + name + r + ": " + attributeType);
            }
        });

        String s2 = String.join(";\n", attrs) + ((attrs.isEmpty()) ? "" : ";");
        return String.format(readFileText(modelTemplate), className, s2);
    }

    private String getAttributeType(String stepName, JsonObject attribute, boolean required, JsonObject definitions, String generatedValue) {
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
            } else if (items.containsKey("properties") && items.getJsonObject("properties").containsKey(stepName)) {
                String className = classSimple(items.getJsonObject("properties").getJsonObject(stepName).getString("$ref"));
                return className + "[] = []";
            } else {
                return items.getString("type") + "[] = []";
            }
        } else if (attribute.containsKey("type") && attribute.getString("type").equals("object")) {
            return "any = {}";
        } else if (attribute.containsKey("type") && attribute.getString("type").equals("number")) {
            String defaultValue = generatedValue != null ? " = " + generatedValue : (required ? " = 0" : "");
            return attribute.getString("type") + defaultValue;
        } else {
            String defaultValue = generatedValue != null ? " = " + generatedValue : (required ? " = ''" : "");
            return attribute.getString("type") + defaultValue;
        }
    }
}
