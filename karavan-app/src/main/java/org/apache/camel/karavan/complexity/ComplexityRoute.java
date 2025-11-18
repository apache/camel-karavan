package org.apache.camel.karavan.complexity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ComplexityRoute {

    private String routeId;
    private String nodePrefixId;
    private String fileName;
    private Complexity complexityProcessors = Complexity.easy;
    private Complexity complexityComponentsInt = Complexity.easy;
    private Complexity complexityComponentsExt = Complexity.easy;
    private Complexity complexityKamelets = Complexity.easy;
    private List<ComplexityComponent> consumers = new ArrayList<>();
    private List<ComplexityComponent> producers = new ArrayList<>();
    private Map<String, Integer> processors = new HashMap<>();
    private Map<String, Integer> componentsInt = new HashMap<>();
    private Map<String, Integer> componentsExt = new HashMap<>();
    private Map<String, Integer> kamelets = new HashMap<>();

    public ComplexityRoute() {
    }

    public String getNodePrefixId() {
        return nodePrefixId;
    }

    public void setNodePrefixId(String nodePrefixId) {
        this.nodePrefixId = nodePrefixId;
    }

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
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

    public void addProcessor(String component) {
        processors.put(component, processors.getOrDefault(component, 0) + 1);
    }

    public void addComponentInt(String component) {
        componentsInt.put(component, componentsInt.getOrDefault(component, 0) + 1);
    }

    public void addComponentExt(String component) {
        componentsExt.put(component, componentsExt.getOrDefault(component, 0) + 1);
    }

    public void addKamelet(String component) {
        kamelets.put(component, kamelets.getOrDefault(component, 0) + 1);
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

    public List<ComplexityComponent> getConsumers() {
        return consumers;
    }

    public void setConsumers(List<ComplexityComponent> consumers) {
        this.consumers = consumers;
    }

    public List<ComplexityComponent> getProducers() {
        return producers;
    }

    public void setProducers(List<ComplexityComponent> producers) {
        this.producers = producers;
    }

    public void addProducer(ComplexityComponent producer) {
        this.producers.add(producer);
    }
    public void addConsumer(ComplexityComponent producer) {
        this.consumers.add(producer);
    }
}
