package org.apache.camel.karavan.service;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.complexity.ComplexityComponent;
import org.apache.camel.karavan.complexity.ComplexityFile;
import org.apache.camel.karavan.complexity.ComplexityProject;
import org.apache.camel.karavan.complexity.ComplexityRoute;
import org.jboss.logging.Logger;
import org.yaml.snakeyaml.Yaml;

import java.util.*;

import static org.apache.camel.karavan.service.CodeService.APPLICATION_PROPERTIES_FILENAME;
import static org.apache.camel.karavan.service.CodeService.CAMEL_YAML_EXTENSION;

@ApplicationScoped
public class ComplexityService {

    private static final Logger LOGGER = Logger.getLogger(ComplexityService.class.getName());

    @Inject
    KaravanCache karavanCache;

    @Inject
    CamelComponentService componentService;

    @Inject
    CodeService codeService;

    public List<ComplexityProject> getProjectComplexities() {
        return karavanCache.getFolders().stream()
                .filter(p -> Objects.equals(p.getType(), ProjectFolder.Type.integration)
                        || Objects.equals(p.getType(), ProjectFolder.Type.templates)
                        || Objects.equals(p.getType(), ProjectFolder.Type.kamelets)
                        || Objects.equals(p.getType(), ProjectFolder.Type.documentation))
                .map(this::getProjectComplexity).toList();
    }

    public ComplexityProject getProjectComplexity(String projectId) {
        var project =  karavanCache.getProject(projectId);
        return getProjectComplexity(project);
    }

    public ComplexityProject getProjectComplexity(ProjectFolder project) {
        var projectId = project.getProjectId();
        ComplexityProject complexityProject = new ComplexityProject();
        complexityProject.setProjectId(projectId);
        complexityProject.setType(project.getType().name());
        try {
            complexityProject.setLastUpdateDate(karavanCache.getProjectFiles(projectId).stream().mapToLong(ProjectFile::getLastUpdate).max().orElse(0));
            List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
            List<ComplexityRoute> routes = new ArrayList<>();
            for (ProjectFile file : files) {
                ComplexityFile complexityFile = new ComplexityFile();
                try {
                    complexityFile.setFileName(file.getName());
                    complexityFile.setChars(file.getCode().length());

                    if (file.getName().endsWith(CAMEL_YAML_EXTENSION)) {
                        complexityFile.setType(ComplexityFile.Type.camel);
                        complexityFile.setGenerated(file.getName().startsWith("_gen_"));
                        complexityFile.setBeans(getFileBeandCount(file.getCode()));
                        complexityFile.setRests(getFileRestCount(file.getCode()));
                        List<ComplexityRoute> routes1 = getRoutes(file.getCode(), file.getName());
                        complexityFile.setRoutes(routes1.size());
                        routes1.forEach(r -> r.getProcessors().forEach(complexityFile::addProcessor));
                        routes1.forEach(r -> r.getComponentsExt().forEach(complexityFile::addComponentExt));
                        routes1.forEach(r -> r.getComponentsInt().forEach(complexityFile::addComponentInt));
                        routes1.forEach(r -> r.getKamelets().forEach(complexityFile::addKamelet));
                        routes.addAll(routes1);

                    } else if (file.getName().equals(APPLICATION_PROPERTIES_FILENAME)) {
                        complexityFile.setType(ComplexityFile.Type.properties);
                        complexityProject.setDependencies(getDependencies(file.getCode()));
                    } else if (file.getName().endsWith(".docker-compose.yaml")) {
                        complexityFile.setType(ComplexityFile.Type.docker);
                    } else if (file.getName().startsWith("jkube.") && file.getName().endsWith(".yaml")) {
                        complexityFile.setType(ComplexityFile.Type.kubernetes);
                    } else if (file.getName().endsWith("kubernetes.yaml")) {
                        complexityFile.setType(ComplexityFile.Type.kubernetes);
                    } else if (file.getName().endsWith(".java")) {
                        complexityFile.setType(ComplexityFile.Type.java);
                    } else if (file.getName().equals("openapi.json")) {
                        complexityFile.setType(ComplexityFile.Type.openapi);
                        complexityProject.setExposesOpenApi(true);
                    } else {
                        complexityFile.setType(ComplexityFile.Type.other);
                    }
                } catch (Exception e) {
                    complexityFile.setError(e.getMessage());
                } finally {
                    complexityProject.addFile(complexityFile);
                }
            }
            var augmentedRoutes = augmentTemplatedRoutes(routes);
            complexityProject.setRoutes(augmentedRoutes);
        } catch (Exception e) {
            LOGGER.error(e);
//            e.printStackTrace();
        }

        return complexityProject;
    }

    private List<ComplexityRoute> getRoutesByType(List<ComplexityRoute> routes, ComplexityRoute.Type type) {
        return new ArrayList<>(routes.stream().filter(route -> type.equals(route.getType())).toList());
    }

    private List<ComplexityRoute> augmentTemplatedRoutes(List<ComplexityRoute> routes) {
        List<ComplexityRoute> templatedRoutes = getRoutesByType(routes, ComplexityRoute.Type.TEMPLATED_ROUTE);
        List<ComplexityRoute> augmentedRoutes = new ArrayList<>(templatedRoutes.size());
        List<ComplexityRoute> templates = getRoutesByType(routes, ComplexityRoute.Type.ROUTE_TEMPlATE);
        templatedRoutes.forEach(route -> {
            var routeTemplate = templates.stream().filter(t -> t.getRouteTemplateRef().equals(route.getRouteTemplateRef())).findFirst();
            if (routeTemplate.isPresent()) {
                var template = routeTemplate.get();
                List<ComplexityComponent> consumers = new ArrayList<>();
                template.getConsumers().forEach(c -> {
                    var newC = c.copy();
                    Map<String, String> params = new HashMap<>();
                    c.getParameters().forEach((key, value) -> {
                        if (value.startsWith("{{") && value.endsWith("}}")) {
                            var paramName = value.substring(2, value.length() - 2);
                            params.put(key, route.getParameters().getOrDefault(paramName, value).toString());
                        } else {
                            params.put(key, value);
                        }
                    });
                    newC.setParameters(params);
                    consumers.add(newC);
                });
                route.setConsumers(consumers);

                List<ComplexityComponent> producers = new ArrayList<>();
                template.getProducers().forEach(c -> {
                    var newC = c.copy();
                    Map<String, String> params = new HashMap<>();
                    c.getParameters().forEach((key, value) -> {
                        if (value.startsWith("{{") && value.endsWith("}}")) {
                            var paramName = value.substring(2, value.length() - 2);
                            params.put(key, route.getParameters().getOrDefault(paramName, value).toString());
                        } else {
                            params.put(key, value);
                        }
                    });
                    newC.setParameters(params);
                    producers.add(newC);
                });
                route.setProducers(producers);
                augmentedRoutes.add(route.copy());
            }
        });
        List<ComplexityRoute> result = getRoutesByType(routes, ComplexityRoute.Type.ROUTE);
        result.addAll(templates);
        result.addAll(augmentedRoutes);
        return result;
    }

    public List<String> getDependencies(String code) {
        List<String> result = new ArrayList<>();
        var value = codeService.getPropertyValue(code, "camel.jbang.dependencies");
        result.addAll(Arrays.stream(value.split(",")).map(String::trim).toList());
        return result;
    }

    public Integer getFileBeandCount(String code) {
        int result = 0;
        Yaml yaml = new Yaml();
        List<Object> obj = yaml.load(code);
        JsonArray json = JsonArray.of(obj);
        for (Object list : json) {
            if (list instanceof JsonArray l) {
                for (Object obj1 : l) {
                    var element = (JsonObject) obj1;
                    if (element.containsKey("beans")) {
                        result = result + element.getJsonArray("beans").size();
                    }
                }
            }
        }
        return result;
    }

    public Integer getFileRestCount(String code) {
        int result = 0;
        Yaml yaml = new Yaml();
        List<Object> obj = yaml.load(code);
        JsonArray json = JsonArray.of(obj);
        for (Object list : json) {
            if (list instanceof JsonArray l) {
                for (Object obj1 : l) {
                    var element = (JsonObject) obj1;
                    if (element.containsKey("rest")) {
                        var rest = element.getJsonObject("rest");
                        if (rest.containsKey("get")) {
                            result = result + rest.getJsonArray("get").size();
                        }
                        if (rest.containsKey("post")) {
                            result = result + rest.getJsonArray("post").size();
                        }
                        if (rest.containsKey("put")) {
                            result = result + rest.getJsonArray("put").size();
                        }
                        if (rest.containsKey("delete")) {
                            result = result + rest.getJsonArray("delete").size();
                        }
                        if (rest.containsKey("patch")) {
                            result = result + rest.getJsonArray("patch").size();
                        }
                        if (rest.containsKey("head")) {
                            result = result + rest.getJsonArray("head").size();
                        }
                    }
                }
            }
        }
        return result;
    }

    private List<ComplexityRoute> getRoutes(String code, String fileName) {
        List<ComplexityRoute> result = new ArrayList<>();
        JsonArray json = getRouteJsonArray(code);
        for (Object list : json) {
            if (list instanceof JsonArray l) {
                for (Object obj1 : l) {
                    var element = (JsonObject) obj1;
                    if (element.containsKey("route")) {
                        var r = element.getJsonObject("route");
                        result.add(getRouteComplexity(r, fileName));
                    } else if (element.containsKey("routeTemplate")) {
                        var rt = element.getJsonObject("routeTemplate");
                        var r = rt.getJsonObject("route");
                        var routeTemplateRef = rt.getString("id");
                        var complexity = getRouteComplexity(r, fileName);
                        complexity.setRouteTemplateRef(routeTemplateRef);
                        complexity.setType(ComplexityRoute.Type.ROUTE_TEMPlATE);
                        result.add(complexity);
                    } else if (element.containsKey("templatedRoute")) {
                        var tr = element.getJsonObject("templatedRoute");
                        result.add(getTemplatedRouteComplexity(tr, fileName));
                    }
                }
            }
        }
        return result;
    }

    public JsonArray getRouteJsonArray(String code) {
        Yaml yaml = new Yaml();
        List<Object> obj = yaml.load(code);
        return JsonArray.of(obj);
    }

    public ComplexityRoute getRouteComplexity(JsonObject route, String fileName) {
        ComplexityRoute complexity = new ComplexityRoute();
        complexity.setFileName(fileName);
        try {
            complexity.setRouteId(route.getString("id"));
            complexity.setNodePrefixId(route.getString("nodePrefixId"));
            complexity.setRouteDescription(route.getString("description"));
            complexity.setType(ComplexityRoute.Type.ROUTE);
            var from = route.getJsonObject("from");
            var id = from.getString("id");
            var fromUri = from.getString("uri");
            var parameters = componentService.getComponentDefaultParameters(fromUri);
            var params = from.containsKey("parameters") ? from.getJsonObject("parameters") : JsonObject.of();
            for (String key: params.fieldNames()) {
                parameters.put(key, params.getString(key));
            }
            complexity.addConsumer(new ComplexityComponent(id, fromUri, componentService.isComponentRemote(fromUri), parameters));
            if (fromUri != null && fromUri.startsWith("kamelet:")) {
                complexity.addKamelet(fromUri);
            } else if (fromUri != null && (fromUri.startsWith("direct") || fromUri.startsWith("seda") || fromUri.startsWith("vertx"))) {
                complexity.addComponentInt(fromUri);
            } else if (fromUri != null) {
                complexity.addComponentExt(fromUri);
            }
            var steps = from.getJsonArray("steps");
            if (steps != null) {
                return getStepsComplexity(complexity, steps);
            }
        } catch (Exception e) {
            LOGGER.error(e);
            e.printStackTrace();
        }
        return complexity;
    }

    private ComplexityRoute getTemplatedRouteComplexity(JsonObject templatedRoute, String fileName) {
        ComplexityRoute complexity = new ComplexityRoute();
        complexity.setFileName(fileName);
        try {
            complexity.setRouteId(templatedRoute.getString("routeId"));
            complexity.setRouteTemplateRef(templatedRoute.getString("routeTemplateRef"));
            complexity.setType(ComplexityRoute.Type.TEMPLATED_ROUTE);
            complexity.setNodePrefixId(templatedRoute.getString("prefixId"));

            Map<String, Object> parameters = new HashMap<>();
            for (Object paramObj: templatedRoute.getJsonArray("parameters").getList()) {
                try {
                    Map<String, Object> param = (Map<String, Object>) paramObj;
                    parameters.put(param.get("name").toString(), param.get("value"));
                } catch (Exception ignored) {}
            }
            complexity.setParameters(parameters);
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return complexity;
    }

    private ComplexityRoute getStepsComplexity(ComplexityRoute complexity, JsonArray steps) {
        try {
            for (Object stepObject : steps) {
                var obj = (JsonObject) stepObject;

                if (obj.isEmpty()) {
                    continue;
                }

                var stepName = obj.getMap().keySet().iterator().next();
                Object rawValue = obj.getValue(stepName);
                if (!(rawValue instanceof JsonObject step)) {
                    continue; // Skip this step, as it's a String (or another type)
                }
                // Safe to cast now (line 414 equivalent)
                if (stepName.equals("poll") || stepName.equals("pollEnrich")) {
                    var id = step.getString("id");
                    var uri = step.getString("uri");
                    var parameters = componentService.getComponentDefaultParameters(uri);
                    var params = step.containsKey("parameters") ? step.getJsonObject("parameters") : JsonObject.of();
                    for (String key: params.fieldNames()) {
                        parameters.put(key, params.getString(key));
                    }
                    complexity.addConsumer(new ComplexityComponent(id, uri, componentService.isComponentRemote(uri), parameters));
                    if (uri != null && uri.startsWith("kamelet:")) {
                        complexity.addKamelet(uri);
                    } else if (uri != null && (uri.startsWith("direct") || uri.startsWith("seda") || uri.startsWith("vertx"))) {
                        complexity.addComponentInt(uri);
                    } else if (uri != null) {
                        complexity.addComponentExt(uri);
                    }
                    complexity.addProcessor(stepName);
                } else if (stepName.equals("to")) {
                    var id = step.getString("id");
                    var uri = step.getString("uri");
                    var parameters = componentService.getComponentDefaultParameters(uri);
                    var params = step.containsKey("parameters") ? step.getJsonObject("parameters") : JsonObject.of();
                    for (String key: params.fieldNames()) {
                        parameters.put(key, params.getString(key));
                    }
                    complexity.addProducer(new ComplexityComponent(id, uri, componentService.isComponentRemote(uri), parameters));
                    if (uri != null && uri.startsWith("kamelet:")) {
                        complexity.addKamelet(uri);
                    } else if (uri != null && (uri.startsWith("direct") || uri.startsWith("seda") || uri.startsWith("vertx"))) {
                        complexity.addComponentInt(uri);
                    } else if (uri != null) {
                        complexity.addComponentExt(uri);
                    }
                    complexity.addProcessor(stepName);
                } else {
                    complexity.addProcessor(stepName);

                    var subSteps = step.getJsonArray("steps");
                    if (subSteps != null) {
                        complexity = getStepsComplexity(complexity, subSteps);
                    }
                    var when = step.getJsonArray("when");
                    if (when != null) {
                        for (Object w : when) {
                            var stepsW = ((JsonObject) w).getJsonArray("steps");
                            if (stepsW != null) {
                                complexity =  getStepsComplexity(complexity, stepsW);
                            }
                        }
                    }
                    var otherwise = step.getJsonObject("otherwise");
                    if (otherwise != null) {
                        var otherwiseSteps = otherwise.getJsonArray("steps");
                        if (otherwiseSteps != null) {
                            complexity =  getStepsComplexity(complexity, otherwiseSteps);
                        }
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error(e);
            e.printStackTrace();
        }
        return complexity;
    }
}