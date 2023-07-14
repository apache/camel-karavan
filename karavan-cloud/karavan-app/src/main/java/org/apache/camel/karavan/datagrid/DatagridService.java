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
package org.apache.camel.karavan.datagrid;

import io.quarkus.vertx.ConsumeEvent;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.datagrid.model.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.client.hotrod.configuration.ClientIntelligence;
import org.infinispan.client.hotrod.configuration.ConfigurationBuilder;
import org.infinispan.commons.configuration.StringConfiguration;
import org.infinispan.commons.marshall.ProtoStreamMarshaller;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Default;
import javax.inject.Inject;
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
@ApplicationScoped
public class DatagridService  {

    public static final String ADDRESS_DEVMODE_COMMAND = "ADDRESS_DEVMODE_COMMAND";
    public static final String ADDRESS_DEVMODE_STATUS = "ADDRESS_DEVMODE_STATUS";
    protected static final String ADDRESS_DEVMODE_COMMAND_INTERNAL = "ADDRESS_DEVMODE_COMMAND_INTERNAL";
    protected static final String ADDRESS_DEVMODE_STATUS_INTERNAL = "ADDRESS_DEVMODE_STATUS_INTERNAL";

    @ConfigProperty(name ="infinispan.hosts")
    String infinispanHosts;
    @ConfigProperty(name ="infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name ="infinispan.password")
    String infinispanPassword;

    private RemoteCache<GroupedKey, Project> projects;
    private RemoteCache<GroupedKey, ProjectFile> files;
    private RemoteCache<GroupedKey, PipelineStatus> pipelineStatuses;
    private RemoteCache<GroupedKey, DeploymentStatus> deploymentStatuses;
    private RemoteCache<GroupedKey, PodStatus> podStatuses;
    private RemoteCache<GroupedKey, ServiceStatus> serviceStatuses;
    private RemoteCache<GroupedKey, CamelStatus> camelStatuses;
    private RemoteCache<String, Environment> environments;
    private RemoteCache<String, String> commits;
    private RemoteCache<GroupedKey, DevModeStatus> devmodeStatuses;
    private RemoteCache<GroupedKey, ContainerInfo> containers;
    private RemoteCache<GroupedKey, DevModeCommand> devmodeCommands;
    private final AtomicBoolean ready = new AtomicBoolean(false);

    private RemoteCacheManager cacheManager;

    @Inject
    EventBus eventBus;

    private static final Logger LOGGER = Logger.getLogger(DatagridService.class.getName());

    private static final String DEFAULT_ENVIRONMENT = "dev";

    public void start() {
        LOGGER.info("DatagridService is starting in remote mode");

        ProtoStreamMarshaller marshaller = new ProtoStreamMarshaller();
        marshaller.register(new KaravanSchemaImpl());

        ConfigurationBuilder builder = new ConfigurationBuilder();
        builder.socketTimeout(1000)
                .connectionTimeout(10000)
                .addServers(infinispanHosts)
                .security()
                .authentication().enable()
                .username(infinispanUsername)
                .password(infinispanPassword)
                .clientIntelligence(ClientIntelligence.BASIC)
                .marshaller(marshaller);

        cacheManager = new RemoteCacheManager(builder.build());

        environments = getOrCreateCache(Environment.CACHE, false);
        projects = getOrCreateCache(Project.CACHE, false);
        files = getOrCreateCache(ProjectFile.CACHE, false);
        podStatuses = getOrCreateCache(PodStatus.CACHE, false);
        pipelineStatuses = getOrCreateCache(PipelineStatus.CACHE, false);
        deploymentStatuses = getOrCreateCache(DeploymentStatus.CACHE, false);
        serviceStatuses = getOrCreateCache(ServiceStatus.CACHE, false);
        camelStatuses = getOrCreateCache(CamelStatus.CACHE, false);
        commits = getOrCreateCache("commits", false);
        deploymentStatuses = getOrCreateCache(DeploymentStatus.CACHE, false);
        devmodeStatuses = getOrCreateCache(DevModeStatus.CACHE, false);
        containers = getOrCreateCache(ContainerInfo.CACHE, false);
        devmodeCommands = getOrCreateCache(DevModeCommand.CACHE, true);

        cacheManager.getCache(DevModeCommand.CACHE).addClientListener(new DevModeCommandListener(eventBus));
        cacheManager.getCache(DevModeStatus.CACHE).addClientListener(new DevModeStatusListener(eventBus));
        // Grab the generated protobuf schema and registers in the server.
        cacheManager.getCache(PROTOBUF_METADATA_CACHE_NAME).put("karavan.proto", getResourceFile("/proto/karavan.proto"));

        ready.set(true);
        LOGGER.info("DatagridService is started in remote mode");
    }

    public boolean isReady() {
        return ready.get();
    }

    private <K, V> RemoteCache<K, V>  getOrCreateCache(String name, boolean command) {
        String config = getResourceFile(command ? "/cache/command-cache-config.xml" : "/cache/data-cache-config.xml");
        return cacheManager.administration().getOrCreateCache(name, new StringConfiguration(String.format(config, name)));
    }

    @ConsumeEvent(value = ADDRESS_DEVMODE_COMMAND_INTERNAL, blocking = true, ordered = true, local = false)
    void sendCommand(JsonObject message) {
        GroupedKey key = message.mapTo(GroupedKey.class);
        DevModeCommand command = getDevModeCommand(key);
        eventBus.publish(DatagridService.ADDRESS_DEVMODE_COMMAND, JsonObject.mapFrom(command));
    }

    @ConsumeEvent(value = ADDRESS_DEVMODE_STATUS_INTERNAL, blocking = true, ordered = true, local = false)
    void sendStatus(JsonObject message) {
        GroupedKey key = message.mapTo(GroupedKey.class);
        DevModeStatus status = devmodeStatuses.get(key);
        eventBus.publish(DatagridService.ADDRESS_DEVMODE_STATUS, JsonObject.mapFrom(status));
    }

    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project) {
        GroupedKey key = GroupedKey.create(project.getProjectId(), DEFAULT_ENVIRONMENT, project.getProjectId());
        boolean isNew = !projects.containsKey(key);
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
        projects.remove(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT,projectId));
    }

    public void deleteProjectFile(String projectId, String filename) {
        files.remove(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT,filename));
    }

    public Project getProject(String projectId) {
        return projects.get(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT,projectId));
    }

    public PipelineStatus getPipelineStatus(String projectId, String environment) {
        return pipelineStatuses.get(GroupedKey.create(projectId, environment, projectId));
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

    public List<PodStatus> getPodStatuses(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory(podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public PodStatus getDevModePodStatuses(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory(podStatuses);
        List<PodStatus> list = queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE projectId = :projectId AND env = :env AND inDevMode = true")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
        return list.size() > 0 ? list.get(0) : null;
    }

    public List<PodStatus> getPodStatuses(String env) {
        QueryFactory queryFactory = Search.getQueryFactory(podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public List<PodStatus> getAllPodStatuses() {
        return new ArrayList<>(podStatuses.values());
    }

    public void savePodStatus(PodStatus status) {
        podStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getName()), status);
    }

    public void deletePodStatus(PodStatus status) {
        podStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getName()));
    }

    public void deletePodStatus(String projectId, String env, String podName) {
        podStatuses.remove(GroupedKey.create(projectId, env, podName));
    }

    public CamelStatus getCamelStatus(String projectId, String env, String name) {
        GroupedKey key = GroupedKey.create(projectId, env, name);
        return camelStatuses.get(key);
    }

    public List<CamelStatus> getCamelStatusesByEnv(String env, CamelStatusName name) {
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
        Arrays.stream(CamelStatusName.values()).forEach(name -> {
            GroupedKey key = GroupedKey.create(projectId, env, name.name());
            camelStatuses.remove(key);
        });
    }

    public List<Environment> getEnvironments() {
        return new ArrayList<>(environments.values());
    }

    public void saveEnvironment(Environment environment) {
        environments.put(environment.getName(), environment);
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

    public void saveDevModeStatus(DevModeStatus status) {
        devmodeStatuses.put(GroupedKey.create(status.getProjectId(), DEFAULT_ENVIRONMENT, status.getProjectId()), status);
    }

    public void deleteDevModeStatus(String projectId) {
        devmodeStatuses.remove(GroupedKey.create(projectId, DEFAULT_ENVIRONMENT, projectId));
    }

    public DevModeStatus getDevModeStatus(String projectId) {
        return devmodeStatuses.get(GroupedKey.create(projectId,DEFAULT_ENVIRONMENT, projectId));
    }

    public List<DevModeStatus> getLoadedDevModeStatuses() {
        QueryFactory queryFactory = Search.getQueryFactory(devmodeStatuses);
        return queryFactory.<DevModeStatus>create("FROM karavan.DevModeStatus WHERE codeLoaded = true")
                .execute().list();
    }

    public List<DevModeStatus> getDevModeStatuses() {
       return new ArrayList<>(devmodeStatuses.values());
    }

    public void sendDevModeCommand(DevModeCommand command) {
        devmodeCommands.put(GroupedKey.create(command.getContainerName(), DEFAULT_ENVIRONMENT, command.getTime().toString()), command);
    }

    public DevModeCommand getDevModeCommand(GroupedKey key) {
        return devmodeCommands.get(key);
    }

    public void deleteDevModeCommand(DevModeCommand command) {
        containers.remove(GroupedKey.create(command.getContainerName(), DEFAULT_ENVIRONMENT, command.getTime().toString()));
    }

    public void saveContainerInfo(ContainerInfo ci) {
        containers.put(GroupedKey.create(ci.getContainerName(), ci.getEnv() != null ? ci.getEnv() : DEFAULT_ENVIRONMENT, ci.getContainerName()), ci);
    }

    public void getContainerInfo(String name, String env) {
        containers.get(GroupedKey.create(name, env, name));
    }

    public List<ContainerInfo> getContainerInfos(String env) {
        QueryFactory queryFactory = Search.getQueryFactory(containers);
        return queryFactory.<ContainerInfo>create("FROM karavan.ContainerInfo WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public void deleteContainerInfo(String containerName) {
        containers.remove(GroupedKey.create(containerName, DEFAULT_ENVIRONMENT, containerName));
    }

    public void clearAllStatuses() {
        CompletableFuture.allOf(
            deploymentStatuses.clearAsync(),
            podStatuses.clearAsync(),
            pipelineStatuses.clearAsync(),
            camelStatuses.clearAsync(),
            devmodeCommands.clearAsync(),
            devmodeStatuses.clearAsync()
        ).join();
    }

    private String getResourceFile(String path) {
        try {
            InputStream inputStream = DatagridService.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }
}
