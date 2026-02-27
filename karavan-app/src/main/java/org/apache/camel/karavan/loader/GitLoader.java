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
package org.apache.camel.karavan.loader;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.GitHistoryService;
import org.apache.camel.karavan.service.GitService;
import org.apache.camel.karavan.service.ProjectService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.Objects;
import java.util.regex.Pattern;

import static org.apache.camel.karavan.KaravanConstants.DEV;

@ApplicationScoped
public class GitLoader {

    private static final Logger LOGGER = Logger.getLogger(GitLoader.class.getName());

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    ProjectService projectService;

    @Inject
    KaravanCache karavanCache;

    @Inject
    GitService gitService;

    @Inject
    GitHistoryService  gitHistoryService;

    @Inject
    CodeService codeService;

    public void load() throws Exception {
        boolean git = gitService.checkGit();
        LOGGER.info("Starting Project service: git is " + (git ? "ready" : "not ready"));
        if (gitService.checkGit()) {
            projectService.importProjects(false);
            if (Objects.equals(environment, DEV)) {
                addKameletsProject();
                addBuildInProject(ProjectFolder.Type.templates.name());
                addBuildInProject(ProjectFolder.Type.configuration.name());
                addBuildInProject(ProjectFolder.Type.documentation.name());
                addBuildInProject(ProjectFolder.Type.contracts.name());
            }
            gitHistoryService.importCommits();
        } else {
            LOGGER.info("Projects are not ready");
            throw new Exception("Projects are not ready");
        }
    }

    void addKameletsProject() {
        try {
            ProjectFolder kamelets = karavanCache.getProject(ProjectFolder.Type.kamelets.name());
            if (kamelets == null) {
                LOGGER.info("Add custom kamelets project");
                kamelets = new ProjectFolder(ProjectFolder.Type.kamelets.name(), "Custom Kamelets", Instant.now().getEpochSecond() * 1000L, ProjectFolder.Type.kamelets);
                karavanCache.saveProject(kamelets, false);
            }
        } catch (Exception e) {
            LOGGER.error("Error during custom kamelets project creation", e);
        }
    }

    public void addBuildInProject(String projectId) {
        try {
            ProjectFolder projectFolder = karavanCache.getProject(projectId);
            if (projectFolder == null) {
                var title = Pattern.compile("^.").matcher(projectId).replaceFirst(m -> m.group().toUpperCase());
                projectFolder = new ProjectFolder(projectId, title, Instant.now().getEpochSecond() * 1000L, ProjectFolder.Type.valueOf(projectId));
                karavanCache.saveProject(projectFolder, false);

                codeService.getBuildInProjectFiles(projectId).forEach((name, value) -> {
                    ProjectFile file = new ProjectFile(name, value, projectId, Instant.now().getEpochSecond() * 1000L);
                    karavanCache.saveProjectFile(file, null, false);
                });
            } else {
                codeService.getBuildInProjectFiles(projectId).forEach((name, value) -> {
                    ProjectFile f = karavanCache.getProjectFile(projectId, name);
                    if (f == null) {
                        ProjectFile file = new ProjectFile(name, value, projectId, Instant.now().getEpochSecond() * 1000L);
                        karavanCache.saveProjectFile(file, null, false);
                    }
                });
            }
        } catch (Exception e) {
            LOGGER.error("Error during creation of project " + projectId, e);
        }
    }
}
