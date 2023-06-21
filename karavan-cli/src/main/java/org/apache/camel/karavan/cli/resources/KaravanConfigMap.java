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
package org.apache.camel.karavan.cli.resources;

import io.fabric8.kubernetes.api.model.ConfigMap;
import io.fabric8.kubernetes.api.model.ConfigMapBuilder;
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanConfig;
import org.apache.camel.karavan.cli.ResourceUtils;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.stream.Collectors;

public class KaravanConfigMap {

    private static final String MAVEN_URL = "<url>https://repo.maven.apache.org/maven2/</url>";

    public static ConfigMap getConfigMap(KaravanConfig config) {

        String xml = getXml(config);

        return new ConfigMapBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(Constants.NAME, config.getVersion(), Map.of()))
                .endMetadata()
                .withData(Map.of("maven-settings.xml", xml))
                .build();
    }

    private static String getXml(KaravanConfig config) {
        try {
            InputStream inputStream = KaravanConfigMap.class.getResourceAsStream("/settings.xml");
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines()
                    .map(s -> {
                        if (config.isNexusProxy() && s.contains(MAVEN_URL)) {
                            return s.replace("namespace", config.getNamespace());
                        } else {
                            return s;
                        }
                    })
                    .collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }
}
