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

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class CamelDataFormatGenerator extends AbstractGenerator {

    public static void main(String[] args) throws Exception {
        CamelDataFormatGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelDataFormatGenerator g = new CamelDataFormatGenerator();
        g.createModels(
                "karavan-generator/src/main/resources/CamelDataFormat.tx",
                "karavan-generator/src/main/resources/CamelDataFormat.template.tx",
                "karavan-core/src/core/model/CamelDataFormat.ts"
        );
    }

    private void createModels(String headerPath, String templatePath, String targetModelPath) throws Exception {

        String camelYamlDSL = getCamelYamlDSL();
        JsonObject definitions = new JsonObject(camelYamlDSL).getJsonObject("items").getJsonObject("definitions");

        List<String> dataFormats = definitions.stream()
                .filter(e -> e.getKey().startsWith("org.apache.camel.model.dataformat"))
                .filter(e -> !e.getKey().endsWith("DataFormatsDefinition"))
                .map(e -> e.getKey())
                .collect(Collectors.toList());

        StringBuilder dataFormatModel = new StringBuilder();
        dataFormatModel.append(readFileText(headerPath));

        for (String name : dataFormats){
            String className = name.replace("org.apache.camel.model.dataformat.", "");
            String template = readFileText(templatePath);
            JsonObject properties = getProperties(definitions, name);
            String model = generateModel(className, template, properties);
            dataFormatModel.append(model);
        }

        writeFileText(targetModelPath, dataFormatModel.toString());
    }

    private String generateModel(String name, String template, JsonObject properties){
        StringBuilder props = new StringBuilder();
        properties.forEach(e -> {
            String propertyName = deCapitalize(camelize(e.getKey(), "-"));
            if (Objects.equals(propertyName, "constructor")){
                propertyName = "_" + propertyName;
            }
            String propertyType = new JsonObject(e.getValue().toString()).getString("type");
            JsonArray enumValues = new JsonObject(e.getValue().toString()).getJsonArray("enum");
            if (Objects.equals(propertyType, "array") ){
                propertyType = "[]";
            } else if (enumValues != null){
                propertyType = enumValues.stream().map(v -> "'" + v.toString() + "'").collect(Collectors.joining(" | "));
            }
            props.append(String.format("    %s?: %s; \n", propertyName, propertyType));
        });

        StringBuilder model = new StringBuilder();
        model.append(String.format(template, name, props)).append("\n");
        return model.toString();
    }

}
