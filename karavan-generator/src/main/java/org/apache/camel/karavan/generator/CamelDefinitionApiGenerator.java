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
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

public final class CamelDefinitionApiGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/CamelDefinitionApi.header.ts";
    final static String modelFooter = "karavan-generator/src/main/resources/CamelDefinitionApi.footer.ts";
    final static String modelTemplate = "karavan-generator/src/main/resources/CamelDefinitionApi.ts";
    final static String targetModel = "karavan-core/src/core/api/CamelDefinitionApi.ts";

    public static void main(String[] args) throws Exception {
        CamelDefinitionApiGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelDefinitionApiGenerator g = new CamelDefinitionApiGenerator();
        g.createCamelDefinitions();
    }

    private void createCamelDefinitions() throws Exception {
        StringBuilder camelModel = new StringBuilder();
        camelModel.append(readFileText(modelHeader));

        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        List<String> modelList = getClasses(definitions, "org.apache.camel");
        modelList.forEach(classFullName -> {
            String className = classSimple(classFullName);
            camelModel.append("    ").append(className).append(",\n");
        });
        camelModel.append("} from '../model/CamelDefinition';\n");
        camelModel.append("import {CamelUtil} from './CamelUtil';\n\n");


        camelModel.append("export class CamelDefinitionApi { \n\n");

        // generate create functions for Definitions
        modelList.forEach(classFullName -> {
            String model = generateModelApi(classFullName, definitions.getJsonObject(classFullName));
            camelModel.append(model).append(System.lineSeparator());
        });

        // generate createStep function
        Map<String, String> stepNames  = getProcessorStepName(new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("properties"));
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.ProcessorDefinition").getJsonObject("properties")));
        StringBuilder cs = new StringBuilder(
                "    static createStep = (name: string, body: any, clone: boolean = false): CamelElement => {\n" +
                "       const newBody = CamelUtil.camelizeBody(name, body, clone);\n" +
                "       switch (name) { \n"
        );
        getClasses(definitions, "org.apache.camel")
                .forEach(className -> {
                    String code = String.format("            case '%1$s': return CamelDefinitionApi.create%1$s(newBody);\n", classSimple(className));
                    cs.append(code);
                });
        cs.append(
                "            default: return new CamelElement('');\n" +
                "        }\n" +
                "    }\n\n");
        camelModel.append(cs);

        // generate createExpression function
        stepNames.clear();
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.language.ExpressionDefinition").getJsonObject("properties")));
        StringBuilder ce = new StringBuilder(
                "    static createExpression = (name: string, body: any): CamelElement => {\n" +
                        "       const newBody = CamelUtil.camelizeBody(name, body, false);\n" +
                        "       delete newBody.expressionName;\n" +
                        "       delete newBody.dslName;\n" +
                        "       switch (name) { \n"
        );
        stepNames.forEach((className, stepName) -> {
            String code = String.format("            case '%1$s': return CamelDefinitionApi.create%1$s(newBody);\n", className);
            ce.append(code);
        });
        ce.append(
                "            default: return new SimpleExpression(newBody);\n" +
                        "        }\n" +
                        "    }\n\n");
        camelModel.append(ce);

        // generate createDataFormat function
        stepNames.clear();
        stepNames.putAll(getProcessorStepName(definitions.getJsonObject("org.apache.camel.model.dataformat.DataFormatsDefinition").getJsonObject("properties")));
        StringBuilder df = new StringBuilder(
                "    static createDataFormat = (name: string, body: any): CamelElement => {\n" +
                        "       const newBody = CamelUtil.camelizeBody(name, body, false);\n" +
                        "       delete newBody.dataFormatName;\n" +
                        "       delete newBody.dslName;\n" +
                        "       switch (name) { \n"
        );
        stepNames.forEach((className, stepName) -> {
            String code = String.format("            case '%1$s': return CamelDefinitionApi.create%1$s(newBody);\n", className);
            df.append(code);
        });
        df.append(
                "            default: return new JsonDataFormat(newBody);\n" +
                        "        }\n" +
                        "    }\n");
        camelModel.append(df);

        camelModel.append(readFileText(modelFooter));

        camelModel.append("}\n");
        writeFileText(targetModel, camelModel.toString());
    }

    private String generateModelApi(String classFullName, JsonObject obj) {
        String className = classSimple(classFullName);

        JsonObject properties = obj.containsKey("oneOf")
                ? obj.getJsonArray("oneOf").getJsonObject(1).getJsonObject("properties")
                : obj.getJsonObject("properties");

        List<String> attrs = new ArrayList<>();
        AtomicBoolean hasId = new AtomicBoolean(false);
        if (properties != null) {
            properties.getMap().keySet().forEach(name -> {
                JsonObject aValue = properties.getJsonObject(name);
                if ("id".equals(name)) {
                    hasId.set(true);
                }
                if (isAttributeRefArray(aValue) && name.equals("steps") && ! className.equals("ChoiceDefinition") && ! className.equals("SwitchDefinition") && ! className.equals("KameletDefinition")) {
                    attrs.add("        def.steps = CamelDefinitionApi.createSteps(element?.steps);");
                } else if (isAttributeRefArray(aValue) && !name.equals("steps")) {
                    String code = String.format(
                            "        def.%1$s = element && element?.%1$s ? element?.%1$s.map((x:any) => CamelDefinitionApi.create%2$s(x)) :[];"
                            , name, getAttributeArrayClass(aValue));
                    attrs.add(code);
                } else if (isAttributeRef(aValue)
                        && !getAttributeClass(aValue).equals("SagaActionUriDefinition") // SagaActionUriDefinition is exception
                        && !getAttributeClass(aValue).equals("ToDefinition") // exception for ToDefinition (in REST Methods)
                        && !getAttributeClass(aValue).equals("ToDynamicDefinition") // exception for ToDynamicDefinition (in REST Methods)
                ) {
                    String attributeClass = getAttributeClass(aValue);
                    String template = attributeClass.equals("ExpressionDefinition")
                            ? "        def.%1$s = CamelDefinitionApi.create%2$s(element.%1$s); \n"
                            : "        if (element?.%1$s !== undefined) { \n" +
                            "            def.%1$s = CamelDefinitionApi.create%2$s(element.%1$s); \n" +
                            "        }";
                    String code = String.format(template, name, getAttributeClass(aValue));
                    attrs.add(code);
                } else {

                }
            });
        }
        String stringToRequired = getStringToRequired(obj, className);
        String s2 = stringToRequired.isEmpty() ? "" : "\n" + stringToRequired;
        String s3 = attrs.size() > 0 ? "\n" + attrs.stream().collect(Collectors.joining("\n")) : "";
        return String.format(readFileText(modelTemplate), className, s2, s3);
    }

    private String getStringToRequired(JsonObject obj, String className) {
        if (className.equals("FromDefinition")) {
            return "        if (element && typeof element === 'string') {\n" +
                    "            element = { uri: element};\n" +
                    "        }";
        } else if (obj.containsKey("oneOf") && obj.containsKey("required")) {
            List<String> list = obj.getJsonArray("required").getList();
            list = list.stream().filter(o -> !o.equals("steps")).collect(toList());
            return "        if (element && typeof element === 'string') {\n" +
                    "            element = {" + list.get(0) + ": element};\n" +
                    "        }";
        } else {
            return "";
        }
    }

    private boolean isAttributeRefArray(JsonObject attribute) {
        if (attribute.containsKey("type") && attribute.getString("type").equals("array")) {
            JsonObject items = attribute.getJsonObject("items");
            return items.containsKey("$ref");
        } else {
            return false;
        }
    }
}
