package org.apache.camel.karavan.service;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.complexity.*;
import org.jboss.logging.Logger;
import org.yaml.snakeyaml.Yaml;

import java.util.*;

import static org.apache.camel.karavan.service.CodeService.APPLICATION_PROPERTIES_FILENAME;
import static org.apache.camel.karavan.service.CodeService.CAMEL_YAML_EXTENSION;

@ApplicationScoped
public class ComplexityService {

    private static final Logger LOGGER = Logger.getLogger(ComplexityService.class.getName());
    private static final int LIMIT_COMPLEX_ROUTES = 20;
    private static final int LIMIT_NORMAL_ROUTES = 10;
    private static final int LIMIT_COMPLEX_ROUTES_PER_FILE = 2;
    private static final int LIMIT_NORMAL_ROUTES_PER_FILE = 1;
    private static final int LIMIT_COMPLEX_PROCESSORS = 20;
    private static final int LIMIT_NORMAL_PROCESSORS = 10;
    private static final int LIMIT_COMPLEX_COMPONENTS_INT = 20;
    private static final int LIMIT_NORMAL_COMPONENTS_INT = 10;
    private static final int LIMIT_COMPLEX_COMPONENTS_EXT = 10;
    private static final int LIMIT_NORMAL_COMPONENTS_EXT = 5;
    private static final int LIMIT_COMPLEX_KAMELETS = 10;
    private static final int LIMIT_NORMAL_KAMELETS = 5;
    private static final int LIMIT_COMPLEX_RESTS = 20;
    private static final int LIMIT_NORMAL_RESTS = 10;
    private static final int LIMIT_COMPLEX_BEANS = 10;
    private static final int LIMIT_NORMAL_BEANS = 5;
    private static final int LIMIT_COMPLEX_FILES = 20;
    private static final int LIMIT_NORMAL_FILES = 10;
    private static final int LIMIT_COMPLEX_FILE_LENGTH = 5000;
    private static final int LIMIT_NORMAL_FILE_LENGTH = 2000;

    @Inject
    KaravanCache karavanCache;

    @Inject
    CodeService codeService;

    private static JsonArray components;
    private JsonArray getComponents() {
        if (components == null) {
            var json = codeService.getResourceFile("/metadata/components.json");
            components = new JsonArray(json);
        }
        return components;
    }

    private Map<String,String> getComponentDefaultParameters(String name) {
        Map<String,String> result = new HashMap<>();
        try {
            var comps = getComponents();
            var comp = comps.stream().filter(o -> ((JsonObject)o).getJsonObject("component").getString("name").equals(name)).findFirst().orElse(JsonObject.of());
            if (comp instanceof JsonObject) {
                var properties = ((JsonObject) comp).getJsonObject("properties");
                if (properties != null) {
                    for (String key: properties.fieldNames()){
                        var prop = properties.getJsonObject(key);
                        if (Objects.equals(prop.getString("kind"), "path") || Objects.equals(prop.getBoolean("required"), true)) {
                            result.put(key, prop.getString("defaultValue"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

    public List<ComplexityProject> getProjectComplexities() {
        return karavanCache.getFolders().stream()
                .filter(p -> Objects.equals(p.getType(), ProjectFolder.Type.integration))
                .map(project -> getProjectComplexity(project.getProjectId())).toList();
    }

    public ComplexityProject getProjectComplexity(String projectId) {
        ComplexityProject complexityProject = new ComplexityProject();
        complexityProject.setProjectId(projectId);
        try {
            complexityProject.setLastUpdateDate(karavanCache.getProjectFiles(projectId).stream().mapToLong(ProjectFile::getLastUpdate).max().orElse(0));
            List<ProjectFile> files = karavanCache.getProjectFiles(projectId);
            List<ComplexityRoute> routes = new ArrayList<>();
            for (ProjectFile file : files) {
                ComplexityFile complexityFile = new ComplexityFile();
                try {
                    complexityFile.setFileName(file.getName());
                    complexityFile.setChars(Long.valueOf(file.getCode().length()).intValue());

                    if (file.getName().endsWith(CAMEL_YAML_EXTENSION)) {
                        complexityFile.setType(ComplexityFile.Type.camel);
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
                    } else {
                        complexityFile.setType(ComplexityFile.Type.other);
                    }
                    complexityProject.addFile(calculateComplexity(complexityFile));
                } catch (Exception e) {
                    complexityFile.setError(e.getMessage());
                    complexityProject.addFile(complexityFile);
                }
            }
            complexityProject.setRoutes(routes);
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return calculateComplexity(complexityProject);
    }

    public ComplexityFile calculateComplexity(ComplexityFile f) {
        int processors = f.getProcessors().values().stream().mapToInt(Integer::intValue).sum();
        int kamelets = f.getKamelets().values().stream().mapToInt(Integer::intValue).sum();
        int componentsExt = f.getComponentsExt().values().stream().mapToInt(Integer::intValue).sum();
        int componentsInt = f.getComponentsInt().values().stream().mapToInt(Integer::intValue).sum();
        if (processors > LIMIT_COMPLEX_PROCESSORS) {
            f.setComplexityProcessors(Complexity.complex);
        } else if (processors > LIMIT_NORMAL_PROCESSORS) {
            f.setComplexityProcessors(Complexity.normal);
        }
        if (f.getRests() > LIMIT_COMPLEX_RESTS) {
            f.setComplexityRests(Complexity.complex);
        } else if (f.getRests() > LIMIT_NORMAL_RESTS) {
            f.setComplexityRests(Complexity.normal);
        }
        if (f.getBeans() > LIMIT_COMPLEX_BEANS) {
            f.setComplexityBeans(Complexity.complex);
        } else if (f.getBeans() > LIMIT_NORMAL_BEANS) {
            f.setComplexityBeans(Complexity.normal);
        }
        if (kamelets > LIMIT_COMPLEX_KAMELETS) {
            f.setComplexityKamelets(Complexity.complex);
        } else if (kamelets > LIMIT_NORMAL_KAMELETS) {
            f.setComplexityKamelets(Complexity.normal);
        }
        if (componentsExt > LIMIT_COMPLEX_COMPONENTS_EXT) {
            f.setComplexityComponentsExt(Complexity.complex);
        } else if (componentsExt > LIMIT_NORMAL_COMPONENTS_EXT) {
            f.setComplexityComponentsExt(Complexity.normal);
        }
        if (componentsInt > LIMIT_COMPLEX_COMPONENTS_INT) {
            f.setComplexityComponentsInt(Complexity.complex);
        } else if (componentsInt > LIMIT_NORMAL_COMPONENTS_INT) {
            f.setComplexityComponentsInt(Complexity.normal);
        }
        if (f.getChars() > LIMIT_COMPLEX_FILE_LENGTH) {
            f.setComplexityLines(Complexity.complex);
        } else if (f.getChars() > LIMIT_NORMAL_FILE_LENGTH) {
            f.setComplexityLines(Complexity.normal);
        }

        if (f.getRoutes() > LIMIT_COMPLEX_ROUTES_PER_FILE) {
            f.setComplexityRoutes(Complexity.complex);
        } else if (f.getRoutes() > LIMIT_NORMAL_ROUTES_PER_FILE) {
            f.setComplexityRoutes(Complexity.normal);
        }

        if (f.getComplexityLines().equals(Complexity.complex)
                || f.getComplexityRoutes().equals(Complexity.complex)
                || f.getComplexityRests().equals(Complexity.complex)
                || f.getComplexityBeans().equals(Complexity.complex)
                || f.getComplexityComponentsExt().equals(Complexity.complex)
                || f.getComplexityComponentsInt().equals(Complexity.complex)
                || f.getComplexityKamelets().equals(Complexity.complex)
                || f.getComplexityProcessors().equals(Complexity.complex) ) {
            f.setComplexity(Complexity.complex);
        } else if (f.getComplexityLines().equals(Complexity.normal)
                || f.getComplexityRoutes().equals(Complexity.normal)
                || f.getComplexityRests().equals(Complexity.normal)
                || f.getComplexityBeans().equals(Complexity.normal)
                || f.getComplexityComponentsExt().equals(Complexity.normal)
                || f.getComplexityComponentsInt().equals(Complexity.normal)
                || f.getComplexityKamelets().equals(Complexity.normal)
                || f.getComplexityProcessors().equals(Complexity.normal) ) {
            f.setComplexity(Complexity.normal);
        }

        return f;
    }

    public ComplexityProject calculateComplexity(ComplexityProject p) {
        if (p.getRoutes().size() > LIMIT_COMPLEX_ROUTES) {
            p.setComplexityRoute(Complexity.complex);
        } else if (p.getFiles().stream().anyMatch(f -> f.getComplexityRoutes() == Complexity.complex)) {
            p.setComplexityRoute(Complexity.complex);
        } else if (p.getRoutes().size() > LIMIT_NORMAL_ROUTES) {
            p.setComplexityRoute(Complexity.normal);
        } else if (p.getFiles().stream().anyMatch(f -> f.getComplexityRoutes() == Complexity.normal)) {
            p.setComplexityRoute(Complexity.normal);
        }

        if (p.getFiles().size() > LIMIT_COMPLEX_FILES) {
            p.setComplexityFiles(Complexity.complex);
        } else if (p.getFiles().size() > LIMIT_NORMAL_FILES) {
            p.setComplexityFiles(Complexity.normal);
        }

        if (p.getFiles().stream().anyMatch(f -> f.getComplexityRests() == Complexity.complex)) {
            p.setComplexityRest(Complexity.complex);
        } else if (p.getFiles().stream().anyMatch(f -> f.getComplexityRests() == Complexity.normal)) {
            p.setComplexityRest(Complexity.normal);
        }

        if (p.getFiles().stream().anyMatch(f -> f.getFileName().endsWith(".java") && f.getComplexityLines() == Complexity.complex)) {
            p.setComplexityJava(Complexity.complex);
        } else if (p.getFiles().stream().anyMatch(f -> f.getFileName().endsWith(".java") && f.getComplexityLines() == Complexity.normal)) {
            p.setComplexityJava(Complexity.normal);
        }

        p.setRests(p.getFiles().stream().map(ComplexityFile::getRests).mapToInt(Integer::intValue).sum());

        return p;
    }

    public List<String> getDependencies(String code) {
        List<String> result = new ArrayList<>();
        var value = codeService.getPropertyValue(code, "camel.jbang.dependencies");
        result.addAll(Arrays.stream(value.split(",")).map(String::trim).toList());
        return result;
    }

    public Integer getFileRoutesCount(String code) {
        int result = 0;
        Yaml yaml = new Yaml();
        List<Object> obj = yaml.load(code);
        JsonArray json = JsonArray.of(obj);
        for (Object list : json) {
            if (list instanceof JsonArray l) {
                for (Object obj1 : l) {
                    var element = (JsonObject) obj1;
                    if (element.containsKey("route")) {
                        result++;
                    }
                }
            }
        }
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
        Yaml yaml = new Yaml();
        List<Object> obj = yaml.load(code);
        JsonArray json = JsonArray.of(obj);
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
                        result.add(getRouteComplexity(r, fileName));
                    }
                }
            }
        }
        return result;
    }

    private ComplexityRoute getRouteComplexity(JsonObject route, String fileName) {
        ComplexityRoute complexity = new ComplexityRoute();
        complexity.setFileName(fileName);
        try {
            complexity.setRouteId(route.getString("id"));
            complexity.setNodePrefixId(route.getString("nodePrefixId"));
            var from = route.getJsonObject("from");
            var id = from.getString("id");
            var fromUri = from.getString("uri");
            var parameters = getComponentDefaultParameters(fromUri);
            var params = from.containsKey("parameters") ? from.getJsonObject("parameters") : JsonObject.of();
            for (String key: params.fieldNames()) {
                parameters.put(key, params.getString(key));
            }
            complexity.addConsumer(new ComplexityComponent(id, fromUri, parameters));
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
        }
        return complexity;
    }

    private ComplexityRoute getStepsComplexity(ComplexityRoute complexity, JsonArray steps) {
        try {
            for (Object stepObject : steps) {
                var obj = (JsonObject) stepObject;
                var stepName = obj.getMap().keySet().toArray()[0].toString();
                var step = obj.getJsonObject(stepName);
                if (stepName.equals("poll") || stepName.equals("pollEnrich")) {
                    var id = step.getString("id");
                    var uri = step.getString("uri");
                    var parameters = getComponentDefaultParameters(uri);
                    var params = step.containsKey("parameters") ? step.getJsonObject("parameters") : JsonObject.of();
                    for (String key: params.fieldNames()) {
                        parameters.put(key, params.getString(key));
                    }
                    complexity.addConsumer(new ComplexityComponent(id, uri, parameters));
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
                    var parameters = getComponentDefaultParameters(uri);
                    var params = step.containsKey("parameters") ? step.getJsonObject("parameters") : JsonObject.of();
                    for (String key: params.fieldNames()) {
                        parameters.put(key, params.getString(key));
                    }
                    complexity.addProducer(new ComplexityComponent(id, uri, parameters));
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
        }
        return complexity;
    }
}