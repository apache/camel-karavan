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

import io.quarkus.runtime.StartupEvent;
import io.quarkus.vertx.ConsumeEvent;
import io.smallrye.mutiny.tuples.Tuple2;
import org.apache.camel.karavan.model.KaravanConfiguration;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@ApplicationScoped
public class KaravanService {

    private static final Logger LOGGER = Logger.getLogger(KaravanService.class.getName());
    public static final String IMPORT_PROJECTS = "import-projects";

    @Inject
    InfinispanService infinispanService;

    @Inject
    GitService gitService;

    @ConfigProperty(name = "karavan.config.runtime")
    String runtime;

    @Inject
    KaravanConfiguration configuration;

    void onStart(@Observes StartupEvent ev) {
    }

    @ConsumeEvent(value = IMPORT_PROJECTS, blocking = true)
    void importProjects(String data) {
        LOGGER.info("Import projects from Git");
        try {
            List<Tuple2<String, Map<String, String>>> repo = gitService.readProjectsFromRepository();
            repo.forEach(p -> {
                String folderName = p.getItem1();
                String name = Arrays.stream(folderName.split("-")).map(s -> capitalize(s)).collect(Collectors.joining(" "));
                Project project = new Project(folderName, name, name, Project.CamelRuntime.valueOf(runtime.toUpperCase()), "");
                infinispanService.saveProject(project);

                AtomicReference<ProjectFile> properties = new AtomicReference<>();
                p.getItem2().forEach((key, value) -> {
                    ProjectFile file = new ProjectFile(key, value, folderName);
                    infinispanService.saveProjectFile(file);
                    if (isApplicationProperties(file)) {
                        properties.set(file);
                    }
                });
                // update project
                if (properties != null){
                    project.setDescription(getProjectDescription(properties.get()));
                    project.setName(getProjectName(properties.get()));
                    infinispanService.saveProject(project);
                }

            });
        } catch (Exception e) {
            LOGGER.error("Error during project import", e);
        }
    }

    private static String capitalize(String str) {
        if(str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private static boolean isApplicationProperties(ProjectFile file) {
        return file.getName().equalsIgnoreCase("application.properties");
    }

    private static String getProperty(ProjectFile file, String property) {
        String prefix = property + "=";
        return  Arrays.stream(file.getCode().split(System.lineSeparator())).filter(s -> s.startsWith(prefix))
                .findFirst().orElseGet(() -> "")
                .replace(prefix, "");
    }

    private static String getProjectDescription(ProjectFile file) {
        return getProperty(file, "camel.jbang.project-description");
    }

    private static String getProjectName(ProjectFile file) {
        return getProperty(file, "camel.jbang.project-name");
    }
}
