package org.apache.camel.karavan.complexity;

import java.util.HashMap;
import java.util.Map;

public class ComplexityFile {

    public enum Type {camel, java, docker, kubernetes, properties, other, openapi}

    private String fileName;
    private String error;
    private Type type;
    private Integer chars = 0;
    private Integer routes = 0;
    private Integer beans = 0;
    private Integer rests = 0;
    private boolean isGenerated = false;
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

    public boolean isGenerated() {
        return isGenerated;
    }

    public void setGenerated(boolean generated) {
        isGenerated = generated;
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
                ", processors=" + processors +
                ", componentsInt=" + componentsInt +
                ", componentsExt=" + componentsExt +
                ", kamelets=" + kamelets +
                '}';
    }
}
