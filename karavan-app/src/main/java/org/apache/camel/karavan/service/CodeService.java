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
import io.smallrye.mutiny.tuples.Tuple3;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanCache;
import org.apache.camel.karavan.docker.DockerComposeConverter;
import org.apache.camel.karavan.model.*;
import org.eclipse.microprofile.config.ConfigProvider;
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

import static org.apache.camel.karavan.KaravanConstants.DEVMODE_IMAGE;
import static org.apache.camel.karavan.KaravanConstants.DEV_ENVIRONMENT;

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
    private static final String TEMPLATES_PATH = "/templates/";
//    private static final String DATA_FOLDER = System.getProperty("user.dir") + File.separator + "data";
    public static final String ENV_MAPPING_FILENAME = "env-mapping.properties";
    public static final int INTERNAL_PORT = 8080;
    private static final String ENV_MAPPING_START = "{{";
    private static final String ENV_MAPPING_END = "}}";

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    KaravanCache karavanCache;

    @Inject
    Vertx vertx;

    List<String> blockList = List.of("components-blocklist.txt", "kamelets-blocklist.txt");
    List<String> beansTemplates = List.of("database", "messaging");
    List<String> interfaces = List.of("org.apache.camel.AggregationStrategy.java", "org.apache.camel.Processor.java");

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
                .collect(Collectors.toMap(ProjectFile::getName, ProjectFile::getCode));

        if (withKamelets) {
            karavanCache.getProjectFiles(Project.Type.kamelets.name())
                    .forEach(file -> files.put(file.getName(), file.getCode()));
        }
        return files;
    }

    public List<Tuple3<String, String, String>> getBuilderEnvMapping() {
        List<Tuple3<String, String, String>> result = new ArrayList<>();
        ProjectFile projectFile = karavanCache.getProjectFile(Project.Type.templates.name(), ENV_MAPPING_FILENAME);
        if (projectFile != null) {
            String text = projectFile.getCode();
            text.lines().forEach(line -> {
                String[] params = line.split("=");
                if (params.length > 1) {
                    String env = params[0];
                    String[] secret = params[1].split(":");
                    if (secret.length > 1) {
                        String secretName = secret[0];
                        String secretKey = secret[1];
                        result.add(Tuple3.of(env, secretName, secretKey));
                    } else {
                        result.add(Tuple3.of(env, secret[0], null));
                    }
                }
            });
        }

        return result;
    }

    public ProjectFile generateApplicationProperties(Project project) {
        String code = getTemplateText(APPLICATION_PROPERTIES_FILENAME);
        if (code != null) {
            code = code.replace("{projectId}", project.getProjectId());
            code = code.replace("{projectName}", project.getName());
        }
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
        String envTemplate = getTemplateText(environment + "." + BUILD_SCRIPT_FILENAME);
        return envTemplate != null ? envTemplate : getTemplateText(BUILD_SCRIPT_FILENAME);
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

        if (ConfigService.inKubernetes()) {
//            if (kubernetesAPI.isOpenshift()) {
//                result.put(APPLICATION_PROPERTIES_FILENAME, getResourceFile(TEMPLATES_PATH + "openshift-" + APPLICATION_PROPERTIES_FILENAME));
//                result.put(BUILD_SCRIPT_FILENAME, getResourceFile(TEMPLATES_PATH + "openshift-" + BUILD_SCRIPT_FILENAME));
//            } else {
            result.put(APPLICATION_PROPERTIES_FILENAME, getResourceFile(TEMPLATES_PATH + "kubernetes-" + APPLICATION_PROPERTIES_FILENAME));
            result.put(BUILD_SCRIPT_FILENAME, getResourceFile(TEMPLATES_PATH + "kubernetes-" + BUILD_SCRIPT_FILENAME));
//            }
            result.put(ENV_MAPPING_FILENAME, getResourceFile(TEMPLATES_PATH + ENV_MAPPING_FILENAME));
            result.put(PROJECT_DEPLOYMENT_JKUBE_FILENAME, getResourceFile(TEMPLATES_PATH + PROJECT_DEPLOYMENT_JKUBE_FILENAME));
        } else {
            result.put(APPLICATION_PROPERTIES_FILENAME, getResourceFile(TEMPLATES_PATH + "docker-" + APPLICATION_PROPERTIES_FILENAME));
            result.put(BUILD_SCRIPT_FILENAME, getResourceFile(TEMPLATES_PATH + "docker-" + BUILD_SCRIPT_FILENAME));
        }

        List<String> files = new ArrayList<>(interfaces);
        files.addAll(blockList);
        files.addAll(getBeanTemplateNames());

        files.forEach(file -> {
            String templatePath = TEMPLATES_PATH + file;
            String templateText = getResourceFile(templatePath);
            if (templateText != null) {
                result.put(file, templateText);
            }
        });

        result.put(PROJECT_COMPOSE_FILENAME, getResourceFile(TEMPLATES_PATH + PROJECT_COMPOSE_FILENAME));
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
            InputStream inputStream = CodeService.class.getResourceAsStream(path);
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

    public String getProjectName(String file) {
        String name = getProperty(file, "camel.jbang.project-name");
        return name != null && !name.isBlank() ? name : getProperty(file, "camel.karavan.project-name");
    }

    public ProjectFile createInitialProjectCompose(Project project, int nextAvailablePort) {
        String code = getTemplateText(PROJECT_COMPOSE_FILENAME);
        if (code != null) {
            code = code.replace("{projectId}", project.getProjectId());
            code = code.replace("{projectPort}", String.valueOf(nextAvailablePort));
            code = code.replace("{projectImage}", project.getProjectId());
        }
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

    public DockerComposeService getDockerComposeService(String projectId) {
        String composeFileName = PROJECT_COMPOSE_FILENAME;
        if (!Objects.equals(environment, DEV_ENVIRONMENT)) {
            composeFileName = environment + "." + PROJECT_COMPOSE_FILENAME;
        }
        ProjectFile compose = karavanCache.getProjectFile(projectId, composeFileName);
        if (compose != null) {
            return DockerComposeConverter.fromCode(compose.getCode(), projectId);
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
            karavanCache.saveProjectFile(compose, false);
        }
    }

    public List<String> getComposeEnvWithRuntimeMapping(DockerComposeService compose) {
        List<String> vars = new ArrayList<>();
        if (compose.getEnvironment() != null) {
            compose.getEnvironment().forEach((key, value) -> {
                if (value != null && value.startsWith(ENV_MAPPING_START)) {
                    var envName = value.replace(ENV_MAPPING_START, "").replace(ENV_MAPPING_END, "");
                    String envValue = ConfigProvider.getConfig().getValue(envName, String.class);
                    vars.add(key + "=" + envValue);
                } else {
                    vars.add(key + "=" + value);
                }
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

//    public String getDataFile(String name) {
//        String fileName = DATA_FOLDER + File.separator + name;
//        return vertx.fileSystem().readFileBlocking(fileName).toString();
//    }

    public List<String> listResources(String resourceFolder, boolean onlyFolders) {
        List<String> filePaths = new ArrayList<>();
        try {
            URI uri = CodeService.class.getResource(resourceFolder).toURI();
            Path myPath;
            FileSystem fileSystem = null;
            if (uri.getScheme().equals("jar")) {
                fileSystem = FileSystems.newFileSystem(uri, Collections.emptyMap());
                myPath = fileSystem.getPath(resourceFolder);
            } else {
                myPath = Paths.get(uri);
            }

            if (onlyFolders) {
                // Use Files.walk to list and collect directory paths
                filePaths = Files.walk(myPath, 10)
                        .filter(Files::isDirectory)
                        .map(path -> path.getFileName().toString())
                        .collect(Collectors.toList());
            } else {
                // Use Files.walk to list and collect file paths
                filePaths = Files.walk(myPath, 1)
                        .filter(Files::isRegularFile)
                        .map(path -> path.getFileName().toString())
                        .collect(Collectors.toList());
            }

            // Close the file system if opened
            if (fileSystem != null) {
                fileSystem.close();
            }
        } catch (URISyntaxException | IOException e) {
            e.printStackTrace();
        }
        return filePaths;
    }

    public String getFileString(String fullName) {
        return vertx.fileSystem().readFileBlocking(fullName).toString();
    }

}
