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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.docker.DockerComposeConverter;
import org.apache.camel.karavan.model.*;
import org.apache.commons.text.StringSubstitutor;
import org.apache.commons.text.lookup.StringLookup;
import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.config.ConfigValue;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.FileSystem;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.KaravanConstants.*;

@ApplicationScoped
public class CodeService {

    private static final Logger LOGGER = Logger.getLogger(CodeService.class.getName());
    public static final String APPLICATION_PROPERTIES_FILENAME = "application.properties";
    public static final String PROPERTY_PROJECT_NAME = "camel.karavan.projectName";
    public static final String PROPERTY_PROJECT_NAME_OLD = "camel.karavan.project-name";
    public static final String BEAN_TEMPLATE_SUFFIX_FILENAME = "-bean-template.camel.yaml";
    public static final String DEV_SERVICES_FILENAME = "devservices.docker-compose.yaml";
    public static final String PROJECT_COMPOSE_FILENAME = "docker-compose.yaml";
    public static final String MARKDOWN_EXTENSION = ".md";
    public static final String PROJECT_JKUBE_EXTENSION = ".jkube.yaml";
    public static final String PROJECT_DEPLOYMENT_JKUBE_FILENAME = "deployment" + PROJECT_JKUBE_EXTENSION;
    private static final String TEMPLATES_PATH = "/templates";
    private static final String CONFIGURATION_PATH = "/configuration";
    private static final String DOCKER_FOLDER = "/docker/";
    private static final String KUBERNETES_FOLDER = "/kubernetes/";
    public static final int INTERNAL_PORT = 8080;
    private static final String BUILDER_POD_FRAGMENT_FILENAME = "builder.pod.jkube.yaml";
    private static final String BUILDER_COMPOSE_FILENAME = "builder.docker-compose.yaml";
    public static final String BUILD_SCRIPT_FILENAME = "build.sh";

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @ConfigProperty(name = "karavan.gav")
    Optional<String> gav;

    @Inject
    ConfigService configService;

    @Inject
    KaravanCache karavanCache;

    @Inject
    Vertx vertx;

    List<String> beansTemplates = List.of("database", "messaging");

    public static final Map<String, String> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", "256Mi",
            "requests.cpu", "500m",
            "limits.memory", "2048Mi",
            "limits.cpu", "2000m"
    );

    public String getProjectDevModeImage(String projectId) {
        try {
            ProjectFile appProp = getApplicationProperties(projectId);
            return getPropertyValue(appProp.getCode(), DEVMODE_IMAGE);
        } catch (Exception e) {
            LOGGER.error("getProjectDevModeImage " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
            return null;
        }
    }

    private ProjectFile getApplicationProperties(String projectId) {
        return karavanCache.getProjectFile(projectId, APPLICATION_PROPERTIES_FILENAME);
    }

    public Map<String, String> getProjectFilesForDevMode(String projectId, Boolean withKamelets) {
        Map<String, String> files = karavanCache.getProjectFiles(projectId).stream()
                .filter(f -> !f.getName().endsWith(MARKDOWN_EXTENSION))
                .filter(f -> !Objects.equals(f.getName(), PROJECT_COMPOSE_FILENAME))
                .filter(f -> !f.getName().endsWith(PROJECT_JKUBE_EXTENSION))
                .filter(this::isDevFile)
                .collect(Collectors.toMap(ProjectFile::getName, ProjectFile::getCode));

        if (withKamelets) {
            karavanCache.getProjectFiles(Project.Type.kamelets.name())
                    .forEach(file -> files.put(file.getName(), file.getCode()));
        }
        return files;
    }

    private boolean isDevFile(ProjectFile f) {
        var filename = f.getName();
        var parts = filename.split("\\.");
        var prefix = parts[0];
        return !configService.getEnvs().contains(prefix);
    }

    public String getBuilderPodFragment() {
        ProjectFile projectFile = karavanCache.getProjectFile(Project.Type.configuration.name(), BUILDER_POD_FRAGMENT_FILENAME);
        return projectFile != null ? projectFile.getCode() : null;
    }

    public String getDeploymentFragment(String projectId) {
        ProjectFile projectFile = karavanCache.getProjectFile(projectId, PROJECT_DEPLOYMENT_JKUBE_FILENAME);
        return projectFile != null ? projectFile.getCode() : null;
    }

    public String getBuilderComposeFragment(String projectId, String tag) {
        ProjectFile projectFile = karavanCache.getProjectFile(Project.Type.configuration.name(), BUILDER_COMPOSE_FILENAME);
        var code = projectFile != null ? projectFile.getCode() : null;
        var code2 = substituteVariables(code, Map.of( "projectId", projectId, "tag", tag));
        return replaceEnvWithRuntimeProperties(code2);
    }

    public String substituteVariables(String template, Map<String, String> variables) {
        StringSubstitutor sub = new StringSubstitutor(variables);
        return sub.replace(template);
    }

    public ProjectFile generateApplicationProperties(Project project) {
        String template = getTemplateText(APPLICATION_PROPERTIES_FILENAME);
        String code = substituteVariables(template, Map.of(
                "projectId", project.getProjectId(),
                "projectName", project.getName()
        ));
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

    public String getBuilderScript() {
        String envTemplate = getConfigurationText(environment + "." + BUILD_SCRIPT_FILENAME);
        return envTemplate != null ? envTemplate : getConfigurationText(BUILD_SCRIPT_FILENAME);
    }

    public String getConfigurationText(String fileName) {
        try {
            List<ProjectFile> files = karavanCache.getProjectFiles(Project.Type.configuration.name());
            // replaceAll("\r\n", "\n")) has been add to eliminate the impact of editing the template files from windows machine.
            return files.stream().filter(f -> f.getName().equalsIgnoreCase(fileName))
                    .map(file-> file.getCode().replaceAll("\r\n", "\n")).findFirst().orElse(null);
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public String getTemplateText(String fileName) {
        try {
            List<ProjectFile> files = karavanCache.getProjectFiles(Project.Type.templates.name());
            // replaceAll("\r\n", "\n")) has been add to eliminate the impact of editing the template files from windows machine.
            return files.stream().filter(f -> f.getName().equalsIgnoreCase(fileName))
                    .map(file-> file.getCode().replaceAll("\r\n", "\n")).findFirst().orElse(null);
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

        var path = TEMPLATES_PATH + (ConfigService.inKubernetes() ? KUBERNETES_FOLDER : DOCKER_FOLDER);

        listResources(path).forEach(filename -> {
            String templatePath = path + filename;
            String templateText = getResourceFile(templatePath);
            if (templateText != null) {
                result.put(filename, templateText);
            }
        });
        return result;
    }

    public Map<String, String> getConfigurationFiles() {
        Map<String, String> result = new HashMap<>();

        var path = CONFIGURATION_PATH + (ConfigService.inKubernetes() ? KUBERNETES_FOLDER : DOCKER_FOLDER);

        listResources(path).forEach(filename -> {
            String templatePath = path + filename;
            String templateText = getResourceFile(templatePath);
            if (templateText != null) {
                result.put(filename, templateText);
            }
        });
        return result;
    }

    public List<String> getTemplatesList() {
        var path = TEMPLATES_PATH + (ConfigService.inKubernetes() ? KUBERNETES_FOLDER : DOCKER_FOLDER);
        return listResources(path);
    }

    public List<String> getConfigurationList() {
        var path = CONFIGURATION_PATH + (ConfigService.inKubernetes() ? KUBERNETES_FOLDER : DOCKER_FOLDER);
        return listResources(path);
    }

    public String getResourceFile(String path) {
        try (InputStream inputStream = CodeService.class.getResourceAsStream(path);
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
             return reader.lines().collect(Collectors.joining(System.lineSeparator()));
        } catch (Exception e) {
            return null;
        }
    }

    public String getPropertyValue(String propFileText, String key) {
        Optional<String> data = propFileText.lines().filter(p -> p.startsWith(key)).findFirst();
        return data.map(s -> s.split("=")[1]).orElse(null);
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

    public static String getPropertyName(String line) {
        var parts = line.indexOf("=");
        return line.substring(0, parts).trim();
    }

    public String getProjectName(String file) {
        String name = getProperty(file, PROPERTY_PROJECT_NAME);
        return name != null && !name.isBlank() ? name : getProperty(file, PROPERTY_PROJECT_NAME_OLD);
    }

    public static String replaceProperty(String file, String property, String value) {
        return file.lines().map(line -> {
            if (line.startsWith(property)) {
                return property + "=" + value;
            } else {
                return line;
            }
        }).collect(Collectors.joining(System.lineSeparator()));
    }

    public static String removePropertiesStartWith(String file, String startWith) {
        return file.lines().filter(line -> !line.startsWith(startWith))
                .collect(Collectors.joining(System.lineSeparator()));
    }

    public ProjectFile createInitialProjectCompose(Project project, int nextAvailablePort) {
        String template = getTemplateText(PROJECT_COMPOSE_FILENAME);
        String code = substituteVariables(template, Map.of(
                "projectId", project.getProjectId(),
                "projectPort", String.valueOf(nextAvailablePort),
                "projectImage", project.getProjectId()
        ));
        return new ProjectFile(PROJECT_COMPOSE_FILENAME, code, project.getProjectId(), Instant.now().toEpochMilli());
    }

    public ProjectFile createInitialDeployment(Project project) {
        String template = getTemplateText(PROJECT_DEPLOYMENT_JKUBE_FILENAME);
        return new ProjectFile(PROJECT_DEPLOYMENT_JKUBE_FILENAME, template, project.getProjectId(), Instant.now().toEpochMilli());
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
        ProjectFile composeFile = karavanCache.getProjectFile(projectId, PROJECT_COMPOSE_FILENAME);
        return getProjectPort(composeFile);
    }

    public String getDockerComposeFileForProject(String projectId) {
        String composeFileName = PROJECT_COMPOSE_FILENAME;
        if (!Objects.equals(environment, DEV)) {
            composeFileName = environment + "." + PROJECT_COMPOSE_FILENAME;
        }
        ProjectFile compose = karavanCache.getProjectFile(projectId, composeFileName);
        if (compose != null) {
            return compose.getCode();
        }
        return null;
    }

    public void updateDockerComposeImage(String projectId, String imageName) {
        ProjectFile compose = karavanCache.getProjectFile(projectId, PROJECT_COMPOSE_FILENAME);
        if (compose != null) {
            DockerComposeService service = DockerComposeConverter.fromCode(compose.getCode(), projectId);
            service.setImage(imageName);
            String code = DockerComposeConverter.toCode(service);
            compose.setCode(code);
            karavanCache.saveProjectFile(compose, false, false);
        }
    }

    public String replaceEnvWithRuntimeProperties(String composeCode) {
        Map<String, String> env = new HashMap<>();
        findVariables(composeCode).forEach(envName -> {
            String envValue = getConfigValue(envName);
            env.put(envName, envValue);
        });
        return substituteVariables(composeCode, env);
    }

    private String getConfigValue(String envName) {
        ConfigValue val = ConfigProvider.getConfig().getConfigValue(envName);
        if (val == null) {
            var canonicalName = toEnvFormat(envName);
            val = ConfigProvider.getConfig().getConfigValue(canonicalName);
        }
        return val != null? val.getValue() : null;
    }

    private static String toEnvFormat(String input) {
        return input.replaceAll("[^a-zA-Z0-9]", "_").toUpperCase();
    }

    private static Set<String> findVariables(String template) {
        Set<String> variables = new HashSet<>();

        StringLookup dummyLookup = key -> {
            variables.add(key);
            return null; // Return null because we are only interested in collecting variable names
        };

        StringSubstitutor s = new StringSubstitutor(dummyLookup);
        s.replace(template);

        return variables;
    }

    private List<String> getEnvironmentVariablesFromString(String file) {
        List<String> vars = new ArrayList<>();
        if (file != null) {
            vars = file.lines().collect(Collectors.toList());
        }
        return vars;
    }

    public List<String> listResources(String resourceFolder) {
        List<String> result = new ArrayList<>();
        try {
            URI uri = Objects.requireNonNull(ConfigService.class.getResource(resourceFolder)).toURI();
            Path myPath;
            FileSystem fileSystem = null;
            if (uri.getScheme().equals("jar")) {
                fileSystem = FileSystems.newFileSystem(uri, Collections.emptyMap());
                myPath = fileSystem.getPath(resourceFolder);
            } else {
                myPath = Paths.get(uri);
            }

            try (var pathsStream = Files.walk(myPath, 10)) {
                pathsStream
                        .filter(Files::isRegularFile)
                        .map(path -> path.getFileName().toString())
                        .forEach(result::add);
            } catch (IOException e) {
                var error = e.getCause() != null ? e.getCause() : e;
                LOGGER.error("IOException", error);
            }
            if (fileSystem != null) {
                fileSystem.close();
            }
        } catch (URISyntaxException | IOException e) {
            var error = e.getCause() != null ? e.getCause() : e;
            LOGGER.error("URISyntaxException | IOException", error);
        }
        return result;
    }

    public String getFileString(String fullName) {
        return vertx.fileSystem().readFileBlocking(fullName).toString();
    }

    public String getGavFormatter() {
        return PROPERTY_NAME_GAV + "=" + getGav();
    }

    public String getGav() {
        return gav.orElse("org.camel.karavan.demo") + ":%s:1";
    }
}
