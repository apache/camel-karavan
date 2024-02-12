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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.apicurio.datamodels.Library;
import io.apicurio.datamodels.models.openapi.OpenApiDocument;
import io.quarkus.qute.Engine;
import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import io.smallrye.mutiny.tuples.Tuple3;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.CamelContext;
import org.apache.camel.generator.openapi.RestDslGenerator;
import org.apache.camel.impl.DefaultCamelContext;
import org.apache.camel.karavan.api.KameletResources;
import org.apache.camel.karavan.code.model.DockerComposeService;
import org.apache.camel.karavan.docker.DockerService;
import org.apache.camel.karavan.git.model.GitRepo;
import org.apache.camel.karavan.git.model.GitRepoFile;
import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.Project;
import org.apache.camel.karavan.cache.model.ProjectFile;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
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
    public static final String BUILD_SCRIPT_FILENAME = "build.sh";
    public static final String BEAN_TEMPLATE_SUFFIX_FILENAME = "-bean-template.camel.yaml";
    public static final String DEV_SERVICES_FILENAME = "devservices.yaml";
    public static final String PROJECT_COMPOSE_FILENAME = "docker-compose.yaml";
    public static final String MARKDOWN_EXTENSION = ".md";
    public static final String PROJECT_JKUBE_EXTENSION = ".jkube.yaml";
    public static final String PROJECT_DEPLOYMENT_JKUBE_FILENAME = "deployment" + PROJECT_JKUBE_EXTENSION;
    private static final String SNIPPETS_PATH = "/snippets/";
    private static final String DATA_FOLDER = System.getProperty("user.dir") + File.separator + "data";
    public static final String BUILDER_ENV_MAPPING_FILENAME = "kubernetes-builder-env.properties";
    private static final int INTERNAL_PORT = 8080;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    DockerService dockerService;

    @Inject
    KaravanCacheService karavanCacheService;

    @Inject
    Engine engine;

    @Inject
    Vertx vertx;

    List<String> beansTemplates = List.of("database", "messaging");
    List<String> targets = List.of("openshift", "kubernetes", "docker");
    List<String> interfaces = List.of("org.apache.camel.AggregationStrategy.java", "org.apache.camel.Processor.java");

    public static final Map<String, String> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", "256Mi",
            "requests.cpu", "500m",
            "limits.memory", "2048Mi",
            "limits.cpu", "2000m"
    );

    public Map<String, String> getProjectFilesForDevMode(String projectId, Boolean withKamelets) {
        Map<String, String> files = karavanCacheService.getProjectFiles(projectId).stream()
                .filter(f -> !f.getName().endsWith(MARKDOWN_EXTENSION))
                .filter(f -> !Objects.equals(f.getName(), PROJECT_COMPOSE_FILENAME))
                .filter(f -> !f.getName().endsWith(PROJECT_JKUBE_EXTENSION))
                .collect(Collectors.toMap(ProjectFile::getName, ProjectFile::getCode));

        if (withKamelets) {
            karavanCacheService.getProjectFiles(Project.Type.kamelets.name())
                    .forEach(file -> files.put(file.getName(), file.getCode()));
        }
        return files;
    }

    public List<Tuple3<String, String, String>> getBuilderEnvMapping() {
        List<Tuple3<String, String, String>> result = new ArrayList<>();
        ProjectFile projectFile = karavanCacheService.getProjectFile(Project.Type.templates.name(), BUILDER_ENV_MAPPING_FILENAME);
        if (projectFile != null) {
            String text = projectFile.getCode();
            text.lines().forEach(line -> {
                String[] params = line.split("=");
                if (params.length > 1) {
                    String env = params[0];
                    String[] secret = params[1].split(":");
                    String secretName = secret[0];
                    String secretKey = secret[1];
                    result.add(Tuple3.of(env, secretName, secretKey));
                }
            });
        }

        return result;
    }

    public ProjectFile getApplicationProperties(Project project) {
        String target = "docker";
        if (ConfigService.inKubernetes()) {
            target = kubernetesService.isOpenshift() ? "openshift" : "kubernetes";
        }
        String templateName = target + "-" + APPLICATION_PROPERTIES_FILENAME;
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
            e.printStackTrace();
        }
    }

    public String getBuilderScript() {
        String target = ConfigService.inKubernetes()
                ? (kubernetesService.isOpenshift() ? "openshift" : "kubernetes")
                : "docker";
        String templateName = target + "-" + BUILD_SCRIPT_FILENAME;
        String envTemplate = getTemplateText(environment + "." + templateName);
        return envTemplate != null ? envTemplate : getTemplateText(templateName);
    }

    public String getTemplateText(String fileName) {
        try {
            List<ProjectFile> files = karavanCacheService.getProjectFiles(Project.Type.templates.name());
            return files.stream().filter(f -> f.getName().equalsIgnoreCase(fileName))
                    .map(ProjectFile::getCode).findFirst().orElse(null);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public List<String> getBeanTemplateNames(){
        return beansTemplates.stream().map(name -> name + BEAN_TEMPLATE_SUFFIX_FILENAME).toList();
    }

    public Map<String, String> getTemplates() {
        Map<String, String> result = new HashMap<>();

        List<String> files = new ArrayList<>(interfaces);
        files.addAll(targets.stream().map(target -> target + "-" + APPLICATION_PROPERTIES_FILENAME).toList());
        files.addAll(targets.stream().map(target ->  target + "-" + BUILD_SCRIPT_FILENAME).toList());

        files.addAll(getBeanTemplateNames());

        files.forEach(file -> {
            String templatePath = SNIPPETS_PATH + file;
            String templateText = getResourceFile(templatePath);
            if (templateText != null) {
                result.put(file, templateText);
            }
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
        final ObjectNode node = fileName.endsWith("json") ? readNodeFromJson(openApi) : readNodeFromYaml(openApi);
        OpenApiDocument document = (OpenApiDocument) Library.readDocument(node);
        try (CamelContext context = new DefaultCamelContext()) {
            return RestDslGenerator.toYaml(document).generate(context, generateRoutes);
        }
    }

    private ObjectNode readNodeFromJson(String openApi) throws Exception {
        final ObjectMapper mapper = new ObjectMapper();
        return (ObjectNode) mapper.readTree(openApi);
    }

    private ObjectNode readNodeFromYaml(String openApi) throws FileNotFoundException {
        final ObjectMapper mapper = new ObjectMapper();
        Yaml loader = new Yaml(new SafeConstructor(new LoaderOptions()));
        Map map = loader.load(openApi);
        return mapper.convertValue(map, ObjectNode.class);
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

    public ProjectFile createInitialProjectCompose(Project project) {
        int port = getNextAvailablePort();
        String templateText = getTemplateText(PROJECT_COMPOSE_FILENAME);
        Template result = engine.parse(templateText);
        TemplateInstance instance = result
                .data("projectId", project.getProjectId())
                .data("projectPort", port)
                .data("projectImage", project.getProjectId());
        String code = instance.render();
        return new ProjectFile(PROJECT_COMPOSE_FILENAME, code, project.getProjectId(), Instant.now().toEpochMilli());
    }

    public ProjectFile createInitialDeployment(Project project) {
        String template = getTemplateText(PROJECT_DEPLOYMENT_JKUBE_FILENAME);
        return new ProjectFile(PROJECT_DEPLOYMENT_JKUBE_FILENAME, template, project.getProjectId(), Instant.now().toEpochMilli());
    }

    private int getNextAvailablePort() {
        int dockerPort = dockerService.getMaxPortMapped(INTERNAL_PORT);
        int projectPort = getMaxPortMappedInProjects();
        return Math.max(projectPort, dockerPort) + 1;
    }


    private int getMaxPortMappedInProjects() {
        List<ProjectFile> files =  karavanCacheService.getProjectFilesByName(PROJECT_COMPOSE_FILENAME).stream()
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
        if (composeFile != null) {
            DockerComposeService dcs = DockerComposeConverter.fromCode(composeFile.getCode(), composeFile.getProjectId());
            Optional<Integer> port = dcs.getPortsMap().entrySet().stream()
                    .filter(e -> Objects.equals(e.getValue(), INTERNAL_PORT)).map(Map.Entry::getKey).findFirst();
            return port.orElse(null);
        }
        return null;
    }

    public Integer getProjectPort(String projectId) {
        ProjectFile composeFile = karavanCacheService.getProjectFile(projectId, PROJECT_COMPOSE_FILENAME);
        return getProjectPort(composeFile);
    }


    public DockerComposeService getInternalDockerComposeService (String name) {
        String composeText = getResourceFile("/services/internal.yaml");
        return DockerComposeConverter.fromCode(composeText, name);
    }

    public DockerComposeService getDockerComposeService(String projectId) {
        ProjectFile compose = karavanCacheService.getProjectFile(projectId, PROJECT_COMPOSE_FILENAME);
        if (compose != null) {
            return DockerComposeConverter.fromCode(compose.getCode(), projectId);
        }
        return null;
    }

    public void updateDockerComposeImage(String projectId, String imageName) {
        ProjectFile compose = karavanCacheService.getProjectFile(projectId, PROJECT_COMPOSE_FILENAME);
        if (compose != null) {
            DockerComposeService service = DockerComposeConverter.fromCode(compose.getCode(), projectId);
            service.setImage(imageName);
            String code = DockerComposeConverter.toCode(service);
            compose.setCode(code);
            karavanCacheService.saveProjectFile(compose);
        }
    }

    public List<String> getComposeEnvironmentVariables(String projectId) {
        DockerComposeService compose = getDockerComposeService(projectId);
        return getComposeEnvironmentVariables(compose);
    }

    public List<String> getComposeEnvironmentVariables(DockerComposeService compose) {
        List<String> vars = new ArrayList<>();
        if (compose.getEnv_file() != null && !compose.getEnv_file().isEmpty()) {
            compose.getEnv_file().forEach(name -> {
                String file = getDataFile(name);
                vars.addAll(getEnvironmentVariablesFromString(file));
            });
        }
        return vars;
    }

    private List<String> getEnvironmentVariablesFromString(String file) {
        List<String> vars = new ArrayList<>();
        if (file != null) {
            vars = file.lines().collect(Collectors.toList());
        }
        return vars;
    }

    public String getDataFile(String name) {
        String fileName = DATA_FOLDER + File.separator + name;
        return vertx.fileSystem().readFileBlocking(fileName).toString();
    }

    public String getFileString(String fullName) {
        return vertx.fileSystem().readFileBlocking(fullName).toString();
    }

}
