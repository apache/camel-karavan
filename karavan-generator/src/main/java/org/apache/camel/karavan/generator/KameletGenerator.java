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
import org.apache.camel.kamelets.catalog.KameletsCatalog;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public class KameletGenerator extends AbstractGenerator {

    @Inject
    Vertx vertx;

    public static void generate() throws Exception {
        KameletGenerator g = new KameletGenerator();
        g.createKamelets("karavan-app/src/main/resources/kamelets", true);
        g.createKamelets("karavan-vscode/kamelets", false);
        g.createKamelets("karavan-designer/public/kamelets", false);
    }

    public void createKamelets(String folder, boolean addList) {
        clearDirectory(Paths.get(folder).toFile());
        KameletsCatalog catalog = new KameletsCatalog();
        StringBuilder list = new StringBuilder();
        catalog.getKamelets().entrySet().stream()
                .map(k -> k.getValue().getMetadata().getName())
                .forEach(name -> {
                    saveKamelet(folder, name);
                    list.append(name).append("\n");
                });
        saveFile(folder, "kamelets.properties", list.toString());
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
