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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public final class CamelModelGenerator {

    public static void main(String[] args) throws Exception {
        CamelModelGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelModelGenerator g = new CamelModelGenerator();
        g.createModels(
                "karavan-generator/src/main/resources/camel-yaml-dsl.json",
                "karavan-generator/src/main/resources/camel-model.template",
                "karavan-generator/src/main/resources/camel-metadata.template",
                "karavan-designer/src/designer/model/CamelModel.tsx",
                "karavan-designer/src/designer/api/CamelApi.tsx",
                "karavan-designer/src/designer/api/CamelMetadata.tsx"
        );
    }

    private void createModels(String source, String template, String metadataTemplate, String targetModel, String targetApi, String targetMetadata) throws Exception {
        Vertx vertx = Vertx.vertx();

        Buffer buffer = vertx.fileSystem().readFileBlocking(source);
        JsonObject definitions = new JsonObject(buffer).getJsonObject("items").getJsonObject("definitions");

        Buffer templateBuffer = vertx.fileSystem().readFileBlocking(template);


        StringBuilder camelModel = new StringBuilder();
        camelModel.append(templateBuffer.toString());

        // generate properties for elements
        Map<String, List<ElementProp>> models = new HashMap<>();
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
                .filter(e -> !e.getKey().equals("step") )
                .collect(Collectors.toMap(
                        e -> e.getKey(),
                        e -> e.getValue()
                )).forEach((s, o) -> {
                    String name = camelize(s, "-");
                    String className = classNameFromRef(procList.getJsonObject(s).getString("$ref"));
                    processors.put(className, name);
                });
        procList.getMap().entrySet().stream()
                .filter(e -> !e.getKey().equals("step") )
                .forEach((s) -> {
                    String name = camelize(s.getKey(), "-");
                    String className = classNameFromRef(procList.getJsonObject(s.getKey()).getString("$ref"));
                    JsonObject props = getProperties(definitions, className);
                    List<ElementProp> elProps = generateElementProp(name, props, definitions, processors);
                    models.put(name, elProps);
                });

        // generate models code
        models.forEach((name, elementProps) -> {
            String pcode = generateElementCode(name, elementProps);
            camelModel.append(pcode).append(System.lineSeparator());
            if (!name.equalsIgnoreCase("otherwise") && !name.equalsIgnoreCase("when")){
                camelModel.append(generateStepCode(name)).append(System.lineSeparator());
            }
        });

        vertx.fileSystem().writeFileBlocking(targetModel, Buffer.buffer(camelModel.toString()));


        //  generate API
        StringBuilder camelApi = new StringBuilder();
        camelApi.append(
                "/**\n" +
                        " * Generated by karavan build tools - do NOT edit this file!\n" +
                        " */\n");
        camelApi.append("import {");
        camelApi.append("    CamelElement, \n");
        camelApi.append("    ProcessorStep, \n");
        camelApi.append("    FromStep, \n");
        camelApi.append("    Expression, \n");
        processors.values().forEach(s -> {
            if (s.equalsIgnoreCase("otherwise")) {
                camelApi.append("    Otherwise, \n");
            } else if (s.equalsIgnoreCase("when")) {
                    camelApi.append("    When, \n");
            } else {
                camelApi.append("    ").append(s).append("Step, \n");
            }
        });
        camelApi.append("} from '../model/CamelModel' \n\n");

        camelApi.append("export class CamelApi { \n\n");

        camelApi.append(getTemplateFile("CamelApi.camelize.tx").concat("\n").concat("\n"));

        camelApi.append(
                "    static createStep = (name: string, body: any): CamelElement => {\n" +
                        "       switch (name){\n" +
                        "            case 'from': return CamelApi.createFrom(body)\n" +
                        "            case 'expression': return CamelApi.createExpression(body)\n");
        processors.values().forEach(s ->
                camelApi.append("            case '").append(deCapitalize(s)).append("': return CamelApi.create").append(capitalize(s)).append("(body)\n"));
        camelApi.append("            default: return new ProcessorStep('') \n");
        camelApi.append("        }\n");
        camelApi.append("    }\n");


        camelApi.append(
                "    static createExpression = (element: any): Expression => {\n" +
                        "        return new Expression({...element})\n" +
                        "    }\n");
        camelApi.append(createCreateFunction("from", models.get("from")));
        processors.values().forEach((model) -> camelApi.append(createCreateFunction(model, models.get(model))));


        camelApi.append(
                "    static createSteps = (elements: any[] | undefined): ProcessorStep[] => {\n" +
                        "        const result: ProcessorStep[] = []\n" +
                        "        if (elements !== undefined){\n" +
                        "            elements.forEach(e => {\n" +
                        "                const stepName = Object.keys(e).filter(key => !['uuid', 'dslName'].includes(key))[0];\n" +
                        "                result.push(CamelApi.createStep(CamelApi.camelizeName(stepName, '-', true), e));\n" +
                        "            })\n" +
                        "        }\n" +
                        "        return result\n" +
                        "    }\n\n");


        camelApi.append(
                "    static elementFromStep = (step: CamelElement): CamelElement => {\n" +
                        "        switch (step.dslName){\n" +
                        "            case 'fromStep' : return (step as FromStep).from\n");
        processors.values().forEach(s -> {
            if (s.equalsIgnoreCase("otherwise")) {
                camelApi.append("            case 'otherwise': return (step as Otherwise)\n");
            } else if (s.equalsIgnoreCase("when")){
                camelApi.append("            case 'when': return (step as When)\n");
            } else {
                camelApi.append("            case '").append(deCapitalize(s)).append("Step': return (step as ").append(capitalize(s)).append("Step).").append(deCapitalize(s)).append("\n");
            }
        });
        camelApi.append(
                "            default : return new CamelElement('')\n" +
                        "        }\n" +
                        "    }\n");

        // addStep functions
        camelApi.append(
                "    static addStep = (steps: ProcessorStep[], step: ProcessorStep, parentId: string): ProcessorStep[] => {\n" +
                        "        const result: ProcessorStep[] = [];\n" +
                        "        steps.forEach(el => {\n" +
                        "            switch (el.dslName) {\n" );
        models.entrySet().forEach(s -> {
            String name = deCapitalize(s.getKey());
            String stepClass = capitalize(s.getKey()).concat("Step");
            String stepField = deCapitalize(s.getKey()).concat("Step");

            if (name.equals("choice")){
                camelApi.append(getTemplateFile("CamelApi.addStep.choiceStep.tx").concat("\n"));
            } else if (name.equals("otherwise")){
                camelApi.append(getTemplateFile("CamelApi.addStep.otherwise.tx").concat("\n"));
            } else if (name.equals("when")){
                camelApi.append(getTemplateFile("CamelApi.addStep.when.tx").concat("\n"));
            } else if (s.getValue().stream().filter(e -> e.name.equals("steps")).count() > 0) {
                camelApi.append(String.format(
                        "                case '%1$s':\n" +
                                "                    const %3$sChildren = (el as %2$s).%3$s?.steps || [];\n" +
                                "                    if (el.uuid === parentId) %3$sChildren.push(step)\n" +
                                "                    else (el as %2$s).%3$s.steps = CamelApi.addStep(%3$sChildren, step, parentId);\n" +
                                "                    break;\n",
                        stepField, stepClass, name));
            }
        });
        camelApi.append(
                "            }\n" +
                        "            result.push(el);\n" +
                        "        })\n" +
                        "        return result;\n" +
                        "    }\n\n");


        // deleteStep functions
        camelApi.append(
                "    static deleteStep = (steps: ProcessorStep[] | undefined, uuidToDelete: string): ProcessorStep[] => {\n" +
                        "        const result: ProcessorStep[] = []\n" +
                        "        if (steps !== undefined){\n" +
                        "            steps.forEach(step => {\n" +
                        "                if (step.uuid !== uuidToDelete){\n" +
                        "                    switch (step.dslName){\n" );
        models.entrySet().forEach(s -> {
            String name = deCapitalize(s.getKey());
            String stepClass = capitalize(s.getKey()).concat("Step");
            String stepField = deCapitalize(s.getKey()).concat("Step");
            if (name.equals("otherwise")) {
                camelApi.append("                        case 'otherwise': (step as Otherwise).steps = CamelApi.deleteStep((step as Otherwise).steps, uuidToDelete); break;\n");
            } else if (name.equals("when")){
                camelApi.append("                        case 'when': (step as When).steps = CamelApi.deleteStep((step as When).steps, uuidToDelete); break;\n");
            } else if (name.equals("choice")){
                camelApi.append("                        case 'choiceStep':\n" +
                        "                            const otherwise = (step as ChoiceStep).choice.otherwise;\n" +
                        "                            if (otherwise && otherwise.uuid === uuidToDelete) {\n" +
                        "                                (step as ChoiceStep).choice.otherwise = undefined;\n" +
                        "                            } else if (otherwise && otherwise.uuid !== uuidToDelete) {\n" +
                        "                                otherwise.steps = CamelApi.deleteStep(otherwise.steps, uuidToDelete);\n" +
                        "                                (step as ChoiceStep).choice.otherwise = otherwise;\n" +
                        "                            }\n" +
                        "                            (step as ChoiceStep).choice.when = CamelApi.deleteWhen((step as ChoiceStep).choice.when, uuidToDelete);\n" +
                        "                            break;\n");
            } else if (s.getValue().stream().filter(e -> e.name.equals("steps")).count() > 0){
                camelApi.append(String.format("                        case '%s': (step as %s).%s.steps = CamelApi.deleteStep((step as %s).%s.steps, uuidToDelete); break;\n",
                        stepField, stepClass, name, stepClass,name));
            }
        });
        camelApi.append(
                "                    }\n" +
                        "                    result.push(step);\n" +
                        "                }\n" +
                        "            })\n" +
                        "        }\n" +
                        "        return result\n" +
                        "    }\n\n");
        camelApi.append(getTemplateFile("CamelApi.deleteWhen.tx").concat("\n\n"));

        // Expression language finder
        camelApi.append("    static getExpressionLanguage = (init?: Partial<Expression>): string | undefined => {\n");
        models.get("expression").forEach(el -> {
            if (!el.name.equals("language"))
                camelApi.append(String.format("        if (init?.%s) return '%s'\n", el.name, el.name));
        });
        camelApi.append("        return undefined;\n");
        camelApi.append("    }\n");

        camelApi.append("}\n").append(System.lineSeparator());

        vertx.fileSystem().writeFileBlocking(targetApi, Buffer.buffer(camelApi.toString()));


        // Generate Metadata
        Buffer metadataBuffer = vertx.fileSystem().readFileBlocking(metadataTemplate);
        StringBuilder metadata = new StringBuilder(metadataBuffer.toString());

        metadata.append("export const Languages: [string, string, string][] = [\n");
        models.get("expression").forEach(el -> {
            String name = el.name;
            String json = getMetaModel(name);
            JsonObject model = new JsonObject(json).getJsonObject("model");
            String title = model.getString("title");
            String description = model.getString("description");
            metadata.append(String.format("    ['%s','%s',\"%s\"],\n", name, title, description));
        });
        metadata.append("]\n");


        metadata.append("export const Metadata: ElementMeta[] = [\n");
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
                    String displayName = p != null && p.containsKey("displayName") ? p.getString("displayName") : pname;
                    String desc = p != null && p.containsKey("description") ? p.getString("description") : pname;
                    String en = p != null && p.containsKey("enum") ? p.getString("enum").replace("[", "").replace("]", "") : "";
                    String type = p != null && p.containsKey("desc") ? p.getString("type") : el.type;
                    Boolean required = p != null && p.containsKey("required") ? p.getBoolean("required") : false;
                    Boolean secret = p != null && p.containsKey("secret") ? p.getBoolean("secret") : false;
                    metadata.append(String.format("        new PropertyMeta('%s', '%s', \"%s\", '%s', '%s', %b, %b, %b, %b),\n", pname, displayName, desc, type, en, required, secret, el.isArray, (el.isArray ? el.isArrayTypeClass : el.isObject)));
                });
                metadata.append("    ]),\n");
            }
        });
        metadata.append("]\n");
        vertx.fileSystem().writeFileBlocking(targetMetadata, Buffer.buffer(metadata.toString()));
    }

    private String createCreateFunction(String name, List<ElementProp> elProps) {
        if (name.equalsIgnoreCase("otherwise")){
            return getTemplateFile("CamelApi.createOtherwise.tx").concat("\n\n");
        } else if (name.equalsIgnoreCase("when")){
            return getTemplateFile("CamelApi.createWhen.tx").concat("\n\n");
        } else if (name.equalsIgnoreCase("choice")){
            return getTemplateFile("CamelApi.createChoice.tx").concat("\n\n");
        }
        String stepClass = capitalize(name).concat("Step");
        String stepField = deCapitalize(name).concat("Step");
        String elementName = deCapitalize(name);
        String funcName = "create".concat(capitalize(name));
        StringBuilder f = new StringBuilder();
        f.append(String.format("    static %s = (element: any): %s => {\n", funcName, stepClass));
        f.append(String.format("        const %1$s = element ? new %2$s({...element.%3$s}) : new %2$s()\n", stepField, stepClass, elementName));
        elProps.stream().forEach(e -> {
            if (e.name.equals("steps")) {
                f.append(String.format("        %s.%s.steps = CamelApi.createSteps(element?.%s?.steps)\n", stepField, elementName, elementName));
            } else if (e.isArray && e.isArrayTypeClass) {
                f.append(String.format("        %1$s.%2$s.%3$s = element && element?.%2$s ? element?.%2$s?.%3$s.map((x:any) => CamelApi.create%4$s(x)) :[]\n", stepField, elementName, e.name, e.arrayType));
            } else if (e.isObject) {
                f.append(String.format("        %s.%s.%s = CamelApi.create%s(element?.%s?.%s)\n", stepField, elementName, e.name, e.type, elementName, e.name));
            }
        });
        f.append(String.format("        %s.uuid = element?.uuid ? element.uuid : %s.uuid\n", stepField, stepField));
        f.append(String.format("        return %s\n", stepField));
        f.append("    }\n\n");
        return f.toString();
    }

    private String createCamelElements(Map<String, String> processors) {
        StringBuilder camelElements = new StringBuilder();
        camelElements.append("export const CamelElements: string[] = [").append(System.lineSeparator());
        camelElements.append("'").append("from").append("',").append(System.lineSeparator());
        camelElements.append("'").append("expression").append("',").append(System.lineSeparator());
        processors.values().stream().forEach(s -> {
            camelElements.append("'").append(deCapitalize(s)).append("',").append(System.lineSeparator());
        });
        camelElements.append("]").append(System.lineSeparator());
        return camelElements.toString();
    }

    private JsonObject getProperties(JsonObject definitions, String classname) {
        JsonObject props = definitions.getJsonObject(classname).getJsonObject("properties");
        JsonArray oneOf = definitions.getJsonObject(classname).getJsonArray("oneOf");
        if (props != null) {
            return props;
        } else {
            return oneOf.getJsonObject(1).getJsonObject("properties");
        }
    }

    private List<ElementProp> generateElementProp(String name, JsonObject properties, JsonObject definitions, Map<String, String> processors) {
        List<ElementProp> props = new ArrayList<>();
        Set<String> keys = new HashSet<>();
        properties.getMap().forEach((s, o) -> {
            String propName = deCapitalize(camelize(s, "-"));
            boolean notStepsForChoice = !(name.equalsIgnoreCase("Choice") && propName.equals("steps"));
            boolean notStepsForKamelet = !(name.equalsIgnoreCase("Kamelet") && propName.equals("steps"));
            if (!keys.contains(propName) && notStepsForChoice && notStepsForKamelet) {
                String type = properties.getJsonObject(s).getString("type");
                String ref = properties.getJsonObject(s).getString("$ref");
                if (type != null) {
                    if (type.equals("array") && isArrayTypeIsClass(properties.getJsonObject(s))) {
                        String arrayTypeClass = getArrayTypeClass(properties.getJsonObject(s));
                        String arrayType = processors.get(arrayTypeClass);
                        if (arrayType != null) {
                            String typeCode = propName.equals("when") ? getTypeCode(type, arrayType) : getTypeCode(type, arrayType.concat("Step"));
                            props.add(new ElementProp(propName, type, false, true, true, arrayType, false, typeCode));
                        } else if (arrayTypeClass.equals("org.apache.camel.model.ProcessorDefinition")) {
                            props.add(new ElementProp(propName, type, false, true, true, arrayType, true, getTypeCode(type, "ProcessorStep")));
                        }
                    } else if (type.equals("array") && !isArrayTypeIsClass(properties.getJsonObject(s))) {
                        String arrayType = getArrayType(properties.getJsonObject(s));
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

    private String generateStepCode(String name) {
        StringBuilder element = new StringBuilder();
        element.append("export class ").append(capitalize(name)).append("Step extends ProcessorStep {").append(System.lineSeparator());
        element.append(getTabs(1)).append(deCapitalize(name)).append(": ").append(capitalize(name)).append(" = new ").append(capitalize(name)).append("()").append(System.lineSeparator());
        element.append(System.lineSeparator());
        element.append(getTabs(1)).append("public constructor(init?: Partial<").append(capitalize(name)).append(">) {").append(System.lineSeparator());
        element.append(getTabs(2)).append("super('").append(deCapitalize(name)).append("Step')").append(System.lineSeparator());
        element.append(getTabs(2)).append("Object.assign(this, {").append(deCapitalize(name)).append(": new ").append(capitalize(name)).append("({...init})})").append(System.lineSeparator());
        element.append(getTabs(1)).append("}").append(System.lineSeparator());
        element.append("}").append(System.lineSeparator());
        return element.toString();
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


    private boolean isClassOneOfString(String classname, JsonObject definitions) {
        return definitions.getJsonObject(classname).containsKey("oneOf") && definitions.getJsonObject(classname).getJsonArray("oneOf").getJsonObject(0).getString("type").equals("string");
    }


    private String camelize(String name, String separator) {
        return Arrays.stream(name.split(separator)).map(s -> capitalize(s)).collect(Collectors.joining());
    }

    private String capitalize(String str) {
        return str.length() == 0 ? str
                : str.length() == 1 ? str.toUpperCase()
                : str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private String deCapitalize(String str) {
        return str.length() == 0 ? str
                : str.length() == 1 ? str.toLowerCase()
                : str.substring(0, 1).toLowerCase() + str.substring(1);
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

    public String getTemplateFile(String name) {
        try {
            InputStream inputStream = CamelModelGenerator.class.getClassLoader().getResourceAsStream(name);
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

}
