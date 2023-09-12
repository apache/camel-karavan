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
package org.apache.camel.karavan.code;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.apicurio.datamodels.Library;
import io.apicurio.datamodels.openapi.models.OasDocument;
import io.quarkus.qute.Engine;
import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.CamelContext;
import org.apache.camel.generator.openapi.RestDslGenerator;
import org.apache.camel.impl.DefaultCamelContext;
import org.apache.camel.karavan.api.KameletResources;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.code.model.DockerComposeService;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.git.model.GitRepo;
import org.apache.camel.karavan.git.model.GitRepoFile;
import org.apache.camel.karavan.infinispan.model.Project;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.jboss.logging.Logger;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import java.io.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class CodeService {

    private static final Logger LOGGER = Logger.getLogger(CodeService.class.getName());
    public static final String APPLICATION_PROPERTIES_FILENAME = "application.properties";
    public static final String BUILDER_SCRIPT_FILE_SUFFIX = "builder-script-";
    public static final String DEV_SERVICES_FILENAME = "devservices.yaml";
    public static final String PROJECT_COMPOSE_FILENAME = "project-compose.yaml";
    private static final String SNIPPETS_PATH = "/snippets/";
    private static final int INTERNAL_PORT = 8080;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    InfinispanService infinispanService;

    @Inject
    Engine engine;

    @Inject
    Vertx vertx;

    List<String> runtimes = List.of("quarkus", "spring-boot", "camel-main");
    List<String> targets = List.of("openshift", "kubernetes", "docker");
    List<String> interfaces = List.of("org.apache.camel.AggregationStrategy.java", "org.apache.camel.Processor.java");

    public static final Map<String, String> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", "512Mi",
            "requests.cpu", "500m",
            "limits.memory", "2048Mi",
            "limits.cpu", "2000m"
    );

    public ProjectFile getApplicationProperties(Project project) {
        String target = "docker";
        if (ConfigService.inKubernetes()) {
            target = kubernetesService.isOpenshift() ? "openshift" : "kubernetes";
        }
        String templateName = project.getRuntime() + "-" + target + "-" + APPLICATION_PROPERTIES_FILENAME;
        String templateText = getTemplateText(templateName);
        Template result = engine.parse(templateText);
        TemplateInstance instance = result
                .data("projectId", project.getProjectId())
                .data("projectName", project.getName())
                .data("projectDescription", project.getDescription());
        if (ConfigService.inKubernetes()) {
            instance.data("namespace", kubernetesService.getNamespace());
        }
        String code =  instance.render();
        return new ProjectFile(APPLICATION_PROPERTIES_FILENAME, code, project.getProjectId(), Instant.now().toEpochMilli());
    }

    public String saveProjectFilesInTemp(Map<String, String> files) {
        String temp = vertx.fileSystem().createTempDirectoryBlocking("temp");
        files.forEach((fileName, code) -> addFile(temp, fileName, code));
        return temp;
    }

    private void addFile(String temp, String fileName, String code) {
        try {
            String path = temp + File.separator + fileName;
            vertx.fileSystem().writeFileBlocking(path, Buffer.buffer(code));
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }

    public String getBuilderScript(Project project) {
        String target = ConfigService.inKubernetes()
                ? (kubernetesService.isOpenshift() ? "openshift" : "kubernetes")
                : "docker";
        String templateName = project.getRuntime() + "-builder-script-" + target + ".sh";
        return getTemplateText(templateName);
    }

    public String getTemplateText(String fileName) {
        try {
            List<ProjectFile> files = infinispanService.getProjectFiles(Project.Type.templates.name());
            return files.stream().filter(f -> f.getName().equalsIgnoreCase(fileName))
                    .map(ProjectFile::getCode).findFirst().orElse(null);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public Map<String, String> getTemplates() {
        Map<String, String> result = new HashMap<>();

        List<String> files = new ArrayList<>(interfaces);
        files.addAll(targets.stream().map(target -> target + "-" + APPLICATION_PROPERTIES_FILENAME).toList());
        files.addAll(targets.stream().map(target -> BUILDER_SCRIPT_FILE_SUFFIX + target + ".sh").toList());

        runtimes.forEach(runtime -> {
            files.forEach(file -> {
                String templateName = runtime + "-" + file;
                String templatePath = SNIPPETS_PATH + templateName;
                String templateText = getResourceFile(templatePath);
                result.put(templateName, templateText);
            });
        });

        result.put(PROJECT_COMPOSE_FILENAME, getResourceFile(SNIPPETS_PATH + PROJECT_COMPOSE_FILENAME));
        return result;
    }

    public Map<String, String> getServices() {
        Map<String, String> result = new HashMap<>();
        String templateText = getResourceFile("/services/" + DEV_SERVICES_FILENAME);
        result.put(DEV_SERVICES_FILENAME, templateText);
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
        try (CamelContext context = new DefaultCamelContext()) {
            return RestDslGenerator.toYaml(document).generate(context, generateRoutes);
        }
    }

    private JsonNode readNodeFromJson(String openApi) throws Exception {
        final ObjectMapper mapper = new ObjectMapper();
        return mapper.readTree(openApi);
    }

    private JsonNode readNodeFromYaml(String openApi) throws FileNotFoundException {
        final ObjectMapper mapper = new ObjectMapper();
        Yaml loader = new Yaml(new SafeConstructor(new LoaderOptions()));
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

    public ProjectFile createInitialProjectCompose(Project project) {
        int port = getNextAvailablePort();
        String templateText = getTemplateText(PROJECT_COMPOSE_FILENAME);
        Template result = engine.parse(templateText);
        TemplateInstance instance = result
                .data("projectId", project.getProjectId())
                .data("projectPort", port)
                .data("projectImage", project.getProjectId());
        String code =  instance.render();
        return new ProjectFile(PROJECT_COMPOSE_FILENAME, code, project.getProjectId(), Instant.now().toEpochMilli());
    }

    private int getNextAvailablePort() {
        int dockerPort = dockerService.getMaxPortMapped(INTERNAL_PORT);
        int projectPort = getMaxPortMappedInProjects();
        return Math.max(projectPort, dockerPort) + 1;
    }


    private int getMaxPortMappedInProjects() {
        List<ProjectFile> files =  infinispanService.getProjectFilesByName(PROJECT_COMPOSE_FILENAME).stream()
                .filter(f -> !Objects.equals(f.getProjectId(), Project.Type.templates.name())).toList();
        if (!files.isEmpty()) {
            return files.stream().map(this::getProjectPort)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .max().orElse(INTERNAL_PORT);
        } else {
            return INTERNAL_PORT;
        }
    }

    public Integer getProjectPort(ProjectFile composeFile) {
        DockerComposeService dcs = DockerComposeConverter.fromCode(composeFile.getCode(), composeFile.getProjectId());
        Optional<Integer> port = dcs.getPortsMap().entrySet().stream()
                .filter(e -> Objects.equals(e.getValue(), INTERNAL_PORT)).map(Map.Entry::getKey).findFirst();
        return port.orElse(null);
    }


    public DockerComposeService getInternalDockerComposeService (String name) {
        String composeText = getResourceFile("/services/internal.yaml");
        return DockerComposeConverter.fromCode(composeText, name);
    }


}
