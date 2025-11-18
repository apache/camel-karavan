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

import io.quarkiverse.infinispan.embedded.Embedded;
import io.quarkus.runtime.ShutdownEvent;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.service.AuthService;
import org.infinispan.Cache;
import org.infinispan.manager.EmbeddedCacheManager;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.DEV;
import static org.apache.camel.karavan.KaravanConstants.PLATFORM_PREFIX;
import static org.apache.camel.karavan.service.AuthService.USER_ADMIN;

@Default
@Singleton
public class KaravanCache {

    private static final Logger LOGGER = Logger.getLogger(KaravanCache.class.getName());

    @Embedded("ProjectFolder")
    Cache<String, ProjectFolder> folders;
    @Embedded("ProjectFile")
    Cache<String, ProjectFile> files;
    @Embedded("ProjectFileCommited")
    Cache<String, ProjectFileCommited> filesCommited;

    @Embedded("DeploymentStatus")
    Cache<String, DeploymentStatus> deploymentStatuses;
    @Embedded("PodContainerStatus")
    Cache<String, PodContainerStatus> podContainerStatuses;
    @Embedded("ServiceStatus")
    Cache<String, ServiceStatus> serviceStatuses;
    @Embedded("CamelStatus")
    Cache<String, CamelStatus> camelStatuses;

    @Embedded("AccessUser")
    Cache<String, AccessUser> users;
    @Embedded("AccessPassword")
    Cache<String, AccessPassword> passwords;
    @Embedded("AccessRole")
    Cache<String, AccessRole> roles;
    @Embedded("AccessSession")
    Cache<String, AccessSession> sessions;

    final Map<String, Map<String, Instant>> projectActivities = new ConcurrentHashMap<>();

    @Inject
    EmbeddedCacheManager cacheManager;

    void onShutdown(@Observes ShutdownEvent event) {
        if (cacheManager.isDefaultRunning()) {
            cacheManager.stop();
        }
    }

    public String getTemplate(String name, String className, String template) {
        return getTemplate(name, className, template, 0, true);
    }

    public String getTemplate(String name, String className, String template, long lifespan, Boolean indexing) {
        var json = new JsonObject(template);
        var firstKey = json.fieldNames().iterator().next();
        json.getJsonObject(firstKey).put("name", name);
        if (indexing) {
            json.getJsonObject(firstKey).getJsonObject("indexing").getJsonArray("indexed-entities").add(PLATFORM_PREFIX + "." + className);
        } else {
            json.getJsonObject(firstKey).remove("indexing");
        }
        if (lifespan > 0) {
            var expiration = new JsonObject().put("lifespan", lifespan);
            json.getJsonObject(firstKey).put("expiration", expiration);
        }
        return json.encodePrettily();
    }

    public EmbeddedCacheManager getCacheManager() {
        return cacheManager;
    }

    public List<ProjectFolder> getFolders() {
        return new ArrayList<>(folders.values().stream().toList());
    }

    public void saveProject(ProjectFolder projectFolder) {
        var key = GroupedKey.create(projectFolder.getProjectId(), DEV, projectFolder.getProjectId());
        folders.put(key, projectFolder);
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        return files.<ProjectFile>query("FROM " + ProjectFile.class.getCanonicalName() + " WHERE projectId = :projectId")
                .setParameter("projectId", projectId)
                .execute().list();
    }

    public Map<String, ProjectFile> getProjectFilesMap(String projectId) {
        return getProjectFiles(projectId).stream()
                .collect(Collectors.toMap(ProjectFile::getName, ProjectFile::copy));
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        var list = files.<ProjectFile>query("FROM " + ProjectFile.class.getCanonicalName() + " WHERE projectId = :projectId AND name = :filename")
                .setParameter("projectId", projectId)
                .setParameter("filename", filename)
                .execute().list();
        return list.isEmpty() ? null : list.getFirst();
    }

    public List<ProjectFile> getProjectFilesByName(String filename) {
        return files.<ProjectFile>query("FROM " + ProjectFile.class.getCanonicalName() + " WHERE name = :filename")
                .setParameter("filename", filename)
                .execute().list();
    }

    public void saveProjectFile(ProjectFile file, boolean commited) {
        var key = GroupedKey.create(file.getProjectId(), DEV, file.getName());
        files.put(key, file);
        if (commited) {
            filesCommited.put(key, ProjectFileCommited.fromFile(file));
        }
    }

    public void syncFilesCommited(String projectId, List<String> fileNames) {
        List<String> currentFileNames = new ArrayList<>();
        getProjectFilesCommited(projectId).stream().filter(file -> fileNames.contains(file.getName()))
                .forEach(pf -> currentFileNames.add(pf.getName()));

        currentFileNames.forEach(name -> deleteProjectFileCommited(projectId, name));
        getProjectFiles(projectId).stream().filter(file -> fileNames.contains(file.getName()))
                .forEach(f -> saveProjectFileCommited(ProjectFileCommited.fromFile(f)));
    }

    public void saveProjectFiles(Map<String, ProjectFile> filesToSave) {
        long lastUpdate = Instant.now().toEpochMilli();
        filesToSave.forEach((groupedKey, projectFile) -> {
            projectFile.setLastUpdate(lastUpdate);
            saveProjectFile(projectFile, false);
        });
    }

    public void deleteProjectFile(String projectId, String filename) {
        var key = GroupedKey.create(projectId, DEV, filename);
        files.remove(key);
    }

    public List<ProjectFileCommited> getProjectFilesCommited(String projectId) {
        return filesCommited.<ProjectFileCommited>query("FROM " + ProjectFileCommited.class.getCanonicalName() + " WHERE projectId = :projectId")
                .setParameter("projectId", projectId)
                .execute().list();
    }

    public ProjectFileCommited getProjectFileCommited(String projectId, String filename) {
        var list = filesCommited.<ProjectFileCommited>query("FROM " + ProjectFileCommited.class.getCanonicalName() + " WHERE projectId = :projectId AND name = :filename")
                .setParameter("projectId", projectId)
                .setParameter("filename", filename)
                .execute().list();
        return list.isEmpty() ? null : list.getFirst();
    }

    public void deleteProjectFileCommited(String projectId, String filename) {
        filesCommited.remove(GroupedKey.create(projectId, DEV, filename));
    }

    public void saveProjectFileCommited(ProjectFileCommited file) {
        filesCommited.put(GroupedKey.create(file.getProjectId(), DEV, file.getName()), file);
    }

    public void deleteProject(String projectId) {
        var key = GroupedKey.create(projectId, DEV, projectId);
        folders.remove(key);
    }

    public ProjectFolder getProject(String projectId) {
        return folders.get(GroupedKey.create(projectId, DEV, projectId));
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
        return new ArrayList<>(deploymentStatuses.values().stream().toList());
    }

    public List<DeploymentStatus> getDeploymentStatuses(String env) {
        return deploymentStatuses.<DeploymentStatus>query("FROM " + DeploymentStatus.class.getCanonicalName() + " WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
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
        return new ArrayList<>(serviceStatuses.values().stream().toList());
    }

    public List<PodContainerStatus> getPodContainerStatuses() {
        return new ArrayList<>(podContainerStatuses.values().stream().toList());
    }

    public List<PodContainerStatus> getPodContainerStatuses(String projectId, String env) {
        return podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public PodContainerStatus getPodContainerStatus(String projectId, String env, String containerName) {
        return getPodContainerStatus(GroupedKey.create(projectId, env, containerName));
    }

    public PodContainerStatus getPodContainerStatus(String containerName, String env) {
        return getPodContainerStatuses(env).stream().filter(el -> Objects.equals(el.getContainerName(), containerName)).findFirst().orElse(null);
    }

    public PodContainerStatus getPodContainerStatus(String key) {
        return podContainerStatuses.get(key);
    }

    public PodContainerStatus getBuildPodContainerStatus(String projectId, String env) {
        var list = podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE projectId = :projectId AND env = :env AND type = :type")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .setParameter("type", ContainerType.build)
                .execute().list();
        return list.isEmpty() ? null : list.getFirst();
    }

    public PodContainerStatus getDevModePodContainerStatus(String projectId, String env) {
        var list = podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE projectId = :projectId AND env = :env AND type = :type")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .setParameter("type", ContainerType.devmode)
                .execute().list();
        return list.isEmpty() ? null : list.getFirst();
    }

    public List<PodContainerStatus> getPodContainerStatuses(String env) {
        return podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public List<PodContainerStatus> getAllContainerStatuses() {
        return new ArrayList<>(podContainerStatuses.values().stream().toList());
    }

    public void savePodContainerStatus(PodContainerStatus status) {
        podContainerStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName()), status);
    }

    public void deletePodContainerStatus(PodContainerStatus status) {
        podContainerStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName()));
    }

    public void deleteAllPodContainersStatuses() {
        podContainerStatuses.clear();
    }

//    public void deletePodContainerStatus(String projectId, String env, String containerName) {
//        podContainerStatuses.remove(GroupedKey.create(projectId, env, containerName));
//    }
//
//    public CamelStatus getCamelStatus(String projectId, String env, String containerName) {
//        var key = GroupedKey.create(projectId, env, containerName);
//        return camelStatuses.get(key);
//    }
//
//    public CamelStatus getCamelStatus(String key) {
//        return camelStatuses.get(key);
//    }

    public List<CamelStatus> getCamelStatusesByName(CamelStatusValue.Name name) {
        var allStatuses = new ArrayList<>(camelStatuses.values().stream().toList());
        return allStatuses.stream().map(cs -> {
            var status = cs.copy();
            var values = new ArrayList<>(status.getStatuses());
            status.setStatuses(values.stream().filter(v -> Objects.equals(v.getName().toString(), name.name())).toList());
            return status;
        }).toList();
    }

    public List<CamelStatus> getCamelAllStatuses() {
        return new ArrayList<>(camelStatuses.values().stream().toList());
    }

    public List<CamelStatus> getCamelStatusesByProjectAndEnv(String projectId, String env) {
        return camelStatuses.<CamelStatus>query("FROM " + CamelStatus.class.getCanonicalName() + " WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public void saveCamelStatus(CamelStatus status) {
        var key = GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName());
        camelStatuses.put(key, status);
    }

    public void deleteCamelStatus(String projectId, String name, String env) {
        var key = GroupedKey.create(projectId, env, name);
        camelStatuses.remove(key);
    }

    public void deleteCamelStatuses(String projectId, String env) {
        var list = camelStatuses.<CamelStatus>query("FROM " + CamelStatus.class.getCanonicalName() + " WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
        if (!list.isEmpty()) {
            list.forEach(s -> {
                var key = GroupedKey.create(projectId, env, s.getContainerName());
                camelStatuses.remove(key);
            });
        }
    }

    public void deleteAllCamelStatuses() {
        camelStatuses.clear();
    }

    public List<PodContainerStatus> getLoadedDevModeStatuses() {
        return podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE type = :type AND codeLoaded = true")
                .setParameter("type", ContainerType.devmode)
                .execute().list();
    }

    public List<PodContainerStatus> getDevModeStatuses() {
        return podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE type = :type")
                .setParameter("type", ContainerType.devmode)
                .execute().list();
    }

    public List<PodContainerStatus> getContainerStatusByEnv(String env) {
        return podContainerStatuses.<PodContainerStatus>query("FROM " + PodContainerStatus.class.getCanonicalName() + " WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    // Access
    public AccessPassword getPassword(String username) {
        return passwords.get(username);
    }

    public AccessUser getUser(String username) {
        return users.get(username);
    }

    public AccessRole getRole(String name) {
        return roles.get(name);
    }

    public List<AccessUser> getUsers() {
        return new ArrayList<>(users.values().stream().toList());
    }
    public List<AccessRole> getRoles() {
        return new ArrayList<>(roles.values().stream().toList());
    }

    public void saveUser(AccessUser user) {
        users.put(user.username, user);
    }
    public void savePassword(AccessPassword pass) {
        passwords.put(pass.username, pass);
    }

    public void saveRole(AccessRole role) {
        roles.put(role.name, role);
    }

    public void deleteUser(String username) {
        if (!USER_ADMIN.equals(username)) {
            users.remove(username);
        }
    }

    public void deleteRole(AccessRole role) {
        if (!AuthService.getAllRoles().contains(role.name)) {
            roles.remove(role.name, role);
        }
    }

    // Sessions
    public AccessSession getAccessSession(String sessionsId) {
        return sessions.get(sessionsId);
    }

    public void saveAccessSession(AccessSession session) {
        sessions.put(session.sessionId, session, 12 * 60, TimeUnit.MINUTES); // 12h absolute
    }

    public void deleteAccessSession(String sessionId) {
        sessions.remove(sessionId);
    }

    public void clearAllStatuses() {
        deploymentStatuses.clear();
        podContainerStatuses.clear();
        camelStatuses.clear();
    }

    // Activity
    public void saveActivityProject(String projectId, String userName, Instant timestamp) {
        var map = projectActivities.getOrDefault(projectId, new HashMap<>());
        map.put(userName, timestamp);
        projectActivities.put(projectId, map);
    }

    public Map<String, Map<String, Instant>> getCopyProjectActivities() {
        return Map.copyOf(projectActivities);
    }

    public void clearExpiredActivity(Instant limit) {
        getCopyProjectActivities().forEach((projectId, activities) -> {
            Map<String, Instant> acts = new HashMap<>();
            activities.forEach((userName, timestamp) -> {
                if (timestamp.isAfter(limit)) {
                    acts.put(userName, timestamp);
                }
            });
            projectActivities.put(projectId, acts);
        });
    }

    public void stopCacheManager() {
        if (cacheManager != null) {
            cacheManager.stop();
        }
    }
}