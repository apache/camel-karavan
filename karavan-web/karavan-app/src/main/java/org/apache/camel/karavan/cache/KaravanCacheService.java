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
package org.apache.camel.karavan.cache;

import com.hazelcast.config.ClasspathXmlConfig;
import com.hazelcast.config.ClasspathYamlConfig;
import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import com.hazelcast.query.Predicate;
import com.hazelcast.query.Predicates;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.cache.model.*;
import org.jboss.logging.Logger;

import java.io.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Default
@Singleton
public class KaravanCacheService {

    private final Config config = new ClasspathYamlConfig("hazelcast.yaml");
    private final HazelcastInstance hz = Hazelcast.getOrCreateHazelcastInstance(config);

    private IMap<GroupedKey, Project> projects;
    private IMap<GroupedKey, ProjectFile> files;
    private IMap<GroupedKey, DeploymentStatus> deploymentStatuses;
    private IMap<GroupedKey, ContainerStatus> containerStatuses;
    private IMap<GroupedKey, Boolean> transits;
    private IMap<GroupedKey, ServiceStatus> serviceStatuses;
    private IMap<GroupedKey, CamelStatus> camelStatuses;


    private final AtomicBoolean ready = new AtomicBoolean(false);
    private static final Logger LOGGER = Logger.getLogger(KaravanCacheService.class.getName());

    private static final String DEFAULT_ENVIRONMENT = "dev";

    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("KaravanCacheService is starting");
        projects = hz.getMap(Project.CACHE);
        files = hz.getMap(ProjectFile.CACHE);
        deploymentStatuses = hz.getMap(DeploymentStatus.CACHE);
        containerStatuses = hz.getMap(ContainerStatus.CACHE);
        transits = hz.getMap("transits");
        serviceStatuses = hz.getMap(ServiceStatus.CACHE);
        camelStatuses = hz.getMap(CamelStatus.CACHE);
        LOGGER.info("KaravanCacheService is started");
        ready.set(true);

    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("KaravanCacheService is stopped");
        ready.set(false);
    }

    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project) {
        GroupedKey key = GroupedKey.create(project.getProjectId(), DEFAULT_ENVIRONMENT, project.getProjectId());
        projects.put(key, project);
        projects.put(key, project);
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        Predicate<GroupedKey, ProjectFile> predicate = Predicates.equal("projectId", projectId);
        return files.values(predicate).stream().toList();
    }

    public Map<GroupedKey, ProjectFile> getProjectFilesMap(String projectId) {
        Predicate<GroupedKey, ProjectFile> predicate = Predicates.equal("projectId", projectId);
        return files.entrySet(predicate).stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        Predicate<GroupedKey, ProjectFile> predicate = Predicates.and(
                Predicates.equal("name", filename),
                Predicates.equal("projectId", projectId)
        );
        List<ProjectFile> list = files.values(predicate).stream().toList();
        return !list.isEmpty() ? list.get(0) : null;
    }

    public List<ProjectFile> getProjectFilesByName(String filename) {
        Predicate<GroupedKey, ProjectFile> predicate = Predicates.equal("name", filename);
        return files.values(predicate).stream().toList();
    }

    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProjectId(), DEFAULT_ENVIRONMENT, file.getName()), file);
    }

    public void saveProjectFiles(Map<GroupedKey, ProjectFile> filesToSave) {
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

    public DeploymentStatus getDeploymentStatus(String projectId, String environment) {
        return deploymentStatuses.get(GroupedKey.create(projectId, environment, projectId));
    }

    public void saveDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()), status);
    }

    public void deleteDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()));
    }

    public List<DeploymentStatus> getDeploymentStatuses() {
        return new ArrayList<>(deploymentStatuses.values());
    }

    public List<DeploymentStatus> getDeploymentStatuses(String env) {
        Predicate<GroupedKey, DeploymentStatus> predicate = Predicates.equal("env", env);
        return deploymentStatuses.values(predicate).stream().toList();
    }

    public void deleteAllDeploymentsStatuses() {
        deploymentStatuses.clear();
    }

    public void saveServiceStatus(ServiceStatus status) {
        serviceStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()), status);
    }

    public void deleteServiceStatus(ServiceStatus status) {
        serviceStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()));
    }

    public List<ServiceStatus> getServiceStatuses() {
        return new ArrayList<>(serviceStatuses.values());
    }

    public List<Boolean> getTransits() {
        return new ArrayList<>(transits.values());
    }

    public Boolean getTransit(String projectId, String env, String containerName) {
        return transits.get(GroupedKey.create(projectId, env, containerName));
    }

    public void setTransit(String projectId, String env, String containerName) {
        transits.put(GroupedKey.create(projectId, env, containerName), true);
    }

    public List<ContainerStatus> getContainerStatuses() {
        return new ArrayList<>(containerStatuses.values());
    }

    public List<ContainerStatus> getContainerStatuses(String projectId, String env) {
        Predicate<GroupedKey, ContainerStatus> predicate = Predicates.and(
                Predicates.equal("projectId", projectId),
                Predicates.equal("env", env)
        );
        return containerStatuses.values(predicate).stream().toList();
    }

    public ContainerStatus getContainerStatus(String projectId, String env, String containerName) {
        return getContainerStatus(GroupedKey.create(projectId, env, containerName));
    }

    public ContainerStatus getContainerStatus(GroupedKey key) {
        return containerStatuses.get(key);
    }

    public ContainerStatus getDevModeContainerStatus(String projectId, String env) {
        return containerStatuses.get(GroupedKey.create(projectId, env, projectId));
    }

    public List<ContainerStatus> getContainerStatuses(String env) {
        Predicate<GroupedKey, ContainerStatus> predicate = Predicates.and(
                Predicates.equal("env", env)
        );
        return containerStatuses.values(predicate).stream().toList();
    }

    public List<ContainerStatus> getAllContainerStatuses() {
        return new ArrayList<>(containerStatuses.values());
    }

    public void saveContainerStatus(ContainerStatus status) {
        containerStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName()), status);
    }

    public void deleteContainerStatus(ContainerStatus status) {
        containerStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName()));
    }

    public void deleteAllContainersStatuses() {
        containerStatuses.clear();
    }

    public void deleteContainerStatus(String projectId, String env, String containerName) {
        containerStatuses.remove(GroupedKey.create(projectId, env, containerName));
    }

    public CamelStatus getCamelStatus(String projectId, String env, String containerName) {
        GroupedKey key = GroupedKey.create(projectId, env, containerName);
        return camelStatuses.get(key);
    }

    public CamelStatus getCamelStatus(GroupedKey key) {
        return camelStatuses.get(key);
    }

    public List<CamelStatus> getCamelStatusesByEnv(CamelStatusValue.Name name) {
        return camelStatuses.values().stream().map(cs -> {
            var values = cs.getStatuses();
            cs.setStatuses(values.stream().filter(v -> Objects.equals(v.getName(), name)).toList());
            return cs;
        }).toList();
    }

    public List<CamelStatus> getCamelStatusesByProjectAndEnv(String projectId, String env) {
        Predicate<GroupedKey, CamelStatus> predicate = Predicates.and(
                Predicates.equal("projectId", projectId),
                Predicates.equal("env", env)
        );
        return camelStatuses.values(predicate).stream().toList();
    }

    public void saveCamelStatus(CamelStatus status) {
        GroupedKey key = GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName());
        camelStatuses.put(key, status);
    }

    public void deleteCamelStatus(String projectId, String name, String env) {
        GroupedKey key = GroupedKey.create(projectId, env, name);
        camelStatuses.remove(key);
    }

    public void deleteCamelStatuses(String projectId, String env) {
        Predicate<GroupedKey, CamelStatus> predicate = Predicates.and(
                Predicates.equal("projectId", projectId),
                Predicates.equal("env", env)
        );
        camelStatuses.values(predicate).forEach(s -> {
            GroupedKey key = GroupedKey.create(projectId, env, s.getContainerName());
            camelStatuses.remove(key);
        });
    }

    public void deleteAllCamelStatuses() {
        camelStatuses.clear();
    }

    public List<ContainerStatus> getLoadedDevModeStatuses() {
        Predicate<GroupedKey, ContainerStatus> predicate = Predicates.and(
                Predicates.equal("type", ContainerStatus.ContainerType.devmode),
                Predicates.equal("codeLoaded", true)
        );
        return containerStatuses.values(predicate).stream().toList();
    }

    public List<ContainerStatus> getDevModeStatuses() {
        Predicate<GroupedKey, ContainerStatus> predicate = Predicates.and(
                Predicates.equal("type", ContainerStatus.ContainerType.devmode)
        );
        return containerStatuses.values(predicate).stream().toList();
    }

    public List<ContainerStatus> getContainerStatusByEnv(String env) {
        Predicate<GroupedKey, ContainerStatus> predicate = Predicates.and(
                Predicates.equal("env", env)
        );
        return containerStatuses.values(predicate).stream().toList();
    }

    public void clearAllStatuses() {
        deploymentStatuses.clear();
        containerStatuses.clear();
        camelStatuses.clear();
    }

    private String getResourceFile(String path) {
        try {
            InputStream inputStream = KaravanCacheService.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isReady() {
        return ready.get();
    }
}
