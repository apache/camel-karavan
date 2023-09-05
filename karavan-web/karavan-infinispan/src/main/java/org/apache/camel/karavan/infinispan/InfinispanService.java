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
package org.apache.camel.karavan.infinispan;

import io.quarkus.runtime.StartupEvent;
import io.quarkus.vertx.ConsumeEvent;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.infinispan.model.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.client.hotrod.configuration.ClientIntelligence;
import org.infinispan.client.hotrod.configuration.ConfigurationBuilder;
import org.infinispan.commons.configuration.StringConfiguration;
import org.infinispan.commons.marshall.ProtoStreamMarshaller;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static org.infinispan.query.remote.client.ProtobufMetadataManagerConstants.PROTOBUF_METADATA_CACHE_NAME;

@Default
@Readiness
@Singleton
public class InfinispanService implements HealthCheck {

    @ConfigProperty(name = "karavan.infinispan.hosts")
    String infinispanHosts;
    @ConfigProperty(name = "karavan.infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name = "karavan.infinispan.password")
    String infinispanPassword;

    @Inject
    EventBus eventBus;

    private RemoteCache<GroupedKey, Project> projects;
    private RemoteCache<GroupedKey, ProjectFile> files;
    private RemoteCache<GroupedKey, PipelineStatus> pipelineStatuses;
    private RemoteCache<GroupedKey, DeploymentStatus> deploymentStatuses;
    private RemoteCache<GroupedKey, ContainerStatus> containerStatuses;
    private RemoteCache<GroupedKey, Boolean> transits;
    private RemoteCache<GroupedKey, ServiceStatus> serviceStatuses;
    private RemoteCache<GroupedKey, CamelStatus> camelStatuses;
    private RemoteCache<String, String> commits;
    private RemoteCache<GroupedKey, String> codeReloadCommands;
    private final AtomicBoolean ready = new AtomicBoolean(false);

    private RemoteCacheManager cacheManager;

    private static final Logger LOGGER = Logger.getLogger(InfinispanService.class.getName());

    private static final String DEFAULT_ENVIRONMENT = "dev";

    public static final String CODE_RELOAD_COMMAND = "CODE_RELOAD_COMMAND";
    protected static final String CODE_RELOAD_COMMAND_INTERNAL = "CODE_RELOAD_COMMAND_INTERNAL";

    @Retry(maxRetries = 100, delay = 2000)
    public void tryStart(boolean startCodeReloadListener) throws Exception {
        start(startCodeReloadListener);
    }

    void start(boolean startCodeReloadListener) throws Exception {
        LOGGER.info("InfinispanService is starting in remote mode");

        ProtoStreamMarshaller marshaller = new ProtoStreamMarshaller();
        marshaller.register(new KaravanSchemaImpl());

        ConfigurationBuilder builder = new ConfigurationBuilder();
        builder.addServers(infinispanHosts)
                .security()
                .authentication().enable()
                .username(infinispanUsername)
                .password(infinispanPassword)
                .clientIntelligence(ClientIntelligence.BASIC)
                .marshaller(marshaller);

        cacheManager = new RemoteCacheManager(builder.build());

        if (cacheManager.getConnectionCount() > 0 ) {

            projects = getOrCreateCache(Project.CACHE, false);
            files = getOrCreateCache(ProjectFile.CACHE, false);
            containerStatuses = getOrCreateCache(ContainerStatus.CACHE, false);
            pipelineStatuses = getOrCreateCache(PipelineStatus.CACHE, false);
            deploymentStatuses = getOrCreateCache(DeploymentStatus.CACHE, false);
            serviceStatuses = getOrCreateCache(ServiceStatus.CACHE, false);
            camelStatuses = getOrCreateCache(CamelStatus.CACHE, false);
            commits = getOrCreateCache("commits", false);
            transits = getOrCreateCache("transits", false);
            deploymentStatuses = getOrCreateCache(DeploymentStatus.CACHE, false);
            codeReloadCommands = getOrCreateCache("code_reload_commands", true);

            cacheManager.getCache(PROTOBUF_METADATA_CACHE_NAME).put("karavan.proto", getResourceFile("/proto/karavan.proto"));

            if (startCodeReloadListener) {
                cacheManager.getCache("code_reload_commands").addClientListener(new CodeReloadListener(eventBus));
            }

            ready.set(true);
            LOGGER.info("InfinispanService is started in remote mode");
        } else {
            throw new Exception("Not connected...");
        }
    }

    private <K, V> RemoteCache<K, V> getOrCreateCache(String name, boolean command) {
        String config = getResourceFile(command ? "/cache/command-cache-config.xml" : "/cache/data-cache-config.xml");
        return cacheManager.administration().getOrCreateCache(name, new StringConfiguration(String.format(config, name)));
    }

    public boolean isReady() {
        return ready.get();
    }


    @ConsumeEvent(value = CODE_RELOAD_COMMAND_INTERNAL, blocking = true)
    void resendCodeReloadCommand(JsonObject message) {
        GroupedKey key = message.mapTo(GroupedKey.class);
        deleteCodeReloadCommand(key);
        eventBus.publish(CODE_RELOAD_COMMAND, key.getProjectId());
    }

    public void sendCodeReloadCommand(String projectId) {
        codeReloadCommands.put(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT, UUID.randomUUID().toString()), projectId);
    }

    public void deleteCodeReloadCommand(GroupedKey key) {
        codeReloadCommands.remove(key);
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
        QueryFactory queryFactory = Search.getQueryFactory(files);
        return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId")
                .setParameter("projectId", projectId)
                .execute().list();
    }

    public Map<GroupedKey, ProjectFile> getProjectFilesMap(String projectId) {
        QueryFactory queryFactory = Search.getQueryFactory(files);
        return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId")
                .setParameter("projectId", projectId)
                .execute().list().stream()
                .collect(Collectors.toMap(f -> new GroupedKey(f.getProjectId(), DEFAULT_ENVIRONMENT, f.getName()), f -> f));
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        QueryFactory queryFactory = Search.getQueryFactory(files);
        List<ProjectFile> list = queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId AND name = :name")
                .setParameter("projectId", projectId)
                .setParameter("name", filename)
                .execute().list();
        return list.size() > 0 ? list.get(0) : null;
    }

    public List<ProjectFile> getProjectFilesByName(String filename) {
        QueryFactory queryFactory = Search.getQueryFactory(files);
        return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE name = :name")
                .setParameter("name", filename)
                .execute().list();
    }

    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProjectId(), DEFAULT_ENVIRONMENT, file.getName()), file);
    }

    public void saveProjectFiles(Map<GroupedKey, ProjectFile> f) {
        Map<GroupedKey, ProjectFile> files = new HashMap<>(f.size());
        f.forEach((groupedKey, projectFile) -> {
            projectFile.setLastUpdate(Instant.now().toEpochMilli());
        });
        files.putAll(files);
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

    public PipelineStatus getPipelineStatus(String projectId, String environment) {
        return pipelineStatuses.get(GroupedKey.create(projectId, environment, projectId));
    }

    public List<PipelineStatus> getPipelineStatuses(String environment) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) pipelineStatuses);
        return queryFactory.<PipelineStatus>create("FROM karavan.PipelineStatus WHERE env = :env")
                .setParameter("env", environment)
                .execute().list();
    }

    public void savePipelineStatus(PipelineStatus status) {
        pipelineStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()), status);
    }

    public void deletePipelineStatus(PipelineStatus status) {
        pipelineStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()));
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
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) deploymentStatuses);
        return queryFactory.<DeploymentStatus>create("FROM karavan.DeploymentStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
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
        QueryFactory queryFactory = Search.getQueryFactory(containerStatuses);
        return queryFactory.<ContainerStatus>create("FROM karavan.ContainerStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public ContainerStatus getContainerStatus(String projectId, String env, String containerName) {
        return containerStatuses.get(GroupedKey.create(projectId, env, containerName));
    }

    public ContainerStatus getDevModeContainerStatus(String projectId, String env) {
        return containerStatuses.get(GroupedKey.create(projectId, env, projectId));
    }

    public List<ContainerStatus> getContainerStatuses(String env) {
        QueryFactory queryFactory = Search.getQueryFactory(containerStatuses);
        return queryFactory.<ContainerStatus>create("FROM karavan.ContainerStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
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

    public void deleteContainerStatus(String projectId, String env, String containerName) {
        containerStatuses.remove(GroupedKey.create(projectId, env, containerName));
    }

    public CamelStatus getCamelStatus(String projectId, String env, String name) {
        GroupedKey key = GroupedKey.create(projectId, env, name);
        return camelStatuses.get(key);
    }

    public CamelStatus getCamelStatus(GroupedKey key) {
        return camelStatuses.get(key);
    }

    public List<CamelStatus> getCamelStatusesByEnv(String env, CamelStatus.Name name) {
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        return queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE env = :env AND name = :name")
                .setParameter("env", env)
                .setParameter("name", name)
                .execute().list();
    }

    public List<CamelStatus> getCamelStatusesByProjectIdEnv(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        return queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public void saveCamelStatus(CamelStatus status) {
        GroupedKey key = GroupedKey.create(status.getProjectId(), status.getEnv(), status.getName().name());
        camelStatuses.put(key, status);
    }

    public void deleteCamelStatus(String projectId, String name, String env) {
        GroupedKey key = GroupedKey.create(projectId, env, name);
        camelStatuses.remove(key);
    }

    public void deleteCamelStatuses(String projectId, String env) {
        Arrays.stream(CamelStatus.Name.values()).forEach(name -> {
            GroupedKey key = GroupedKey.create(projectId, env, name.name());
            camelStatuses.remove(key);
        });
    }

    public void saveCommit(String commitId, int time) {
        commits.put(commitId, String.valueOf(time));
    }

    public void saveLastCommit(String commitId) {
        commits.put("lastCommitId", commitId);
    }

    public Tuple2<String, Integer> getLastCommit() {
        String lastCommitId = commits.get("lastCommitId");
        String time = commits.get(lastCommitId);
        return Tuple2.of(lastCommitId, Integer.parseInt(time));
    }

    public boolean hasCommit(String commitId) {
        return commits.get(commitId) != null;
    }


    public List<ContainerStatus> getLoadedDevModeStatuses() {
        QueryFactory queryFactory = Search.getQueryFactory(containerStatuses);
        return queryFactory.<ContainerStatus>create("FROM karavan.ContainerStatus WHERE type = :type AND codeLoaded = true")
                .setParameter("type", ContainerStatus.ContainerType.devmode)
                .execute().list();
    }

    public List<ContainerStatus> getDevModeStatuses() {
        QueryFactory queryFactory = Search.getQueryFactory(containerStatuses);
        return queryFactory.<ContainerStatus>create("FROM karavan.ContainerStatus WHERE type = :type")
                .setParameter("type", ContainerStatus.ContainerType.devmode)
                .execute().list();
    }

    public List<ContainerStatus> getContainerStatusByEnv(String env) {
        QueryFactory queryFactory = Search.getQueryFactory(containerStatuses);
        return queryFactory.<ContainerStatus>create("FROM karavan.ContainerStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public void clearAllStatuses() {
        CompletableFuture.allOf(
                deploymentStatuses.clearAsync(),
                containerStatuses.clearAsync(),
                pipelineStatuses.clearAsync(),
                camelStatuses.clearAsync()
        ).join();
    }

    private String getResourceFile(String path) {
        try {
            InputStream inputStream = InfinispanService.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public HealthCheckResponse call() {
        if (isReady()) {
            return HealthCheckResponse.named("infinispan").up().build();
        } else {
            return HealthCheckResponse.named("infinispan").down().build();
        }
    }
}
