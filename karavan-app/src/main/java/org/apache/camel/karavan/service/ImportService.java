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

import io.quarkus.vertx.ConsumeEvent;
import io.smallrye.mutiny.tuples.Tuple2;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@ApplicationScoped
public class ImportService {

    private static final Logger LOGGER = Logger.getLogger(ImportService.class.getName());
    public static final String IMPORT_TEMPLATES = "import-templates";
    public static final String IMPORT_PROJECTS = "import-projects";
    public static final String IMPORT_KAMELETS = "import-kamelets";


    @Inject
    InfinispanService infinispanService;

    @Inject
    GitService gitService;

    @Inject
    CodeService codeService;

    @ConfigProperty(name = "karavan.default-runtime")
    String runtime;

    @ConsumeEvent(value = IMPORT_PROJECTS, blocking = true)
    void importProjects(String data) {
        LOGGER.info("Import projects from Git");
        try {
            List<Tuple2<String, Map<String, String>>> repo = gitService.readProjectsFromRepository();
            repo.forEach(p -> {
                String folderName = p.getItem1();
                String propertiesFile = getPropertiesFile(p);
                String projectName = getProjectName(propertiesFile);
                String projectDescription = getProjectDescription(propertiesFile);
                String runtime = getProjectRuntime(propertiesFile);
                Project project = new Project(folderName, projectName, projectDescription, runtime, "");
                infinispanService.saveProject(project, true);

                p.getItem2().forEach((key, value) -> {
                    ProjectFile file = new ProjectFile(key, value, folderName, Instant.now().toEpochMilli());
                    infinispanService.saveProjectFile(file);
                });
            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
        addTemplates("");
    }

    @ConsumeEvent(value = IMPORT_TEMPLATES, blocking = true)
    void addTemplates(String data) {
        LOGGER.info("Add templates if not exists");
        try {
            Project templates  = infinispanService.getProject(Project.NAME_TEMPLATES);
            if (templates == null) {
                templates = new Project(Project.NAME_TEMPLATES, "Templates", "Templates", "quarkus", "");
                infinispanService.saveProject(templates, true);

                codeService.getApplicationPropertiesTemplates().forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, Project.NAME_TEMPLATES, Instant.now().toEpochMilli());
                    infinispanService.saveProjectFile(file);
                });
            }
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    @ConsumeEvent(value = IMPORT_KAMELETS, blocking = true)
    void loadCustomKamelets(String data) {
        LOGGER.info("Load custom Kamelets from Git");
        try {
            Project kamelets  = infinispanService.getProject(Project.NAME_KAMELETS);
            if (kamelets == null) {
                kamelets = new Project(Project.NAME_KAMELETS, "Custom Kamelets", "Custom Kamelets", "quarkus", "");
                infinispanService.saveProject(kamelets, true);

                List<Tuple2<String, String>> repo = gitService.readKameletsFromRepository();
                repo.forEach(p -> {
                    String name = p.getItem1();
                    String yaml = p.getItem2();
                    ProjectFile file = new ProjectFile(name, yaml, Project.NAME_KAMELETS, Instant.now().toEpochMilli());
                    infinispanService.saveProjectFile(file);
                });
            }
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    private String getPropertiesFile(Tuple2<String, Map<String, String>> p) {
        try {
            for (Map.Entry<String, String> e : p.getItem2().entrySet()){
                if (e.getKey().equalsIgnoreCase("application.properties")) {
                    return e.getValue();
                }
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    private static String capitalize(String str) {
        if(str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private static String getProperty(String file, String property) {
        String prefix = property + "=";
        return  Arrays.stream(file.split(System.lineSeparator())).filter(s -> s.startsWith(prefix))
                .findFirst().orElseGet(() -> "")
                .replace(prefix, "");
    }

    private static String getProjectDescription(String file) {
        String description = getProperty(file, "camel.jbang.project-description");
        return description != null ? description : getProperty(file, "camel.karavan.project-description");
    }

    private static String getProjectName(String file) {
        String name = getProperty(file, "camel.jbang.project-name");
        return name != null ? name : getProperty(file, "camel.karavan.project-name");
    }

    private static String getProjectRuntime(String file) {
        return getProperty(file, "camel.jbang.runtime");
    }
}
