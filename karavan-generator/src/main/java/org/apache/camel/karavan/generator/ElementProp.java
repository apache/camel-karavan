package org.apache.camel.karavan.generator;

public class ElementProp {
    final String name;
    final String type;
    final boolean isObject;
    final boolean isArray;
    final boolean isArrayTypeClass;
    final String arrayType;
    final boolean isProcessor;
    final String typeCode;

    public ElementProp(String name, String type, boolean isObject, boolean isArray, boolean isArrayTypeClass, String arrayType, boolean isProcessor, String typeCode) {
        this.name = name;
        this.type = type;
        this.isObject = isObject;
        this.isArray = isArray;
        this.isArrayTypeClass = isArrayTypeClass;
        this.arrayType = arrayType;
        this.isProcessor = isProcessor;
        this.typeCode = typeCode;
    }
}
