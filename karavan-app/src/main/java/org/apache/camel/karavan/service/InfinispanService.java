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

import org.apache.camel.karavan.model.CamelStatus;
import org.apache.camel.karavan.model.DeploymentStatus;
import org.apache.camel.karavan.model.Environment;
import org.apache.camel.karavan.model.GroupedKey;
import org.apache.camel.karavan.model.Kamelet;
import org.apache.camel.karavan.model.PipelineStatus;
import org.apache.camel.karavan.model.PodStatus;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.infinispan.Cache;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.commons.api.BasicCache;
import org.infinispan.commons.api.CacheContainerAdmin;
import org.infinispan.commons.configuration.XMLStringConfiguration;
import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.configuration.cache.SingleFileStoreConfigurationBuilder;
import org.infinispan.configuration.global.GlobalConfigurationBuilder;
import org.infinispan.manager.DefaultCacheManager;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class InfinispanService {

    BasicCache<GroupedKey, Project> projects;
    BasicCache<GroupedKey, ProjectFile> files;
    BasicCache<GroupedKey, PipelineStatus> pipelineStatuses;
    BasicCache<GroupedKey, DeploymentStatus> deploymentStatuses;
    BasicCache<GroupedKey, PodStatus> podStatuses;
    BasicCache<GroupedKey, CamelStatus> camelStatuses;
    BasicCache<String, String> kamelets;
    BasicCache<String, Environment> environments;

    @Inject
    RemoteCacheManager cacheManager;

    @Inject
    GeneratorService generatorService;

    @ConfigProperty(name = "karavan.default.runtime")
    String runtime;

    private static final String CACHE_CONFIG = "<distributed-cache name=\"%s\">"
            + " <encoding media-type=\"application/x-protostream\"/>"
            + " <groups enabled=\"true\"/>"
            + "</distributed-cache>";

    private static final Logger LOGGER = Logger.getLogger(KaravanService.class.getName());

    void start() {
        if (cacheManager == null) {
            LOGGER.info("InfinispanService is starting in local mode");
            GlobalConfigurationBuilder global = GlobalConfigurationBuilder.defaultClusteredBuilder();
            global.globalState().enable().persistentLocation("karavan-data");
            DefaultCacheManager cacheManager = new DefaultCacheManager(global.build());
            ConfigurationBuilder builder = new ConfigurationBuilder();
            builder.clustering()
                    .cacheMode(CacheMode.LOCAL)
                    .persistence().passivation(false)
                    .addStore(SingleFileStoreConfigurationBuilder.class)
                    .shared(false)
                    .preload(true)
                    .fetchPersistentState(true);
            environments = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(Environment.CACHE, builder.build());
            projects = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(Project.CACHE, builder.build());
            files = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(ProjectFile.CACHE, builder.build());
            pipelineStatuses = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(PipelineStatus.CACHE, builder.build());
            deploymentStatuses = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(DeploymentStatus.CACHE, builder.build());
            podStatuses = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(PodStatus.CACHE, builder.build());
            camelStatuses = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(CamelStatus.CACHE, builder.build());
            kamelets = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(Kamelet.CACHE, builder.build());

            cleanStatuses();
        } else {
            LOGGER.info("InfinispanService is starting in remote mode");
            environments = cacheManager.administration().getOrCreateCache(Environment.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, Environment.CACHE)));
            projects = cacheManager.administration().getOrCreateCache(Project.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, Project.CACHE)));
            files = cacheManager.administration().getOrCreateCache(ProjectFile.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, ProjectFile.CACHE)));
            pipelineStatuses = cacheManager.administration().getOrCreateCache(PipelineStatus.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, PipelineStatus.CACHE)));
            deploymentStatuses = cacheManager.administration().getOrCreateCache(DeploymentStatus.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, DeploymentStatus.CACHE)));
            podStatuses = cacheManager.administration().getOrCreateCache(PodStatus.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, PodStatus.CACHE)));
            camelStatuses = cacheManager.administration().getOrCreateCache(CamelStatus.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, CamelStatus.CACHE)));
            kamelets = cacheManager.administration().getOrCreateCache(Kamelet.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, Kamelet.CACHE)));
        }
    }

    private void cleanStatuses() {
        deploymentStatuses.clear();
        podStatuses.clear();
        pipelineStatuses.clear();
    }


    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project) {
        GroupedKey key = GroupedKey.create(project.getProjectId(), project.getProjectId());
        boolean isNew = !projects.containsKey(key);
        project.setRuntime(Project.CamelRuntime.valueOf(runtime));
        projects.put(key, project);
        if (isNew){
            String filename = "application.properties";
            String code = generatorService.getDefaultApplicationProperties(project);
            files.put(new GroupedKey(project.getProjectId(), filename), new ProjectFile(filename, code, project.getProjectId()));
        }
    }

    public List<ProjectFile> getProjectFiles(String projectId) {
        if (cacheManager == null) {
            QueryFactory queryFactory = org.infinispan.query.Search.getQueryFactory((Cache<?, ?>) files);
            return queryFactory.<ProjectFile>create("FROM org.apache.camel.karavan.model.ProjectFile WHERE projectId = :projectId")
                    .setParameter("projectId", projectId)
                    .execute().list();
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) files);
            return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE projectId = :projectId")
                    .setParameter("projectId", projectId)
                    .execute().list();
        }
    }
    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProjectId(), file.getName()), file);
    }

    public void saveProjectFiles(Map<GroupedKey, ProjectFile> f) {
        files.putAll(f);
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

    public PipelineStatus getPipelineStatus(String projectId) {
        return pipelineStatuses.get(GroupedKey.create(projectId, projectId));
    }

    public void savePipelineStatus(PipelineStatus status) {
        pipelineStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv()), status);
    }

    public void deletePipelineStatus(PipelineStatus status) {
        pipelineStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv()));
    }

    public DeploymentStatus getDeploymentStatus(String name, String env) {
        return deploymentStatuses.get(GroupedKey.create(name, env));
    }

    public void saveDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.put(GroupedKey.create(status.getName(), status.getEnv()), status);
    }

    public void deleteDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.remove(GroupedKey.create(status.getName(), status.getEnv()));
    }

    public List<DeploymentStatus> getDeploymentStatuses() {
        return deploymentStatuses.values().stream().collect(Collectors.toList());
    }

    public List<DeploymentStatus> getDeploymentStatuses(String env) {
        if (cacheManager == null) {
            QueryFactory queryFactory = org.infinispan.query.Search.getQueryFactory((Cache<?, ?>) deploymentStatuses);
            return queryFactory.<DeploymentStatus>create("FROM org.apache.camel.karavan.model.DeploymentStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) deploymentStatuses);
            return queryFactory.<DeploymentStatus>create("FROM karavan.DeploymentStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        }
    }

    public List<PodStatus> getPodStatuses(String projectId, String env) {
        if (cacheManager == null) {
            QueryFactory queryFactory = org.infinispan.query.Search.getQueryFactory((Cache<?, ?>) podStatuses);
            return queryFactory.<PodStatus>create("FROM org.apache.camel.karavan.model.PodStatus WHERE deployment = :deployment AND env = :env")
                    .setParameter("deployment", projectId)
                    .setParameter("env", env)
                    .execute().list();
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
            return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE deployment = :deployment AND env = :env")
                    .setParameter("deployment", projectId)
                    .setParameter("env", env)
                    .execute().list();
        }
    }

    public List<PodStatus> getPodStatuses(String env) {
        if (cacheManager == null) {
            QueryFactory queryFactory = org.infinispan.query.Search.getQueryFactory((Cache<?, ?>) podStatuses);
            return queryFactory.<PodStatus>create("FROM org.apache.camel.karavan.model.PodStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) podStatuses);
            return queryFactory.<PodStatus>create("FROM karavan.PodStatus WHERE env = :env")
                    .setParameter("env", env)
                    .execute().list();
        }
    }

    public void savePodStatus(PodStatus status) {
        podStatuses.put(GroupedKey.create(status.getDeployment(), status.getName()), status);
    }

    public void deletePodStatus(PodStatus status) {
        podStatuses.remove(GroupedKey.create(status.getDeployment(), status.getName()));
    }

    public CamelStatus getCamelStatus(String projectId) {
        return camelStatuses.get(GroupedKey.create(projectId, projectId));
    }

    public void saveCamelStatus(CamelStatus status) {
        camelStatuses.put(GroupedKey.create(status.getProjectId(), status.getProjectId()), status);
    }

    public List<String> getKameletNames() {
        return kamelets.keySet().stream().collect(Collectors.toList());
    }

    public String getKameletYaml(String name) {
        return kamelets.get(name);
    }

    public void saveKamelet(String name, String yaml) {
        kamelets.put(name, yaml);
    }

    public List<Environment> getEnvironments() {
        return environments.values().stream().collect(Collectors.toList());
    }

    public void saveEnvironment(Environment environment) {
        environments.put(environment.getName(), environment);
    }

}
