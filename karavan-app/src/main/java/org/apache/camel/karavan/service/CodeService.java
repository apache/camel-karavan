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
import org.apache.camel.karavan.model.Project;
import org.apache.camel.karavan.model.ProjectFile;
import org.jboss.logging.Logger;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
public class CodeService {

    private static final Logger LOGGER = Logger.getLogger(CodeService.class.getName());

    @Inject
    KubernetesService kubernetesService;

    @Inject
    InfinispanService infinispanService;

    @Inject
    Engine engine;

    List<String> runtimes = List.of("quarkus", "spring-boot");
    List<String> targets = List.of("openshift", "kubernetes");
    List<String> interfaces = List.of("org.apache.camel.AggregationStrategy.java", "org.apache.camel.Processor.java");

    public String getApplicationProperties(Project project) {
        String target = kubernetesService.isOpenshift() ? "openshift" : "kubernetes";
        String templateName = project.getRuntime() + "-" + target + "-application.properties";
        String templateText = getTemplateText(templateName);
        Template result = engine.parse(templateText);
        return result
                .data("projectId", project.getProjectId())
                .data("projectName", project.getName())
                .data("projectDescription", project.getDescription())
                .data("namespace", kubernetesService.getNamespace())
                .render();
    }

    private String getTemplateText(String fileName) {
        try {
            List<ProjectFile> files = infinispanService.getProjectFiles(Project.NAME_TEMPLATES);
            return files.stream().filter(f -> f.getName().equalsIgnoreCase(fileName))
                    .map(f -> f.getCode()).findFirst().orElse(null);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    public Map<String,String> getApplicationPropertiesTemplates() {
        Map<String, String> result = new HashMap<>();

        List<String> files = new ArrayList<>(interfaces);
        files.addAll(targets.stream().map(target -> target + "-application.properties").collect(Collectors.toList()));

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

    public Map<String,String> getPipelinesTemplates() {
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
            String data = new BufferedReader(new InputStreamReader(inputStream))
                    .lines().collect(Collectors.joining(System.getProperty("line.separator")));
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    public String getPropertyValue(String propFileText, String key) {
        Optional<String> data = propFileText.lines().filter(p -> p.startsWith(key)).findFirst();
        return data.isPresent() ? data.get().split("=")[1] : null;
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
}
