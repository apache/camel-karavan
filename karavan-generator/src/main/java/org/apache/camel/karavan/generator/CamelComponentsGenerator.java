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
import org.apache.camel.builder.RouteBuilder;

import java.io.*;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

public final class CamelComponentsGenerator extends AbstractGenerator {

    public CamelComponentsGenerator(String rootPath) {
        super(rootPath);
    }

//    public static void main(String[] args) throws Exception {
//        CamelComponentsGenerator.generate();
//        System.exit(0);
//    }

    public static void generate(String rootPath, String... paths) throws Exception {
        CamelComponentsGenerator g = new CamelComponentsGenerator(rootPath);
        for (String path : paths) {
            g.createCreateComponents(path + "/metadata", true);
        }
    }

    private void createCreateComponents(String path, boolean singleFile) {
        List<String> components = getComponents();
        StringBuilder list = new StringBuilder();
        StringBuilder sources = new StringBuilder("[\n");

        for (int i = 0; i < components.size(); i++) {
            String name = components.get(i);
            String json = getComponent(name);
            JsonObject obj = new JsonObject(json);
            obj.remove("componentProperties");
            if (!obj.getJsonObject("component").getBoolean("deprecated")
                    && !obj.getJsonObject("component").getString("name").equals("kamelet")) {
                if (singleFile) {
                    sources.append(obj).append( i != components.size() - 1 ? "\n,\n" : "\n");
                } else {
                    saveFile(path, name + ".json", obj.toString());
                }
                list.append(name).append("\n");
            }
        }
        if (singleFile) {
            sources.append("]");
            saveFile(path, "components.json", sources.toString());
        }
    }

    public List<String> getComponents() {
        try {
            InputStream inputStream = RouteBuilder.class.getResourceAsStream("/org/apache/camel/catalog/components.properties");
            List<String> data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.toList());
            return data;
        } catch (Exception e) {
            return null;
        }
    }


    public String getComponent(String name) {
        try {
            InputStream inputStream = RouteBuilder.class.getResourceAsStream("/org/apache/camel/catalog/components/" + name + ".json");
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }
}
