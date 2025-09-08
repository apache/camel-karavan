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
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

public final class CamelDefinitionYamlStepGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/CamelDefinitionYamlStep.header.ts";
    final static String modelFooter = "karavan-generator/src/main/resources/CamelDefinitionYamlStep.footer.ts";
    final static String modelTemplate = "karavan-generator/src/main/resources/CamelDefinitionYamlStep.ts";
    final static String targetModel = "karavan-core/src/core/api/CamelDefinitionYamlStep.ts";

    public CamelDefinitionYamlStepGenerator(String rootPath) {
        super(rootPath);
    }

    public static void main(String[] args) throws Exception {
        CamelDefinitionYamlStepGenerator.generate(args[0]);
        System.exit(0);
    }

    public static void generate(String rootPath) throws Exception {
        CamelDefinitionYamlStepGenerator g = new CamelDefinitionYamlStepGenerator(rootPath);
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
        camelModel.append("import {CamelUtil} from './CamelUtil';\n");
        camelModel.append("import {CamelMetadataApi} from '../model/CamelMetadata';\n");
        camelModel.append("import {ComponentApi} from './ComponentApi';\n\n");


        camelModel.append("export class CamelDefinitionYamlStep { \n\n");

        // generate create functions for Definitions
        modelList.forEach(classFullName -> {
            String model = generateModelApi(classFullName, definitions.getJsonObject(classFullName));
            camelModel.append(model).append(System.lineSeparator());
        });
        // generate readStep function
        Map<String, String> stepNames = getProcessorDefinitionStepNameMap();
        StringBuilder cs = new StringBuilder(
                "    static readStep = (body: any, clone: boolean = false): CamelElement => {\n" +
                "        const name = Object.getOwnPropertyNames(body)[0];\n" +
                "        const newBody = CamelUtil.camelizeBody(name, body[name], clone);\n" +
                "        switch (name) { \n"
        );
        stepNames.forEach((className, stepName) -> {
            String code = String.format("            case '%1$s': return CamelDefinitionYamlStep.read%2$s(newBody);\n", stepName, className);
            cs.append(code);
        });
        cs.append(
                "            default: return new CamelElement('');\n" +
                "        }\n" +
                "    }\n");
        camelModel.append(cs);

        camelModel.append(readFileText(modelFooter));

        camelModel.append("}\n");
        writeFileText(targetModel, camelModel.toString());
    }

    private String generateModelApi(String classFullName, JsonObject obj) {
        String className = classSimple(classFullName);
        String stepName = getStepNameForClass(className);

        String s1 = getStringToRequired(obj, className);
        AtomicReference<String> s3 = new AtomicReference<>("");

        Map<String, JsonObject> properties = getClassProperties(stepName, obj);

        Map<String, String> attrs = new HashMap<>();
        properties.keySet().stream().sorted(getComparator(stepName)).forEach(aName -> {
            if (aName.equals("uri")) {
                s3.set("\n        def = ComponentApi.parseElementUri(def);");
            }
            JsonObject aValue = properties.get(aName);
            boolean attributeIsArray = isAttributeRefArray(aValue);
            String attributeArrayClass = getAttributeArrayClass(aName, aValue);

            if (attributeIsArray && aName.equals("steps") && ! className.equals("ChoiceDefinition") && ! className.equals("SwitchDefinition") && ! className.equals("KameletDefinition")) {
                attrs.put(aName, "        def.steps = CamelDefinitionYamlStep.readSteps(element?.steps);\n");
            } else if (attributeIsArray && !aName.equals("steps") && !attributeArrayClass.equals("string") && !getDeprecatedClasses().contains(attributeArrayClass)&& !Objects.equals(aName, "allowableValues")) { // exception for allowableValues
                String format = Arrays.asList("intercept", "interceptFrom", "interceptSendToEndpoint", "onCompletion", "onException").contains(aName)
                        ? "        def.%1$s = element && element?.%1$s ? element?.%1$s.map((x:any) => CamelDefinitionYamlStep.read%2$s(x.%1$s)) :[]; \n"
                        : "        def.%1$s = element && element?.%1$s ? element?.%1$s.map((x:any) => CamelDefinitionYamlStep.read%2$s(x)) :[]; \n";

                String code = String.format(format, aName, attributeArrayClass);
                attrs.put(aName, code);
            } else if (isAttributeRef(aValue) && getAttributeClass(aValue).equals("ExpressionDefinition")) { // Expressions implicits
                String code = String.format(
                        "        if (element?.%1$s !== undefined) { \n" +
                                "            def.%1$s = CamelDefinitionYamlStep.read%2$s(element.%1$s); \n" +
                                "        } else {\n" +
                                "            const languageName: string | undefined = Object.keys(element).filter(key => CamelMetadataApi.hasLanguage(key))[0] || undefined;\n" +
                                "            if (languageName){\n" +
                                "                const exp:any = {};\n" +
                                "                exp[languageName] = element[languageName]\n" +
                                "                def.%1$s = CamelDefinitionYamlStep.readExpressionDefinition(exp);\n" +
                                "                delete (def as any)[languageName];\n" +
                                "            }\n" +
                                "        }\n"
                        , aName, getAttributeClass(aValue));
                attrs.put(aName, code);
            } else if (isAttributeRef(aValue)
                    && !getAttributeClass(aValue).equals("SagaActionUriDefinition") // SagaActionUriDefinition is exception
                    && !getAttributeClass(aValue).equals("ToDefinition") // exception for ToDefinition (in REST Methods)
                    && !getAttributeClass(aValue).equals("ToDynamicDefinition") // exception for ToDynamicDefinition (in REST Methods)
                    && !getDeprecatedClasses().contains(getAttributeClass(aValue)) // exception for deprecated classes
            ) {
                String attributeClass = getAttributeClass(aValue);
                var excludeProperty  = excludeProperty(stepName, aName, attributeClass);
                if (!excludeProperty) {
                    String code = String.format(
                            "        if (element?.%1$s !== undefined) { \n" +
                                    "            if (Array.isArray(element.%1$s)) { \n" +
                                    "               def.%1$s = CamelDefinitionYamlStep.read%2$s(element.%1$s[0]); \n" +
                                    "            } else { \n" +
                                    "               def.%1$s = CamelDefinitionYamlStep.read%2$s(element.%1$s); \n" +
                                    "            } \n" +
                                    "        } \n"
                            , aName, getAttributeClass(aValue));
                    attrs.put(aName, code);
                }
            } else  if ("YAMLDataFormat".equals(className) && "constructor".equals(aName)) {
                String yamlConstructor =
                        "        if (element.constructor !== undefined) {\n" +
                        "            def._constructor = element.constructor;\n" +
                        "            delete (def as any).constructor;\n" +
                        "        }";
                attrs.put(aName, yamlConstructor);
            }
        });

        return String.format(readFileText(modelTemplate), className, s1, s3, attrs.values().stream().collect(Collectors.joining("")));
    }

    private String getStringToRequired(JsonObject obj, String className) {
        if (className.equals("FromDefinition")) {
            return "if (element && typeof element === 'string') element = { uri: element};";
        } else if (obj.containsKey("oneOf") && obj.containsKey("required")) {
            List<String> list = obj.getJsonArray("required").getList();
            list = list.stream().filter(o -> !o.equals("steps")).collect(toList());
            return "if (element && typeof element === 'string') element = {" + list.get(0) + ": element};";
        } else {
            return "";
        }
    }
}
