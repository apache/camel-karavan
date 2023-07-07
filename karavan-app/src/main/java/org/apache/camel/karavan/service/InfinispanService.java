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

import io.smallrye.mutiny.tuples.Tuple2;
import org.apache.camel.karavan.listener.ClientRunnerListener;
import org.apache.camel.karavan.listener.LocalRunnerListener;
import org.apache.camel.karavan.model.*;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.commons.api.BasicCache;
import org.infinispan.commons.api.CacheContainerAdmin;
import org.infinispan.commons.configuration.StringConfiguration;
import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.configuration.global.GlobalConfigurationBuilder;
import org.infinispan.manager.DefaultCacheManager;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Default;
import javax.inject.Inject;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.service.ServiceUtil.APPLICATION_PROPERTIES_FILENAME;

@Default
@Readiness
@ApplicationScoped
public class InfinispanService implements HealthCheck  {

    private BasicCache<GroupedKey, Project> projects;
    private BasicCache<GroupedKey, ProjectFile> files;
    private BasicCache<GroupedKey, PipelineStatus> pipelineStatuses;
    private BasicCache<GroupedKey, DeploymentStatus> deploymentStatuses;
    private BasicCache<GroupedKey, PodStatus> podStatuses;
    private BasicCache<GroupedKey, CamelStatus> camelStatuses;
    private BasicCache<GroupedKey, ServiceStatus> serviceStatuses;
    private BasicCache<String, Environment> environments;
    private BasicCache<String, String> commits;
    private BasicCache<GroupedKey, String> runnerStatuses;
    private BasicCache<GroupedKey, String> runnerCommands;
    private final AtomicBoolean ready = new AtomicBoolean(false);

    @Inject
    RemoteCacheManager remoteCacheManager;

    DefaultCacheManager localCacheManager;

    @Inject
    CodeService codeService;

    private static final String CACHE_CONFIG = "<distributed-cache name=\"%s\">"
            + " <encoding media-type=\"application/x-protostream\"/>"
            + " <groups enabled=\"true\"/>"
            + "</distributed-cache>";

    private static final Logger LOGGER = Logger.getLogger(InfinispanService.class.getName());

    void start() {
        if (remoteCacheManager == null) {
            LOGGER.info("InfinispanService is starting in local mode");
            GlobalConfigurationBuilder global = GlobalConfigurationBuilder.defaultClusteredBuilder();
            localCacheManager = new DefaultCacheManager(global.build());
            ConfigurationBuilder builder = new ConfigurationBuilder();
            builder.clustering().cacheMode(CacheMode.LOCAL);
            environments = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(Environment.CACHE, builder.build());
            projects = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(Project.CACHE, builder.build());
            files = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(ProjectFile.CACHE, builder.build());
            pipelineStatuses = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(PipelineStatus.CACHE, builder.build());
            deploymentStatuses = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(DeploymentStatus.CACHE, builder.build());
            podStatuses = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(PodStatus.CACHE, builder.build());
            serviceStatuses = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(ServiceStatus.CACHE, builder.build());
            camelStatuses = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(CamelStatus.CACHE, builder.build());
            commits = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache("commits", builder.build());
            runnerStatuses = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache("runner_statuses", builder.build());
            runnerCommands = localCacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(RunnerCommand.CACHE, builder.build());
            cleanData();
        } else {
            LOGGER.info("InfinispanService is starting in remote mode");
            environments = remoteCacheManager.administration().getOrCreateCache(Environment.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, Environment.CACHE)));
            projects = remoteCacheManager.administration().getOrCreateCache(Project.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, Project.CACHE)));
            files = remoteCacheManager.administration().getOrCreateCache(ProjectFile.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, ProjectFile.CACHE)));
            pipelineStatuses = remoteCacheManager.administration().getOrCreateCache(PipelineStatus.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, PipelineStatus.CACHE)));
            deploymentStatuses = remoteCacheManager.administration().getOrCreateCache(DeploymentStatus.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, DeploymentStatus.CACHE)));
            podStatuses = remoteCacheManager.administration().getOrCreateCache(PodStatus.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, PodStatus.CACHE)));
            serviceStatuses = remoteCacheManager.administration().getOrCreateCache(ServiceStatus.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, ServiceStatus.CACHE)));
            camelStatuses = remoteCacheManager.administration().getOrCreateCache(CamelStatus.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, CamelStatus.CACHE)));
            commits = remoteCacheManager.administration().getOrCreateCache("commits", new StringConfiguration(String.format(CACHE_CONFIG, "commits")));
            runnerStatuses = remoteCacheManager.administration().getOrCreateCache("runner_statuses", new StringConfiguration(String.format(CACHE_CONFIG, "runner_statuses")));
            runnerCommands = remoteCacheManager.administration().getOrCreateCache(RunnerCommand.CACHE, new StringConfiguration(String.format(CACHE_CONFIG, RunnerCommand.CACHE)));
        }
        addListeners();
        ready.set(true);
    }

    @Inject
    KubernetesService kubernetesService;

    private void addListeners() {
        if (remoteCacheManager != null) {
            remoteCacheManager.getCache(RunnerCommand.CACHE).addClientListener(new ClientRunnerListener(this, kubernetesService));
        } else {
            localCacheManager.getCache(RunnerCommand.CACHE).addListener(new LocalRunnerListener(this, kubernetesService));
        }
    }

    private void cleanData() {
        environments.clear();
        deploymentStatuses.clear();
        podStatuses.clear();
        pipelineStatuses.clear();
        camelStatuses.clear();
    }


    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project, boolean imported) {
        GroupedKey key = GroupedKey.create(project.getProjectId(), project.getProjectId());
        boolean isNew = !projects.containsKey(key);
        projects.put(key, project);
        if (isNew && !imported){
            String filename = APPLICATION_PROPERTIES_FILENAME;
            String code = codeService.getApplicationProperties(project);
            files.put(new GroupedKey(project.getProjectId(), filename), new ProjectFile(filename, code, project.getProjectId(), Instant.now().toEpochMilli()));
        }
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        if (remoteCacheManager == null) {
            return files.values().stream()
                    .filter(f -> f.getProjectId().equals(projectId))
                    .collect(Collectors.toList());
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) files);
            return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId")
                    .setParameter("projectId", projectId)
                    .execute().list();
        }
    }

    public ProjectFile getProjectFile(String projectId, String filename) {
        if (remoteCacheManager == null) {
            return files.values().stream()
                    .filter(f -> f.getProjectId().equals(projectId) && f.getName().equals(filename))
                    .findFirst().orElse(new ProjectFile());
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) files);
            return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId AND name = :name")
                    .setParameter("projectId", projectId)
                    .setParameter("name", filename)
                    .execute().list().get(0);
        }
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
        if (remoteCacheManager == null) {
            return  deploymentStatuses.values().stream()
                    .filter(s -> s.getEnv().equals(env))
                    .collect(Collectors.toList());
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) deploymentStatuses);
            return queryFactory.<DeploymentStatus>create("FROM karavan.DeploymentStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        }
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
        if (remoteCacheManager == null) {
            return podStatuses.values().stream()
                    .filter(s -> s.getEnv().equals(env) && s.getProject().equals(projectId))
                    .collect(Collectors.toList());
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
            return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE project = :project AND env = :env")
                    .setParameter("project", projectId)
                    .setParameter("env", env)
                    .execute().list();
        }
    }

    public List<PodStatus> getPodStatuses(String env) {
        if (remoteCacheManager == null) {
            return podStatuses.values().stream()
                    .filter(s -> s.getEnv().equals(env))
                    .collect(Collectors.toList());
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
            return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        }
    }

    public void savePodStatus(PodStatus status) {
        podStatuses.put(GroupedKey.create(status.getProject(), status.getName()), status);
    }

    public void deletePodStatus(PodStatus status) {
        podStatuses.remove(GroupedKey.create(status.getProject(), status.getName()));
    }

    public CamelStatus getCamelStatus(String projectId, String env) {
        return camelStatuses.get(GroupedKey.create(projectId, env));
    }

    public List<CamelStatus> getCamelStatuses(String env) {
        if (remoteCacheManager == null) {
            return camelStatuses.values().stream()
                    .filter(s -> s.getEnv().equals(env))
                    .collect(Collectors.toList());
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) camelStatuses);
            return queryFactory.<CamelStatus>create("FROM karavan.CamelStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        }
    }

    public void saveCamelStatus(CamelStatus status) {
        camelStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv()), status);
    }

    public void deleteCamelStatus(String name, String env) {
        camelStatuses.remove(GroupedKey.create(name, env));
    }

    public String getRunnerStatus(String podName, RunnerStatus.NAME statusName) {
        return runnerStatuses.get(GroupedKey.create(podName, statusName.name()));
    }

    public void saveRunnerStatus(String podName, RunnerStatus.NAME statusName, String status) {
        runnerStatuses.put(GroupedKey.create(podName, statusName.name()), status);
    }

    public void saveRunnerStatus(String podName, String statusName, String status) {
        runnerStatuses.put(GroupedKey.create(podName, statusName), status);
    }

    public void deleteRunnerStatus(String podName, RunnerStatus.NAME statusName) {
        runnerStatuses.remove(GroupedKey.create(podName, statusName.name()));
    }

    public void deleteRunnerStatus(String podName, String statusName) {
        runnerStatuses.remove(GroupedKey.create(podName, statusName));
    }

    public void deleteRunnerStatuses(String podName) {
        Arrays.stream(RunnerStatus.NAME.values()).forEach(statusName -> {
            runnerStatuses.remove(GroupedKey.create(podName, statusName.name()));
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

    public void sendRunnerCommand(String projectId, RunnerCommand.NAME command) {
        runnerCommands.put(GroupedKey.create(projectId, command.name()), UUID.randomUUID().toString());
    }

    @Override
    public HealthCheckResponse call() {
        if (remoteCacheManager == null && ready.get()){
            return HealthCheckResponse.up("Infinispan Service is running in local mode.");
        }
        else {
            if (remoteCacheManager != null && remoteCacheManager.isStarted() && ready.get()) {
                return HealthCheckResponse.up("Infinispan Service is running in cluster mode.");
            }
            else {
                return HealthCheckResponse.down("Infinispan Service is not running.");
            }
        }
    }

    protected void clearAllStatuses() {
        CompletableFuture.allOf(
            deploymentStatuses.clearAsync(),
            podStatuses.clearAsync(),
            pipelineStatuses.clearAsync(),
            camelStatuses.clearAsync(),
            runnerStatuses.clearAsync()
        ).join();
    }
}
