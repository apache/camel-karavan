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
import io.vertx.core.json.JsonObject;
import org.apache.camel.builder.RouteBuilder;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.stream.Collectors;

public final class CamelComponentsGenerator {

    @Inject
    Vertx vertx;

    private static final Logger LOGGER = Logger.getLogger(KameletGenerator.class.getName());

    public static void main(String[] args) throws Exception {
        CamelComponentsGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelComponentsGenerator g = new CamelComponentsGenerator();
        g.createCreateComponents("karavan-app/src/main/resources/components");
        g.createCreateComponents("karavan-designer/public/components");
        g.createCreateComponents("karavan-vscode/components");
    }

    private void createCreateComponents(String path) {
        clearDirectory(Paths.get(path).toFile());
        List<String> components = getComponents();
        StringBuilder list = new StringBuilder();
        components.forEach(name -> {
            String json = getComponent(name);
            JsonObject obj = new JsonObject(json);
            obj.remove("componentProperties");
            if (!obj.getJsonObject("component").getBoolean("deprecated")
            && !obj.getJsonObject("component").getString("name").equals("kamelet")){
                saveFile(path, name + ".json", obj.toString());
                list.append(name).append("\n");
            }
        });
        saveFile(path, "components.properties", list.toString());
    }

    public void saveFile(String folder, String fileName, String text) {
//        LOGGER.info("Creating component " + fileName);
        try {
            File targetFile = Paths.get(folder, fileName).toFile();
            Files.copy(new ByteArrayInputStream(text.getBytes()), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            e.printStackTrace();
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

    void clearDirectory(File directoryToBeDeleted) {
        File[] allContents = directoryToBeDeleted.listFiles();
        if (allContents != null) {
            for (File file : allContents) {
                if (!file.getName().endsWith("gitignore")) file.delete();
            }
        }
    }
}
