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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.apicurio.datamodels.Library;
import io.apicurio.datamodels.openapi.models.OasDocument;
import io.quarkus.qute.Engine;
import io.quarkus.qute.Template;
import org.apache.camel.CamelContext;
import org.apache.camel.generator.openapi.RestDslGenerator;
import org.apache.camel.impl.lw.LightweightCamelContext;
import org.apache.camel.karavan.api.KameletResources;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.GitRepo;
import org.apache.camel.karavan.datagrid.model.GitRepoFile;
import org.apache.camel.karavan.datagrid.model.Project;
import org.apache.camel.karavan.datagrid.model.ProjectFile;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.jboss.logging.Logger;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class CodeService {

    private static final Logger LOGGER = Logger.getLogger(CodeService.class.getName());
    public static final String APPLICATION_PROPERTIES_FILENAME = "application.properties";

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DatagridService datagridService;

    @Inject
    Engine engine;

    List<String> runtimes = List.of("quarkus", "spring-boot");
    List<String> targets = List.of("openshift", "kubernetes");
    List<String> interfaces = List.of("org.apache.camel.AggregationStrategy.java", "org.apache.camel.Processor.java");

    public static final Map<String, String> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", "512Mi",
            "requests.cpu", "500m",
            "limits.memory", "2048Mi",
            "limits.cpu", "2000m"
    );

    public ProjectFile getApplicationProperties(Project project) {
        String target = kubernetesService.isOpenshift() ? "openshift" : "kubernetes";
        String templateName = project.getRuntime() + "-" + target + "-" + APPLICATION_PROPERTIES_FILENAME;
        String templateText = getTemplateText(templateName);
        Template result = engine.parse(templateText);
        String code =  result
                .data("projectId", project.getProjectId())
                .data("projectName", project.getName())
                .data("projectDescription", project.getDescription())
                .data("namespace", kubernetesService.getNamespace())
                .render();
        return new ProjectFile(APPLICATION_PROPERTIES_FILENAME, code, project.getProjectId(), Instant.now().toEpochMilli());
    }

    private String getTemplateText(String fileName) {
        try {
            List<ProjectFile> files = datagridService.getProjectFiles(Project.NAME_TEMPLATES);
            return files.stream().filter(f -> f.getName().equalsIgnoreCase(fileName))
                    .map(ProjectFile::getCode).findFirst().orElse(null);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public Map<String, String> getApplicationPropertiesTemplates() {
        Map<String, String> result = new HashMap<>();

        List<String> files = new ArrayList<>(interfaces);
        files.addAll(targets.stream().map(target -> target + "-" + APPLICATION_PROPERTIES_FILENAME).collect(Collectors.toList()));

        runtimes.forEach(runtime -> {
            files.forEach(file -> {
                String templateName = runtime + "-" + file;
                String templatePath = "/snippets/" + templateName;
                String templateText = getResourceFile(templatePath);
                result.put(templateName, templateText);
            });
        });
        return result;
    }

    public Map<String, String> getPipelinesTemplates() {
        Map<String, String> result = new HashMap<>();

        List<String> files = new ArrayList<>(targets);
        files.addAll(targets.stream().map(target -> target + ".yaml").collect(Collectors.toList()));

        runtimes.forEach(runtime -> {
            files.forEach(file -> {
                String templateName = runtime + "-" + file;
                String templatePath = "/pipelines/" + templateName;
                String templateText = getResourceFile(templatePath);
                result.put(templateName, templateText);
            });
        });
        return result;
    }

    public String getResourceFile(String path) {
        try {
            InputStream inputStream = KameletResources.class.getResourceAsStream(path);
            return new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
        } catch (Exception e) {
            return null;
        }
    }

    public String getPropertyValue(String propFileText, String key) {
        Optional<String> data = propFileText.lines().filter(p -> p.startsWith(key)).findFirst();
        return data.map(s -> s.split("=")[1]).orElse(null);
    }

    public String generate(String fileName, String openApi, boolean generateRoutes) throws Exception {
        final JsonNode node = fileName.endsWith("json") ? readNodeFromJson(openApi) : readNodeFromYaml(openApi);
        OasDocument document = (OasDocument) Library.readDocument(node);
        try (CamelContext context = new LightweightCamelContext()) {
            return RestDslGenerator.toYaml(document).generate(context, generateRoutes);
        }
    }

    private JsonNode readNodeFromJson(String openApi) throws Exception {
        final ObjectMapper mapper = new ObjectMapper();
        return mapper.readTree(openApi);
    }

    private JsonNode readNodeFromYaml(String openApi) throws FileNotFoundException {
        final ObjectMapper mapper = new ObjectMapper();
        Yaml loader = new Yaml(new SafeConstructor());
        Map map = loader.load(openApi);
        return mapper.convertValue(map, JsonNode.class);
    }

    public static Map<String, String> getRunnerContainerResourcesMap(ProjectFile propertiesFile, boolean isOpenshift, boolean isQuarkus) {
        if (!isQuarkus) {
            return DEFAULT_CONTAINER_RESOURCES;
        } else {
            Map<String, String> result = new HashMap<>();
            String patternPrefix = isOpenshift ? "quarkus.openshift.resources." : "quarkus.kubernetes.resources.";
            String devPatternPrefix = "%dev." + patternPrefix;

            List<String> lines = propertiesFile.getCode().lines().collect(Collectors.toList());

            DEFAULT_CONTAINER_RESOURCES.forEach((key, value) -> {
                Optional<String> dev = lines.stream().filter(l -> l.startsWith(devPatternPrefix + key)).findFirst();
                if (dev.isPresent()) {
                    result.put(key, CodeService.getValueForProperty(dev.get(), devPatternPrefix + key));
                } else {
                    Optional<String> prod = lines.stream().filter(l -> l.startsWith(patternPrefix + key)).findFirst();
                    if (prod.isPresent()){
                        result.put(key, CodeService.getValueForProperty(prod.get(), patternPrefix + key));
                    } else {
                        result.put(key, value);
                    }
                }
            });
            return result;
        }
    }

    public String getPropertiesFile(GitRepo repo) {
        try {
            for (GitRepoFile e : repo.getFiles()){
                if (e.getName().equalsIgnoreCase(APPLICATION_PROPERTIES_FILENAME)) {
                    return e.getBody();
                }
            }
        } catch (Exception e) {

        }
        return null;
    }

    public String capitalize(String str) {
        if(str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    public static String getProperty(String file, String property) {
        String prefix = property + "=";
        return  Arrays.stream(file.split(System.lineSeparator())).filter(s -> s.startsWith(prefix))
                .findFirst().orElseGet(() -> "")
                .replace(prefix, "");
    }

    public static String getValueForProperty(String line, String property) {
        String prefix = property + "=";
        return  line.replace(prefix, "");
    }

    public String getProjectDescription(String file) {
        String description = getProperty(file, "camel.jbang.project-description");
        return description != null && !description.isBlank() ? description : getProperty(file, "camel.karavan.project-description");
    }

    public String getProjectName(String file) {
        String name = getProperty(file, "camel.jbang.project-name");
        return name != null && !name.isBlank() ? name : getProperty(file, "camel.karavan.project-name");
    }

    public String getProjectRuntime(String file) {
        return getProperty(file, "camel.jbang.runtime");
    }
}
