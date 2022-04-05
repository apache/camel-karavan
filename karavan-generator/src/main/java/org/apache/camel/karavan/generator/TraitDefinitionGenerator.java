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

import org.yaml.snakeyaml.Yaml;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

public final class TraitDefinitionGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/TraitDefinition.header.ts";
    final static String targetModel = "karavan-core/src/core/model/TraitDefinition.ts";

    public static void main(String[] args) throws Exception {
        TraitDefinitionGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        TraitDefinitionGenerator g = new TraitDefinitionGenerator();
        g.createTraitDefinitions();
    }

    private void createTraitDefinitions() throws Exception {
        StringBuilder camelModel = new StringBuilder();
        camelModel.append(readFileText(modelHeader));

        camelModel.append("export class Trait extends CamelElement {\n");
        getTraits().forEach(trait -> {
            camelModel.append(String.format("    %s?: %s;\n", getFieldName(trait.name), getClassName(trait.name)));
        });
        camelModel.append("    public constructor(init?: Partial<Trait>) {\n" +
                "        super('Trait')\n" +
                "        Object.assign(this, init)\n" +
                "    }\n" +
                "}\n");

        // Generate Trait classes
        getTraits().forEach(trait -> {
            String className = getClassName(trait.name);
            camelModel.append(String.format("export class %s extends CamelElement {\n", className));
            trait.properties.forEach(p -> {
                String name = getFieldName(p.name);
                String type = getPropertyType(p.type);
                camelModel.append(String.format("    %s?: %s;\n", name, type));
            });
            camelModel.append(String.format("    public constructor(init?: Partial<%1$s>) {\n" +
                    "        super('%1$s')\n" +
                    "        Object.assign(this, init)\n" +
                    "    }\n" +
                    "}\n\n", className));
        });

        // Generate readTrait
        camelModel.append("export class TraitApi {\n\n" +
                "    static traitsFromYaml(yaml: any) {\n" +
                "        const traits: Trait = new Trait();\n" +
                "        Object.keys(yaml).forEach(key => {\n");
        getTraits().forEach(trait -> {
            String className = getClassName(trait.name);
            String fieldName = getFieldName(trait.name);
            String key = trait.name.equals("3scale") ? "3scale" : fieldName;
            String yamlKey = trait.name.equals("3scale") ? "[\"3scale\"]" : "." + fieldName;
            camelModel.append(String.format("            if (key === '%1$s') traits.%2$s = new %3$s(yaml%4$s.configuration);\n", key, fieldName, className, yamlKey));
        });
        camelModel.append("        });\n" +
                "        return traits;\n" +
                "    }\n\n" +
                "    static cloneTrait(t: Trait) {\n" +
                "        const clone = JSON.parse(JSON.stringify(t));\n" +
                "        const traits: Trait = new Trait();\n" +
                "        Object.keys(clone).forEach(key => {");
        getTraits().forEach(trait -> {
            String className = getClassName(trait.name);
            String fieldName = getFieldName(trait.name);
            camelModel.append(String.format("            if (key === '%1$s') traits.%1$s = new %2$s(clone.%1$s);\n", fieldName, className));
        });
        camelModel.append("        });\n" +
                "        return traits;\n" +
                "    }\n" +
                "}\n\n");

        // Generate Metadata
        camelModel.append("export const CamelTraitMetadata: TraitMeta[] = [");
        getTraits().forEach(trait -> {

            camelModel.append(String.format("    new TraitMeta(\"%s\", %s, \"%s\", \"%s\", [\n", trait.name, trait.platform, trait.profiles, trait.description.replace("\"", "\\\"")));
            camelModel.append(String.format("    ]),\n"));
        });
        camelModel.append("] \n\n");

        writeFileText(targetModel, camelModel.toString());
    }

    String getFieldName(String name) {
        name = name.equals("3scale") ? "ThreeScale" : name; // Exception for 3scaleTrait
        return deCapitalize(camelize(name, "-"));
    }

    String getClassName(String name) {
        name = name.equals("3scale") ? "ThreeScale" : name; // Exception for 3scaleTrait
        return capitalize(camelize(name, "-")) + "Trait";
    }

    String getPropertyType(String type) {
        switch (type) {
            case "bool":
                return "boolean";
            case "[]string":
                return "string[]";
            case "int64":
            case "int32":
                return "number";
            default:
                return "string";
        }
    }

    List<Trait> getTraits() {
        List<Trait> result = new ArrayList<>();
        Yaml yaml = new Yaml();
        String text = getTraitsYaml();
        HashMap<String, List> fromYaml = yaml.load(text);
        List<HashMap<String, Object>> traits = fromYaml.get("traits");
        traits.forEach((t) -> {
            String name = t.get("name").toString();
            boolean platform = Boolean.parseBoolean(t.get("name").toString());
            String profiles = t.get("profiles").toString().replace("[", "").replace("]", "");
            String description = t.get("description").toString();
            List<HashMap<String, String>> properties = (List) t.get("properties");
            Trait trait = new Trait(name, platform, profiles, description,
                    properties.stream().map(m -> new TraitProperty(m.get("name"), m.get("type"), m.get("description"))).collect(Collectors.toList()));
            result.add(trait);
        });
        return result;
    }

    private class Trait {
        String name;
        boolean platform;
        String profiles;
        String description;
        List<TraitProperty> properties;

        public Trait(String name, boolean platform, String profiles, String description, List<TraitProperty> properties) {
            this.name = name;
            this.platform = platform;
            this.profiles = profiles;
            this.description = description;
            this.properties = properties;
        }
    }


    private class TraitProperty {
        String name;
        String type;
        String description;


        public TraitProperty(String name, String type, String description) {
            this.name = name;
            this.type = type;
            this.description = description;
        }
    }
}
