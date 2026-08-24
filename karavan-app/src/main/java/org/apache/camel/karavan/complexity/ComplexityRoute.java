package org.apache.camel.karavan.complexity;

import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ComplexityRoute {

    public enum Type {ROUTE, ROUTE_TEMPlATE, TEMPLATED_ROUTE}

    private String routeId;
    private String routeDescription;
    private String nodePrefixId;
    private String routeTemplateRef;
    private Type type;
    private String fileName;
    private List<ComplexityComponent> consumers = new ArrayList<>();
    private List<ComplexityComponent> producers = new ArrayList<>();
    private Map<String, Integer> processors = new HashMap<>();
    private Map<String, Integer> componentsInt = new HashMap<>();
    private Map<String, Integer> componentsExt = new HashMap<>();
    private Map<String, Integer> kamelets = new HashMap<>();
    private Map<String, Object> parameters = new HashMap<>();

    public ComplexityRoute() {
    }

    public ComplexityRoute(String routeId, String routeDescription, String nodePrefixId, String routeTemplateRef, Type type, String fileName, List<ComplexityComponent> consumers, List<ComplexityComponent> producers, Map<String, Integer> processors, Map<String, Integer> componentsInt, Map<String, Integer> componentsExt, Map<String, Integer> kamelets, Map<String, Object> parameters) {
        this.routeId = routeId;
        this.routeDescription = routeDescription;
        this.nodePrefixId = nodePrefixId;
        this.routeTemplateRef = routeTemplateRef;
        this.type = type;
        this.fileName = fileName;
        this.consumers = consumers;
        this.producers = producers;
        this.processors = processors;
        this.componentsInt = componentsInt;
        this.componentsExt = componentsExt;
        this.kamelets = kamelets;
        this.parameters = parameters;
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

    public String getRouteTemplateRef() {
        return routeTemplateRef;
    }

    public void setRouteTemplateRef(String routeTemplateRef) {
        this.routeTemplateRef = routeTemplateRef;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public String getRouteDescription() {
        return routeDescription;
    }

    public void setRouteDescription(String routeDescription) {
        this.routeDescription = routeDescription;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public ComplexityRoute copy() {
        var json = JsonObject.mapFrom(this).encode();
        return new JsonObject(json).mapTo(ComplexityRoute.class);
    }
}
