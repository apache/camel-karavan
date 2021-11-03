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

    @Override
    public String toString() {
        return "ElementProp{" +
                "name='" + name + '\'' +
                ", type='" + type + '\'' +
                ", isObject=" + isObject +
                ", isArray=" + isArray +
                ", isArrayTypeClass=" + isArrayTypeClass +
                ", arrayType='" + arrayType + '\'' +
                ", isProcessor=" + isProcessor +
                ", typeCode='" + typeCode + '\'' +
                '}';
    }
}
