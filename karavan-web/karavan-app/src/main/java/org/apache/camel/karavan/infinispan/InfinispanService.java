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

import jakarta.enterprise.inject.Default;
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
import org.infinispan.protostream.ProtobufUtil;
import org.infinispan.protostream.SerializationContext;
import org.infinispan.protostream.config.Configuration;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

    private RemoteCache<GroupedKey, Project> projects;
    private RemoteCache<GroupedKey, ProjectFile> files;
    private RemoteCache<GroupedKey, DeploymentStatus> deploymentStatuses;
    private RemoteCache<GroupedKey, ContainerStatus> containerStatuses;
    private RemoteCache<GroupedKey, Boolean> transits;
    private RemoteCache<GroupedKey, ServiceStatus> serviceStatuses;
    private RemoteCache<GroupedKey, CamelStatus> camelStatuses;
    private final AtomicBoolean ready = new AtomicBoolean(false);

    private RemoteCacheManager cacheManager;

    private static final Logger LOGGER = Logger.getLogger(InfinispanService.class.getName());

    private static final String DEFAULT_ENVIRONMENT = "dev";

    @Retry(maxRetries = 100, delay = 2000)
    public void tryStart() throws Exception {
        start();
    }

    void start() throws Exception {
        LOGGER.info("InfinispanService is starting in remote mode");

        Configuration.Builder cfgBuilder = Configuration.builder().setLogOutOfSequenceWrites(false);
        SerializationContext ctx = ProtobufUtil.newSerializationContext(cfgBuilder.build());

        ProtoStreamMarshaller marshaller = new ProtoStreamMarshaller(ctx);
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

            projects = getOrCreateCache(Project.CACHE);
            files = getOrCreateCache(ProjectFile.CACHE);
            containerStatuses = getOrCreateCache(ContainerStatus.CACHE);
            deploymentStatuses = getOrCreateCache(DeploymentStatus.CACHE);
            serviceStatuses = getOrCreateCache(ServiceStatus.CACHE);
            camelStatuses = getOrCreateCache(CamelStatus.CACHE);
            transits = getOrCreateCache("transits");
            deploymentStatuses = getOrCreateCache(DeploymentStatus.CACHE);

            cacheManager.getCache(PROTOBUF_METADATA_CACHE_NAME).put("karavan.proto", getResourceFile("/proto/karavan.proto"));

            ready.set(true);
            LOGGER.info("InfinispanService is started in remote mode");
        } else {
            throw new Exception("Not connected...");
        }
    }

    private <K, V> RemoteCache<K, V> getOrCreateCache(String name) {
        String config = getResourceFile("/cache/data-cache-config.xml");
        return cacheManager.administration().getOrCreateCache(name, new StringConfiguration(String.format(config, name)));
    }

    public boolean isReady() {
        return ready.get();
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
        List<ProjectFile> list = queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE name = :name AND projectId = :projectId")
                .setParameter("name", filename)
                .setParameter("projectId", projectId)
                .execute().list();
        return !list.isEmpty() ? list.get(0) : null;
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

    public CamelStatus getCamelStatus(String projectId, String env, String containerName) {
        GroupedKey key = GroupedKey.create(projectId, env, containerName);
        return camelStatuses.get(key);
    }

    public CamelStatus getCamelStatus(GroupedKey key) {
        return camelStatuses.get(key);
    }

    public List<CamelStatus> getCamelStatusesByEnv(CamelStatusValue.Name name) {
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        List<CamelStatus> statuses = queryFactory.<CamelStatus>create("FROM karavan.CamelStatus")
                .execute().list();
        return statuses.stream().map(cs -> {
            var values = cs.getStatuses();
            cs.setStatuses(values.stream().filter(v -> Objects.equals(v.getName(), name)).toList());
            return cs;
        }).toList();
    }

    public List<CamelStatus> getCamelStatusesByProjectAndEnv(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        return queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
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
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        List<CamelStatus> statuses = queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
        statuses.forEach(s -> {
            GroupedKey key = GroupedKey.create(projectId, env, s.getContainerName());
            camelStatuses.remove(key);
        });
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
            return HealthCheckResponse.named("Infinispan").up().build();
        } else {
            return HealthCheckResponse.named("Infinispan").down().build();
        }
    }
}
