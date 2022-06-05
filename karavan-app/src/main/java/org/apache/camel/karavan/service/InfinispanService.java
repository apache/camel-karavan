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

import io.quarkus.infinispan.client.Remote;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import org.apache.camel.karavan.KaravanLifecycleBean;
import org.apache.camel.karavan.model.GroupedKey;
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.RemoteCacheManager;
import org.infinispan.client.hotrod.Search;
import org.infinispan.commons.configuration.XMLStringConfiguration;
import org.infinispan.query.dsl.QueryFactory;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Random;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@ApplicationScoped
public class InfinispanService {

    RemoteCache<GroupedKey, Project> projects;

    RemoteCache<GroupedKey, ProjectFile> files;

    @Inject
    RemoteCacheManager cacheManager;

    private static final String CACHE_CONFIG = "<distributed-cache name=\"%s\">"
            + " <encoding media-type=\"application/x-protostream\"/>"
            + " <groups enabled=\"true\"/>"
            + "</distributed-cache>";

    private static final Logger LOGGER = Logger.getLogger(KaravanLifecycleBean.class.getName());

    void onStart(@Observes StartupEvent ev)  {
        LOGGER.info("InfinispanService is starting");
        projects = cacheManager.administration().getOrCreateCache(Project.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, Project.CACHE)));
        files = cacheManager.administration().getOrCreateCache(ProjectFile.CACHE, new XMLStringConfiguration(String.format(CACHE_CONFIG, ProjectFile.CACHE)));

        for (int i = 0; i < 10; i++){
            String project = "parcel-demo" + i;
            projects.put(GroupedKey.create(project, project), new Project(project, "1.0.0",  project, Project.ProjectType.values()[new Random().nextInt(3)]));

            files.put(GroupedKey.create(project,"new-parcels.yaml"), new ProjectFile("new-parcels.yaml", "flows:", project));
            files.put(GroupedKey.create(project,"parcel-confirmation.yaml"), new ProjectFile("parcel-confirmation.yaml", "rest:", project));
            files.put(GroupedKey.create(project,"CustomProcessor.java"), new ProjectFile("CustomProcessor.java", "import org.apache.camel.BindToRegistry;\n" +
                    "import org.apache.camel.Exchange;\n" +
                    "import org.apache.camel.Processor;\n" +
                    "\n" +
                    "@BindToRegistry(\"myBean\")\n" +
                    "public class CustomProcessor implements Processor {\n" +
                    "\n" +
                    "  public void process(Exchange exchange) throws Exception {\n" +
                    "      exchange.getIn().setBody(\"Hello world\");\n" +
                    "  }\n" +
                    "}", project));
            files.put(GroupedKey.create(project,"application.properties"), new ProjectFile("application.properties", "parameter1:hello", project));
        }
    }

    public List<Project> getProjects() {
        return projects.values().stream().collect(Collectors.toList());
    }

    public void saveProject(Project project) {
        projects.put(GroupedKey.create(project.getName(), project.getName()), project);
    }

    public List<ProjectFile> getProjectFiles(String projectName) {
        QueryFactory queryFactory = Search.getQueryFactory(files);
        return queryFactory.<ProjectFile>create("FROM karavan.ProjectFile WHERE project = :project")
                .setParameter("project", projectName)
                .execute().list();
    }

    public void saveProjectFile(ProjectFile file) {
        files.put(GroupedKey.create(file.getProject(), file.getName()), file);
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
