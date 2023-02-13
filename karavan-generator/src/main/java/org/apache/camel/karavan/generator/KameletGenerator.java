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

import io.fabric8.camelk.v1alpha1.Kamelet;
import org.apache.camel.kamelets.catalog.KameletsCatalog;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class KameletGenerator extends AbstractGenerator {

    public static void generate(String... paths) throws Exception {
        KameletGenerator g = new KameletGenerator();
        for (String path : paths) {
            g.createKamelets(path + "/kamelets", true);
        }
    }

    public void createKamelets(String folder, boolean singleFile) {
        clearDirectory(Paths.get(folder).toFile());
        KameletsCatalog catalog = new KameletsCatalog();
        StringBuilder list = new StringBuilder();
        StringBuilder sources = new StringBuilder();

        List<Map.Entry<String, Kamelet>> kamelets = new ArrayList<>(catalog.getKamelets().entrySet());
        for (int i = 0; i < kamelets.size() ; i++) {
            Map.Entry<String, Kamelet> k = kamelets.get(i);
            String name = k.getValue().getMetadata().getName();
            list.append(name).append("\n");
            if (singleFile) {
                sources.append(readKamelet(name)).append(i != kamelets.size() - 1 ? "\n---\n": "\n");
            } else {
                saveKamelet(folder, name);
            }
        }
        saveFile(folder, "kamelets.properties", list.toString());
        if (singleFile) {
            saveFile(folder, "kamelets.yaml", sources.toString());
        }
    }

    public String readKamelet(String name) {
        String fileName = name + ".kamelet.yaml";
        InputStream inputStream = KameletsCatalog.class.getResourceAsStream("/kamelets/" + fileName);
        return new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))
                .lines()
                .filter(s -> !s.startsWith("#"))
                .collect(Collectors.joining("\n"));
    }

    public void saveKamelet(String folder, String name) {
//        LOGGER.info("Creating kamelet " + name);
        String fileName = name + ".kamelet.yaml";
        InputStream inputStream = KameletsCatalog.class.getResourceAsStream("/kamelets/" + fileName);
        try {
            File targetFile = Paths.get(folder, fileName).toFile();
            Files.copy(inputStream, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (inputStream != null){
                try {
                    inputStream.close();
                } catch (Exception ex){

                }
            }
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
