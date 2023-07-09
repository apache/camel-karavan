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
import org.apache.camel.karavan.datagrid.model.KaravanSchemaImpl;
import org.eclipse.microprofile.config.inject.ConfigProperty;
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

@Default
@Readiness
@ApplicationScoped
public class DatagridService implements HealthCheck  {

    public static final String ADDRESS_DEVMODE_COMMAND = "ADDRESS_DEVMODE_COMMAND";
    protected static final String ADDRESS_DEVMODE_COMMAND_INTERNAL = "ADDRESS_DEVMODE_COMMAND_INTERNAL";

    @ConfigProperty(name ="quarkus.infinispan-client.hosts")
    String infinispanHosts;
    @ConfigProperty(name ="quarkus.infinispan-client.username")
    String infinispanUsername;
    @ConfigProperty(name ="quarkus.infinispan-client.password")
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
    private RemoteCache<GroupedKey, DevModeCommand> devmodeCommands;
    private RemoteCache<GroupedKey, DevModeStatus> devmodeStatuses;
    private final AtomicBoolean ready = new AtomicBoolean(false);

    RemoteCacheManager cacheManager;

    @Inject
    EventBus eventBus;

    private static final String CACHE_CONFIG = "<distributed-cache name=\"%s\">"
            + " <encoding media-type=\"application/x-protostream\"/>"
            + " <groups enabled=\"true\"/>"
            + "</distributed-cache>";

    private static final Logger LOGGER = Logger.getLogger(DatagridService.class.getName());

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
        devmodeCommands = getOrCreateCache(DevModeCommand.CACHE, true);

        cacheManager.getCache(DevModeCommand.CACHE).addClientListener(new ClientRunnerListener(eventBus));
        ready.set(true);
        LOGGER.info("DatagridService is started in remote mode");
    }

    private <K, V> RemoteCache<K, V>  getOrCreateCache(String name, boolean command) {
        String config = getResourceFile(command ? "/command-cache-config.xml" : "/data-cache-config.xml");
        return cacheManager.administration().getOrCreateCache(name, new StringConfiguration(String.format(config, name)));

    }

    private void cleanData() {
        environments.clear();
        deploymentStatuses.clear();
        podStatuses.clear();
        pipelineStatuses.clear();
        camelStatuses.clear();
    }

    @ConsumeEvent(value = ADDRESS_DEVMODE_COMMAND_INTERNAL, blocking = true, ordered = true, local = false)
    void replyAsync(JsonObject message) {
        GroupedKey key = message.mapTo(GroupedKey.class);
        DevModeCommand command = getDevModeCommand(key);
        eventBus.publish(DatagridService.ADDRESS_DEVMODE_COMMAND, JsonObject.mapFrom(command));
    }

    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project) {
        GroupedKey key = GroupedKey.create(project.getProjectId(), project.getProjectId());
        boolean isNew = !projects.containsKey(key);
        projects.put(key, project);
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) files);
        return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId")
                .setParameter("projectId", projectId)
                .execute().list();
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) files);
        return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId AND name = :name")
                .setParameter("projectId", projectId)
                .setParameter("name", filename)
                .execute().list().get(0);
    }

    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProjectId(), file.getName()), file);
    }

    public void saveProjectFiles(Map<GroupedKey, ProjectFile> f) {
        Map<GroupedKey, ProjectFile> files = new HashMap<>(f.size());
        f.forEach((groupedKey, projectFile) -> {
            projectFile.setLastUpdate(Instant.now().toEpochMilli());
        });
        files.putAll(files);
    }

    public void deleteProject(String project) {
        projects.remove(GroupedKey.create(project, project));
    }

    public void deleteProjectFile(String project, String filename) {
        files.remove(GroupedKey.create(project, filename));
    }

    public Project getProject(String project) {
        return projects.get(GroupedKey.create(project, project));
    }

    public PipelineStatus getPipelineStatus(String projectId, String environment) {
        return pipelineStatuses.get(GroupedKey.create(projectId, environment));
    }

    public void savePipelineStatus(PipelineStatus status) {
        pipelineStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv()), status);
    }

    public void deletePipelineStatus(PipelineStatus status) {
        pipelineStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv()));
    }

    public DeploymentStatus getDeploymentStatus(String name, String namespace, String cluster) {
        String deploymentId = name + ":" + namespace + ":" + cluster;
        return deploymentStatuses.get(GroupedKey.create(name, deploymentId));
    }

    public void saveDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.put(GroupedKey.create(status.getName(), status.getId()), status);
    }

    public void deleteDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.remove(GroupedKey.create(status.getName(), status.getId()));
    }

    public List<DeploymentStatus> getDeploymentStatuses() {
        return deploymentStatuses.values().stream().collect(Collectors.toList());
    }

    public List<DeploymentStatus> getDeploymentStatuses(String env) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) deploymentStatuses);
        return queryFactory.<DeploymentStatus>create("FROM karavan.DeploymentStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public void saveServiceStatus(ServiceStatus status) {
        serviceStatuses.put(GroupedKey.create(status.getName(), status.getId()), status);
    }

    public void deleteServiceStatus(ServiceStatus status) {
        serviceStatuses.remove(GroupedKey.create(status.getName(), status.getId()));
    }

    public List<ServiceStatus> getServiceStatuses() {
        return new ArrayList<>(serviceStatuses.values());
    }

    public List<PodStatus> getPodStatuses(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("project", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public PodStatus getDevModePodStatuses(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE projectId = :projectId AND env = :env AND inDevMode = true")
                .setParameter("project", projectId)
                .setParameter("env", env)
                .execute().list().get(0);
    }

    public List<PodStatus> getPodStatuses(String env) {
        QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
        return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE env = :env")
                .setParameter("env", env)
                .execute().list();
    }

    public void savePodStatus(PodStatus status) {
        podStatuses.put(GroupedKey.create(status.getProjectId(), status.getName()), status);
    }

    public void deletePodStatus(PodStatus status) {
        podStatuses.remove(GroupedKey.create(status.getProjectId(), status.getName()));
    }

    public CamelStatus getCamelStatus(String projectId, String name, String env) {
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        return queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE projectId = :projectId AND name = :name AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("name", name)
                .setParameter("env", env)
                .execute().list().get(0);
    }

    public List<CamelStatus> getCamelStatusesByEnv(String projectId, String env) {
        QueryFactory queryFactory = Search.getQueryFactory(camelStatuses);
        return queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE projectId = :projectId AND env = :env")
                .setParameter("projectId", projectId)
                .setParameter("env", env)
                .execute().list();
    }

    public void saveCamelStatus(CamelStatus status) {
        camelStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv()), status);
    }

    public void deleteCamelStatus(String projectId, String env) {
        camelStatuses.remove(GroupedKey.create(projectId, env));
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
        devmodeStatuses.put(GroupedKey.create(status.getProjectId(), status.getProjectId()), status);
    }

    public void deleteDevModeStatus(String projectId) {
        devmodeStatuses.remove(GroupedKey.create(projectId, projectId));
    }

    public DevModeStatus getDevModeStatus(String projectId) {
        return devmodeStatuses.get(GroupedKey.create(projectId, projectId));
    }

    public void sendDevModeCommand(String projectId, DevModeCommand command) {
        if (command.getProjectId() == null) {
            command.setProjectId(projectId);
        }
        devmodeCommands.put(GroupedKey.create(projectId, UUID.randomUUID().toString()), command);
    }

    public DevModeCommand getDevModeCommand(GroupedKey key) {
        return devmodeCommands.get(key);
    }

    public DevModeCommand getDevModeCommand(String projectId) {
        return getDevModeCommand(GroupedKey.create(projectId, projectId));
    }

    @Override
    public HealthCheckResponse call() {
        if (cacheManager != null && cacheManager.isStarted() && ready.get()) {
            return HealthCheckResponse.up("Infinispan Service is running in cluster mode.");
        }
        else {
            return HealthCheckResponse.down("Infinispan Service is not running.");
        }
    }

    public void clearAllStatuses() {
        CompletableFuture.allOf(
            deploymentStatuses.clearAsync(),
            podStatuses.clearAsync(),
            pipelineStatuses.clearAsync(),
            camelStatuses.clearAsync(),
            devmodeCommands.clearAsync()
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
