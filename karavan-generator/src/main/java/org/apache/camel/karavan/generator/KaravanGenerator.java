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

import java.nio.file.Paths;

public final class KaravanGenerator {

    public static void main(String[] args) throws Exception {
        String rootPath = args.length > 0 ? args[0] : "";
        boolean all = args.length == 0;
        String[] paths = all
                ? new String[] {"karavan-core/test", "karavan-app/src/main/resources", "karavan-designer/public", "karavan-vscode"}
                : new String[] {"karavan-core/test", "karavan-app/src/main/resources"};
        System.out.println("Generating Root Path: " + rootPath);
        for (String path : paths) {
            System.out.println("    Generating Path: " + path);
            AbstractGenerator.clearDirectory(Paths.get(path + "/metadata").toFile());
        }
        CamelDefinitionGenerator.generate(rootPath);
        CamelDefinitionApiGenerator.generate(rootPath);
        CamelDefinitionYamlStepGenerator.generate(rootPath);
        CamelMetadataGenerator.generate(rootPath);
        KameletGenerator.generate(rootPath, paths);
        CamelComponentsGenerator.generate(rootPath, paths);
        CamelSpiBeanGenerator.generate(rootPath, paths);
        System.exit(0);
    }

}
