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
package org.apache.camel.karavan.service;

import org.apache.camel.karavan.model.GitRepo;
import org.apache.camel.karavan.model.GitRepoFile;
import org.apache.camel.karavan.model.ProjectFile;

import java.util.*;
import java.util.stream.Collectors;

public class ServiceUtil {

    public static final String APPLICATION_PROPERTIES_FILENAME = "application.properties";
    public static final Map<String, String> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", "64Mi",
            "requests.cpu", "250m",
            "limits.memory", "512Mi",
            "limits.cpu", "1000m"
    );


    public static Map<String, String> getRunnerContainerResourcesMap(ProjectFile propertiesFile, boolean isOpenshift, boolean isQuarkus) {
        if (!isQuarkus) {
            return DEFAULT_CONTAINER_RESOURCES;
        } else {
            Map<String, String> result = new HashMap<>();
            String patternPrefix = isOpenshift ? "quarkus.openshift.resources." : "quarkus.kubernetes.resources.";
            String devPatternPrefix = "%dev." + patternPrefix;

            List<String> lines = propertiesFile.getCode().lines().collect(Collectors.toList());

            DEFAULT_CONTAINER_RESOURCES.forEach((key, value) -> {
                Optional<String> dev = lines.stream().filter(l -> l.startsWith(devPatternPrefix + key)).findFirst();
                if (dev.isPresent()) {
                    result.put(key, ServiceUtil.getValueForProperty(dev.get(), devPatternPrefix + key));
                } else {
                    Optional<String> prod = lines.stream().filter(l -> l.startsWith(patternPrefix + key)).findFirst();
                    if (prod.isPresent()){
                        result.put(key, ServiceUtil.getValueForProperty(prod.get(), patternPrefix + key));
                    } else {
                        result.put(key, value);
                    }
                }
            });
            return result;
        }
    }

    public static String getPropertiesFile(GitRepo repo) {
        try {
            for (GitRepoFile e : repo.getFiles()){
                if (e.getName().equalsIgnoreCase(APPLICATION_PROPERTIES_FILENAME)) {
                    return e.getBody();
                }
            }
        } catch (Exception e) {

        }
        return null;
    }

    public static String capitalize(String str) {
        if(str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    public static String getProperty(String file, String property) {
        String prefix = property + "=";
        return  Arrays.stream(file.split(System.lineSeparator())).filter(s -> s.startsWith(prefix))
                .findFirst().orElseGet(() -> "")
                .replace(prefix, "");
    }

    public static String getValueForProperty(String line, String property) {
        String prefix = property + "=";
        return  line.replace(prefix, "");
    }

    public static String getProjectDescription(String file) {
        String description = getProperty(file, "camel.jbang.project-description");
        return description != null && !description.isBlank() ? description : getProperty(file, "camel.karavan.project-description");
    }

    public static String getProjectName(String file) {
        String name = getProperty(file, "camel.jbang.project-name");
        return name != null && !name.isBlank() ? name : getProperty(file, "camel.karavan.project-name");
    }

    public static String getProjectRuntime(String file) {
        return getProperty(file, "camel.jbang.runtime");
    }
}
