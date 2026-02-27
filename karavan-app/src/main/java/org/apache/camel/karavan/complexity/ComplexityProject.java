package org.apache.camel.karavan.complexity;

import java.util.ArrayList;
import java.util.List;

public class ComplexityProject {

    private String projectId;
    private String type;
    private Long lastUpdateDate = 0L;
    private Complexity complexityRoute = Complexity.easy;
    private Complexity complexityRest = Complexity.easy;
    private Complexity complexityJava = Complexity.easy;
    private Complexity complexityFiles = Complexity.easy;
    private List<ComplexityFile> files = new ArrayList<>();
    private List<ComplexityRoute> routes = new ArrayList<>();
    private Integer rests = 0;
    private boolean exposesOpenApi = false;
    private List<String> dependencies = new ArrayList<>();


    public ComplexityProject() {
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Long getLastUpdateDate() {
        return lastUpdateDate;
    }

    public void setLastUpdateDate(Long lastUpdateDate) {
        this.lastUpdateDate = lastUpdateDate;
    }

    public Complexity getComplexityRoute() {
        return complexityRoute;
    }

    public void setComplexityRoute(Complexity complexityRoute) {
        this.complexityRoute = complexityRoute;
    }

    public Complexity getComplexityRest() {
        return complexityRest;
    }

    public void setComplexityRest(Complexity complexityRest) {
        this.complexityRest = complexityRest;
    }

    public Complexity getComplexityJava() {
        return complexityJava;
    }

    public void setComplexityJava(Complexity complexityJava) {
        this.complexityJava = complexityJava;
    }

    public Complexity getComplexityFiles() {
        return complexityFiles;
    }

    public void setComplexityFiles(Complexity complexityFiles) {
        this.complexityFiles = complexityFiles;
    }

    public List<ComplexityFile> getFiles() {
        return files;
    }

    public void setFiles(List<ComplexityFile> files) {
        this.files = files;
    }

    public void addFile(ComplexityFile file) {
        this.files.add(file);
    }

    public List<ComplexityRoute> getRoutes() {
        return routes;
    }

    public void setRoutes(List<ComplexityRoute> routes) {
        this.routes = routes;
    }

    public Integer getRests() {
        return rests;
    }

    public void setRests(Integer rests) {
        this.rests = rests;
    }

    public List<String> getDependencies() {
        return dependencies;
    }

    public void setDependencies(List<String> dependencies) {
        this.dependencies = dependencies;
    }

    public boolean isExposesOpenApi() {
        return exposesOpenApi;
    }

    public void setExposesOpenApi(boolean exposesOpenApi) {
        this.exposesOpenApi = exposesOpenApi;
    }

    @Override
    public String toString() {
        return "ComplexityProject{" +
                "projectId='" + projectId + '\'' +
                ", lastUpdateDate=" + lastUpdateDate +
                ", complexityRoute=" + complexityRoute +
                ", complexityRest=" + complexityRest +
                ", complexityJava=" + complexityJava +
                ", complexityFiles=" + complexityFiles +
                ", files=" + files +
                ", routes=" + routes +
                ", rests=" + rests +
                ", dependencies=" + dependencies +
                '}';
    }

}
