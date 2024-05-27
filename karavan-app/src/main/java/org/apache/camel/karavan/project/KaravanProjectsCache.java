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
package org.apache.camel.karavan.project;

import jakarta.enterprise.inject.Default;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.model.*;
import org.apache.camel.karavan.status.model.GroupedKey;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Default
@Singleton
public class KaravanProjectsCache {

    private final Map<String, Project> projects = new ConcurrentHashMap<>();
    private final Map<String, ProjectFile> files = new ConcurrentHashMap<>();

    public static final String DEFAULT_ENVIRONMENT = "dev";

    public List<Project> getProjects() {
        return new ArrayList<>(projects.values());
    }

    public void saveProject(Project project) {
        var key = GroupedKey.create(project.getProjectId(), DEFAULT_ENVIRONMENT, project.getProjectId());
        projects.put(key, project);
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        return files.values().stream().filter(pf -> Objects.equals(pf.getProjectId(), projectId)).toList();
    }

    public Map<String, ProjectFile> getProjectFilesMap(String projectId) {
        return files.entrySet().stream().filter(es -> !Objects.isNull(es.getValue()) && Objects.equals(es.getValue().getProjectId(), projectId))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        List<ProjectFile> list = files.values().stream().filter(pf -> Objects.equals(pf.getProjectId(), projectId) && Objects.equals(pf.getName(), filename)).toList();
        return !list.isEmpty() ? list.get(0) : null;
    }

    public List<ProjectFile> getProjectFilesByName(String filename) {
        return files.values().stream().filter(pf -> Objects.equals(pf.getName(), filename)).toList();
    }

    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProjectId(), DEFAULT_ENVIRONMENT, file.getName()), file);
    }

    public void saveProjectFiles(Map<String, ProjectFile> filesToSave) {
        long lastUpdate = Instant.now().toEpochMilli();
        filesToSave.forEach((groupedKey, projectFile) -> projectFile.setLastUpdate(lastUpdate));
        files.putAll(filesToSave);
    }

    public void deleteProject(String projectId) {
        projects.remove(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT, projectId));
    }

    public void deleteProjectFile(String projectId, String filename) {
        files.remove(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT, filename));
    }

    public Project getProject(String projectId) {
        return projects.get(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT, projectId));
    }
}
