package org.apache.camel.karavan.complexity;

import java.util.HashMap;
import java.util.Map;

public class ComplexityFile {

    public enum Type {camel, java, docker, kubernetes, properties, other}

    private String fileName;
    private String error;
    private Type type;
    private Integer chars = 0;
    private Integer routes = 0;
    private Integer beans = 0;
    private Integer rests = 0;
    private Complexity complexity = Complexity.easy;
    private Complexity complexityLines = Complexity.easy;
    private Complexity complexityRoutes = Complexity.easy;
    private Complexity complexityRests = Complexity.easy;
    private Complexity complexityBeans = Complexity.easy;
    private Complexity complexityProcessors = Complexity.easy;
    private Complexity complexityComponentsInt = Complexity.easy;
    private Complexity complexityComponentsExt = Complexity.easy;
    private Complexity complexityKamelets = Complexity.easy;
    private Map<String, Integer> processors = new HashMap<>();
    private Map<String, Integer> componentsInt = new HashMap<>();
    private Map<String, Integer> componentsExt = new HashMap<>();
    private Map<String, Integer> kamelets = new HashMap<>();

    public ComplexityFile() {
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Integer getChars() {
        return chars;
    }

    public void setChars(Integer chars) {
        this.chars = chars;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public Integer getRoutes() {
        return routes;
    }

    public void setRoutes(Integer routes) {
        this.routes = routes;
    }

    public Integer getBeans() {
        return beans;
    }

    public void setBeans(Integer beans) {
        this.beans = beans;
    }

    public Integer getRests() {
        return rests;
    }

    public void setRests(Integer rests) {
        this.rests = rests;
    }

    public Complexity getComplexity() {
        return complexity;
    }

    public void setComplexity(Complexity complexity) {
        this.complexity = complexity;
    }

    public Complexity getComplexityLines() {
        return complexityLines;
    }

    public void setComplexityLines(Complexity complexityLines) {
        this.complexityLines = complexityLines;
    }

    public Complexity getComplexityRoutes() {
        return complexityRoutes;
    }

    public void setComplexityRoutes(Complexity complexityRoutes) {
        this.complexityRoutes = complexityRoutes;
    }

    public Complexity getComplexityRests() {
        return complexityRests;
    }

    public void setComplexityRests(Complexity complexityRests) {
        this.complexityRests = complexityRests;
    }

    public Complexity getComplexityBeans() {
        return complexityBeans;
    }

    public void setComplexityBeans(Complexity complexityBeans) {
        this.complexityBeans = complexityBeans;
    }

    public Complexity getComplexityProcessors() {
        return complexityProcessors;
    }

    public void setComplexityProcessors(Complexity complexityProcessors) {
        this.complexityProcessors = complexityProcessors;
    }

    public Complexity getComplexityComponentsInt() {
        return complexityComponentsInt;
    }

    public void setComplexityComponentsInt(Complexity complexityComponentsInt) {
        this.complexityComponentsInt = complexityComponentsInt;
    }

    public Complexity getComplexityComponentsExt() {
        return complexityComponentsExt;
    }

    public void setComplexityComponentsExt(Complexity complexityComponentsExt) {
        this.complexityComponentsExt = complexityComponentsExt;
    }

    public Complexity getComplexityKamelets() {
        return complexityKamelets;
    }

    public void setComplexityKamelets(Complexity complexityKamelets) {
        this.complexityKamelets = complexityKamelets;
    }

    public Map<String, Integer> getProcessors() {
        return processors;
    }

    public void setProcessors(Map<String, Integer> processors) {
        this.processors = processors;
    }

    public Map<String, Integer> getComponentsInt() {
        return componentsInt;
    }

    public void setComponentsInt(Map<String, Integer> componentsInt) {
        this.componentsInt = componentsInt;
    }

    public Map<String, Integer> getComponentsExt() {
        return componentsExt;
    }

    public void setComponentsExt(Map<String, Integer> componentsExt) {
        this.componentsExt = componentsExt;
    }

    public Map<String, Integer> getKamelets() {
        return kamelets;
    }

    public void setKamelets(Map<String, Integer> kamelets) {
        this.kamelets = kamelets;
    }

    public void addProcessor(String component, Integer count) {
        processors.put(component, processors.getOrDefault(component, 0) + count);
    }

    public void addComponentExt(String component, Integer count) {
        componentsExt.put(component, componentsExt.getOrDefault(component, 0) + count);
    }

    public void addComponentInt(String component, Integer count) {
        componentsInt.put(component, componentsInt.getOrDefault(component, 0) + count);
    }

    public void addKamelet(String component, Integer count) {
        kamelets.put(component, kamelets.getOrDefault(component, 0) + count);
    }

    @Override
    public String toString() {
        return "ComplexityFile{" +
                "fileName='" + fileName + '\'' +
                ", type=" + type +
                ", lines=" + chars +
                ", routes=" + routes +
                ", beans=" + beans +
                ", rests=" + rests +
                ", complexity=" + complexity +
                ", complexityLines=" + complexityLines +
                ", complexityRoutes=" + complexityRoutes +
                ", complexityRests=" + complexityRests +
                ", complexityBeans=" + complexityBeans +
                ", complexityProcessors=" + complexityProcessors +
                ", complexityComponentsInt=" + complexityComponentsInt +
                ", complexityComponentsExt=" + complexityComponentsExt +
                ", complexityKamelets=" + complexityKamelets +
                ", processors=" + processors +
                ", componentsInt=" + componentsInt +
                ", componentsExt=" + componentsExt +
                ", kamelets=" + kamelets +
                '}';
    }
}
