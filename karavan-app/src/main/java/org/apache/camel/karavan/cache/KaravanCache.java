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

import io.vertx.core.eventbus.EventBus;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.model.ActivityUser;
import org.apache.camel.karavan.service.AuthService;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.DEV;
import static org.apache.camel.karavan.KaravanEvents.*;
import static org.apache.camel.karavan.cache.CacheEvent.Operation.DELETE;
import static org.apache.camel.karavan.cache.CacheEvent.Operation.SAVE;
import static org.apache.camel.karavan.cache.CacheUtils.query;
import static org.apache.camel.karavan.cache.CacheUtils.queryFirst;
import static org.apache.camel.karavan.service.AuthService.USER_ADMIN;

@Default
@Singleton
public class KaravanCache {

    @Inject
    EventBus eventBus;

    static final Logger LOGGER = Logger.getLogger(KaravanCache.class.getName());

    final Map<String, ProjectFolder> folders = new ConcurrentHashMap<>();
    final Map<String, ProjectFolderCommited> foldersCommited = new ConcurrentHashMap<>();
    final Map<String, ProjectFile> files = new ConcurrentHashMap<>();
    final Map<String, ProjectFileCommited> filesCommited = new ConcurrentHashMap<>();

    final Map<String, DeploymentStatus> deploymentStatuses = new ConcurrentHashMap<>();
    final Map<String, PodContainerStatus> podContainerStatuses = new ConcurrentHashMap<>();
    final Map<String, ServiceStatus> serviceStatuses = new ConcurrentHashMap<>();
    final Map<String, CamelStatus> camelStatuses = new ConcurrentHashMap<>();

    final Map<String, AccessUser> users = new ConcurrentHashMap<>();
    final Map<String, AccessPassword> passwords = new ConcurrentHashMap<>();
    final Map<String, AccessRole> roles = new ConcurrentHashMap<>();
    final Map<String, AccessSession> sessions = new ConcurrentHashMap<>();

    final Map<String, Map<String, Instant>> projectActivities = new ConcurrentHashMap<>();
    final Map<String, ActivityUser> usersWorking = new ConcurrentHashMap<>();
    final Map<String, ActivityUser> usersHeartBeat = new ConcurrentHashMap<>();

    final Map<String, List<ProjectFolderCommit>> lastFolderCommits = new ConcurrentHashMap<>();
    final Map<String, SystemCommit> systemCommits = new ConcurrentHashMap<>();

    public List<ProjectFolderCommit> getProjectLastCommits(String projectId) {
        return lastFolderCommits.get(projectId);
    }

    public void saveProjectLastCommits(String projectId, List<ProjectFolderCommit> commits) {
        lastFolderCommits.put(projectId, commits);
    }

    public void saveSystemCommit(SystemCommit commit) {
        systemCommits.put(commit.getId(), commit);
    }
    public void saveSystemCommits(List<SystemCommit> commits) {
        commits.forEach(this::saveSystemCommit);;
    }

    public List<SystemCommit> getSystemLastCommits() {
        return systemCommits.values().stream().sorted(Comparator.comparing(SystemCommit::getCommitTime)).collect(Collectors.toList()).reversed();
    }

    // --- Project Folders ---

    public List<ProjectFolder> getFolders() {
        return query(folders, f -> true, ProjectFolder::copy);
    }

    public void saveProject(ProjectFolder projectFolder, boolean persist) {
        var key = GroupedKey.create(projectFolder.getProjectId(), DEV, projectFolder.getProjectId());
        if (projectFolder.lastUpdate == 0) {
            projectFolder.setLastUpdate(Instant.now().getEpochSecond() * 1000L);
        }
        folders.put(key, projectFolder);
        if (persist) {
            eventBus.publish(PERSIST_PROJECT, new CacheEvent(key, SAVE, projectFolder));
        }
    }

    public void deleteProject(String projectId) {
        var key = GroupedKey.create(projectId, DEV, projectId);
        folders.remove(key);
        eventBus.publish(PERSIST_PROJECT, new CacheEvent(key, DELETE, null));
    }

    public ProjectFolder getProject(String projectId) {
        ProjectFolder f = folders.get(GroupedKey.create(projectId, DEV, projectId));
        return f != null ? f.copy() : null;
    }

    // --- Project Folders Commited ---

    public List<ProjectFolderCommited> getFoldersCommited() {
        return query(foldersCommited, f -> true, ProjectFolderCommited::copy);
    }

    public void saveProjectCommited(ProjectFolderCommited projectFolder) {
        var key = GroupedKey.create(projectFolder.getProjectId(), DEV, projectFolder.getProjectId());
        foldersCommited.put(key, projectFolder);
    }

    public void deleteProjectCommited(String projectId) {
        var key = GroupedKey.create(projectId, DEV, projectId);
        foldersCommited.remove(key);
    }

    public ProjectFolderCommited getProjectCommited(String projectId) {
        ProjectFolderCommited f = foldersCommited.get(GroupedKey.create(projectId, DEV, projectId));
        return f != null ? f.copy() : null;
    }

    // --- Project Files ---

    public Map<String, Long> getLatestUpdatePerProject() {
        return files.values().stream().collect(Collectors.toMap(
                ProjectFile::getProjectId,
                ProjectFile::getLastUpdate,
                Math::max
        ));
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        return query(files, f -> Objects.equals(f.getProjectId(), projectId), ProjectFile::copy);
    }

    public Map<String, ProjectFile> getProjectFilesMap(String projectId) {
        return getProjectFiles(projectId).stream()
                .collect(Collectors.toMap(ProjectFile::getName, f -> f)); // Already copies from getProjectFiles
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        return queryFirst(files,
                f -> Objects.equals(f.getProjectId(), projectId) && Objects.equals(f.getName(), filename),
                ProjectFile::copy);
    }

    public List<ProjectFile> getProjectFilesByName(String filename) {
        return query(files, f -> Objects.equals(f.getName(), filename), ProjectFile::copy);
    }

    public void saveProjectFile(ProjectFile file, String commitId, boolean persist) {
        var key = GroupedKey.create(file.getProjectId(), DEV, file.getName());
        files.put(key, file);
        if (commitId != null) {
            saveProjectFileCommited(ProjectFileCommited.fromFile(file, commitId));
        }
        if (persist) {
            eventBus.publish(PERSIST_PROJECT, new CacheEvent(key, SAVE, file));
        }
    }

    public void saveProjectFiles(Map<String, ProjectFile> filesToSave, boolean persist) {
        long lastUpdate = Instant.now().getEpochSecond() * 1000L;
        filesToSave.forEach((groupedKey, projectFile) -> {
            projectFile.setLastUpdate(lastUpdate);
            saveProjectFile(projectFile, null, persist);
        });
    }

    public void deleteProjectFile(String projectId, String filename) {
        var key = GroupedKey.create(projectId, DEV, filename);
        files.remove(key);
        eventBus.publish(PERSIST_PROJECT, new CacheEvent(key, DELETE, null));
    }

    // --- Committed Files ---

    public List<ProjectFileCommited> getProjectFilesCommited(String projectId) {
        return query(filesCommited, f -> Objects.equals(f.getProjectId(), projectId), ProjectFileCommited::copy);
    }

    public ProjectFileCommited getProjectFileCommited(String projectId, String filename) {
        return queryFirst(filesCommited,
                f -> Objects.equals(f.getProjectId(), projectId) && Objects.equals(f.getName(), filename),
                ProjectFileCommited::copy);
    }

    public void deleteProjectFileCommited(String projectId) {
        getProjectFilesCommited(projectId).forEach(file -> {
            filesCommited.remove(GroupedKey.create(projectId, DEV, file.name));
        });
    }
    public void deleteProjectFileCommited(String projectId, String filename) {
        filesCommited.remove(GroupedKey.create(projectId, DEV, filename));
    }

    public void saveProjectFileCommited(ProjectFileCommited file) {
        filesCommited.put(GroupedKey.create(file.getProjectId(), DEV, file.getName()), file);
    }

    // --- Deployment Status ---

    public void saveDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()), status);
    }

    public void deleteDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()));
    }

    public List<DeploymentStatus> getDeploymentStatuses() {
        return query(deploymentStatuses, s -> true, DeploymentStatus::copy);
    }

    public List<DeploymentStatus> getDeploymentStatuses(String env) {
        return query(deploymentStatuses, s -> Objects.equals(s.getEnv(), env), DeploymentStatus::copy);
    }

    public DeploymentStatus getDeploymentStatus(String projectId, String environment) {
        DeploymentStatus s = deploymentStatuses.get(GroupedKey.create(projectId, environment, projectId));
        return s != null ? s.copy() : null;
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

    // --- Pod / Container Status ---

    public List<PodContainerStatus> getPodContainerStatuses(String projectId, String env) {
        return query(podContainerStatuses,
                s -> Objects.equals(s.getProjectId(), projectId) && Objects.equals(s.getEnv(), env),
                PodContainerStatus::copy);
    }

    public PodContainerStatus getBuildPodContainerStatus(String projectId, String env) {
        return queryFirst(podContainerStatuses,
                s -> Objects.equals(s.getProjectId(), projectId) && Objects.equals(s.getEnv(), env) && s.getType() == ContainerType.build,
                PodContainerStatus::copy);
    }

    public List<PodContainerStatus> getDevModeStatuses() {
        return query(podContainerStatuses, s -> s.getType() == ContainerType.devmode, PodContainerStatus::copy);
    }

    public List<PodContainerStatus> getPodContainerStatuses() {
        return new ArrayList<>(podContainerStatuses.values().stream().toList());
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


    public PodContainerStatus getDevModePodContainerStatus(String projectId, String env) {
        return queryFirst(podContainerStatuses,
                status -> Objects.equals(status.getProjectId(), projectId)
                        && Objects.equals(status.getEnv(), env)
                        && status.getType() == ContainerType.devmode,
                PodContainerStatus::copy);
    }

    public List<PodContainerStatus> getPodContainerStatuses(String env) {
        return query(podContainerStatuses,
                status -> Objects.equals(status.getEnv(), env),
                PodContainerStatus::copy);
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

    // --- Camel Status ---

    public List<CamelStatus> getCamelStatusesByProjectAndEnv(String projectId, String env) {
        return query(camelStatuses,
                s -> Objects.equals(s.getProjectId(), projectId) && Objects.equals(s.getEnv(), env),
                CamelStatus::copy);
    }

    public List<CamelStatus> getCamelStatusesByName(CamelStatusValue.Name name) {
        return camelStatuses.values().stream()
                .map(cs -> {
                    var copy = cs.copy();
                    var filteredValues = copy.getStatuses().stream()
                            .filter(v -> Objects.equals(v.getName(), name))
                            .toList();
                    copy.setStatuses(filteredValues);
                    return copy;
                }).toList();
    }


    public List<CamelStatus> getCamelAllStatuses() {
        return new ArrayList<>(camelStatuses.values().stream().toList());
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
        camelStatuses.entrySet().removeIf(entry -> {
            CamelStatus status = entry.getValue();
            return Objects.equals(status.getProjectId(), projectId)
                    && Objects.equals(status.getEnv(), env);
        });
    }
    
    public void deleteAllCamelStatuses() {
        camelStatuses.clear();
    }

    // --- Access & Sessions ---

    public AccessPassword getPassword(String username) {
        var key = GroupedKey.create(AccessPassword.class.getSimpleName(), DEV, username);
        return passwords.get(key);
    }

    public AccessUser getUser(String username) {
        var key = GroupedKey.create(AccessUser.class.getSimpleName(), DEV, username);
        return users.get(key);
    }

    public AccessRole getRole(String name) {
        var key = GroupedKey.create(AccessRole.class.getSimpleName(), DEV, name);
        return roles.get(key);
    }

    public List<AccessUser> getUsers() {
        return new ArrayList<>(users.values().stream().toList());
    }
    public List<AccessRole> getRoles() {
        return new ArrayList<>(roles.values().stream().toList());
    }

    public void saveUser(AccessUser user, boolean persist) {
        var key = GroupedKey.create(user.getClass().getSimpleName(), DEV, user.username);
        users.put(key, user);
        if (persist) {
            eventBus.send(PERSIST_ACCESS, new CacheEvent(key, SAVE, user));
        }
    }
    public void savePassword(AccessPassword pass, boolean persist) {
        var key = GroupedKey.create(pass.getClass().getSimpleName(), DEV, pass.username);
        passwords.put(key, pass);
        if (persist) {
            eventBus.send(PERSIST_ACCESS, new CacheEvent(key, SAVE, pass));
        }
    }

    public void saveRole(AccessRole role, boolean persist) {
        var key = GroupedKey.create(role.getClass().getSimpleName(), DEV, role.name);
        roles.put(key, role);
        if (persist) {
            eventBus.send(PERSIST_ACCESS, new CacheEvent(key, SAVE, role));
        }
    }

    public void deleteUser(String username) {
        var key = GroupedKey.create(AccessUser.class.getSimpleName(), DEV, username);
        if (!USER_ADMIN.equals(username)) {
            users.remove(key);
            eventBus.send(PERSIST_ACCESS, new CacheEvent(key, DELETE, null));
        }
    }

    public void deleteRole(AccessRole role) {
        var key = GroupedKey.create(role.getClass().getSimpleName(), DEV, role.name);
        if (!AuthService.getAllRoles().contains(role.name)) {
            roles.remove(key, role);
            eventBus.send(PERSIST_ACCESS, new CacheEvent(key, DELETE, null));
        }
    }

    // Sessions

    public List<AccessSession> getAccessSessions() {
        return sessions.values().stream().map(AccessSession::copy).toList();
    }

    public AccessSession getAccessSession(String sessionsId) {
        return sessions.get(sessionsId);
    }

    public void saveAccessSession(AccessSession session, boolean persist) {
        sessions.put(session.sessionId, session); // 12h absolute
        if (persist) {
            eventBus.send(PERSIST_SESSION, new CacheEvent(session.sessionId, SAVE, session));
        }
    }

    public void deleteAccessSession(String sessionId) {
        var session = sessions.get(sessionId);
        if (session != null) {
            deleteUserHeartBeat(session.username);
            deleteUserWorking(session.username);
        }
        sessions.remove(sessionId);
        eventBus.send(PERSIST_SESSION, new CacheEvent(sessionId, DELETE, null));
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

    public void saveUserWorking(ActivityUser activityUser) {
        usersWorking.put(activityUser.getUserName(), activityUser);
    }

    public Map<String, ActivityUser> getCopyUsersWorking() {
        return Map.copyOf(usersWorking);
    }
    public void saveUserHeartBeat(ActivityUser activityUser) {
        usersHeartBeat.put(activityUser.getUserName(), activityUser);
    }

    public Map<String, ActivityUser> getCopyUsersHeartBeat() {
        return Map.copyOf(usersHeartBeat);
    }

    public void deleteUserHeartBeat(String userName) {
        usersHeartBeat.remove(userName);
    }

    public void deleteUserWorking(String userName) {
        usersWorking.remove(userName);
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
}