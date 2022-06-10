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

import io.quarkus.runtime.StartupEvent;
import org.apache.camel.karavan.KaravanLifecycleBean;
import org.apache.camel.karavan.model.GroupedKey;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.infinispan.Cache;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.commons.api.BasicCache;
import org.infinispan.commons.api.CacheContainerAdmin;
import org.infinispan.commons.configuration.XMLStringConfiguration;
import org.infinispan.configuration.cache.CacheMode;
import org.infinispan.configuration.cache.ConfigurationBuilder;
import org.infinispan.configuration.global.GlobalConfigurationBuilder;
import org.infinispan.manager.DefaultCacheManager;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@ApplicationScoped
public class InfinispanService {

    BasicCache<GroupedKey, Project> projects;

    BasicCache<GroupedKey, ProjectFile> files;

    @Inject
    RemoteCacheManager cacheManager;

    @Inject
    GeneratorService generatorService;

    private static final String CACHE_CONFIG = "<distributed-cache name=\"%s\">"
            + " <encoding media-type=\"application/x-protostream\"/>"
            + " <groups enabled=\"true\"/>"
            + "</distributed-cache>";

    private static final Logger LOGGER = Logger.getLogger(KaravanLifecycleBean.class.getName());

    void onStart(@Observes StartupEvent ev) {
        if (cacheManager == null) {
            LOGGER.info("InfinispanService is starting in local mode");
            GlobalConfigurationBuilder global = GlobalConfigurationBuilder.defaultClusteredBuilder();
            DefaultCacheManager cacheManager = new DefaultCacheManager(global.build());
            ConfigurationBuilder builder = new ConfigurationBuilder();
            builder.clustering().cacheMode(CacheMode.LOCAL);
            projects = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(Project.CACHE, builder.build());
            files = cacheManager.administration().withFlags(CacheContainerAdmin.AdminFlag.VOLATILE).getOrCreateCache(ProjectFile.CACHE, builder.build());
        } else {
            LOGGER.info("InfinispanService is starting in remote mode");
            projects = cacheManager.administration().getOrCreateCache(Project.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, Project.CACHE)));
            files = cacheManager.administration().getOrCreateCache(ProjectFile.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, ProjectFile.CACHE)));
        }

        for (int i = 0; i < 10; i++){
            String groupId = "org.apache.camel.karavan";
            String artifactId = "parcel-demo" + i;
            Project p = new Project(groupId, artifactId, "1.0.0",  null, Project.ProjectType.values()[new Random().nextInt(2)]);
            this.saveProject(p);

            files.put(GroupedKey.create(p.getKey(),"new-parcels.yaml"), new ProjectFile("new-parcels.yaml", "flows:", p.getKey()));
            files.put(GroupedKey.create(p.getKey(),"parcel-confirmation.yaml"), new ProjectFile("parcel-confirmation.yaml", "rest:", p.getKey()));
            files.put(GroupedKey.create(p.getKey(),"CustomProcessor.java"), new ProjectFile("CustomProcessor.java", "import org.apache.camel.BindToRegistry;\n" +
                    "import org.apache.camel.Exchange;\n" +
                    "import org.apache.camel.Processor;\n" +
                    "\n" +
                    "@BindToRegistry(\"myBean\")\n" +
                    "public class CustomProcessor implements Processor {\n" +
                    "\n" +
                    "  public void process(Exchange exchange) throws Exception {\n" +
                    "      exchange.getIn().setBody(\"Hello world\");\n" +
                    "  }\n" +
                    "}", p.getKey()));
        }
    }

    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project) {
        GroupedKey key = GroupedKey.create(project.getKey(), project.getKey());
        boolean isNew = !projects.containsKey(key);
        projects.put(key, project);
        if (isNew){
            String filename = "application.properties";
            String code = generatorService.getDefaultApplicationProperties(project);
            files.put(new GroupedKey(project.getKey(), filename), new ProjectFile(filename, code, project.getKey()));
        }
    }

    public List<ProjectFile> getProjectFiles(String projectName) {
        if (cacheManager == null) {
            QueryFactory queryFactory = org.infinispan.query.Search.getQueryFactory((Cache<?, ?>) files);
            return queryFactory.<ProjectFile>create("FROM org.apache.camel.karavan.model.ProjectFile WHERE project = :project")
                    .setParameter("project", projectName)
                    .execute().list();
        } else {
            QueryFactory queryFactory = Search.getQueryFactory((RemoteCache<?, ?>) files);
            return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE project = :project")
                    .setParameter("project", projectName)
                    .execute().list();
        }
    }

    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProject(), file.getName()), file);
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
}
