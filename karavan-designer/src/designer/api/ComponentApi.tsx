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
import {Component, ComponentProperty} from "../model/ComponentModels";
import {Kamelet, Property} from "../model/KameletModels";

export const Components: Component[] = [];

export const ComponentApi = {

    jsonToComponent: (json: string) => {
        const fromJson: Component = JSON.parse(json) as Component;
        const k: Component = new Component(fromJson);
        return k;
    },

    saveComponents: (jsons: string[]) => {
        const components: Component[] = jsons.map(json => ComponentApi.jsonToComponent(json));
        Components.push(...components);
    },

    saveComponent: (json: string) => {
        const component: Component = ComponentApi.jsonToComponent(json);
        Components.push(component);
    },

    getComponents: (): Component[] => {
        return Components.sort((a, b) => {
            if (a.component.name < b.component.name) {
                return -1;
            }
            return a.component.name > b.component.name ? 1 : 0;
        });
    },

    findByName: (name: string): Component | undefined => {
        return Components.find((c: Component) => c.component.name === name);
    },

    getComponentNameFromUri: (uri: string): string | undefined => {
        return uri.split(":")[0];
    },

    getPathParameterValue: (uri: string, pathParameter: string): string | undefined => {
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name){
            const component = ComponentApi.findByName(name);
            const syntax = component?.component.syntax;
            const index = syntax?.split(":").findIndex(s => s === pathParameter);
            const uriParts = uri.split(":");
            return index && uriParts.length > index ? uriParts[index] : undefined;
        }
        return undefined;
    },

    buildComponentUri: (uri: string, pathParameter: string, pathParameterValue: string): string | undefined => {
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name){
            const component = ComponentApi.findByName(name);
            const syntax = component?.component.syntax;
            const uriParts = uri.split(":");
            const result:string[] = [];
            syntax?.split(":").forEach((value, index, array) => {
                if (value === pathParameter) result.push(pathParameterValue)
                else if (uriParts.length > index) result.push(uriParts[index])
                else result.push("")
            });
            return result.join(":");
        }
        return uri;
    },

    getComponentProperties: (componentName: string, type: 'consumer' | 'producer', advanced: boolean): ComponentProperty[] => {
        const component: Component | undefined = ComponentApi.findByName(componentName);
        const properties: ComponentProperty[] = [];
        try {
            if (component !== undefined) {
                const map: Map<string, any> = component.properties ? new Map(Object.entries(component.properties)) : new Map();
                map.forEach((value, key, map) => {
                    const prop = new ComponentProperty();
                    prop.name = key;
                    prop.label = value.label;
                    prop.description = value.description;
                    prop.type = value.type;
                    prop.displayName = value.displayName;
                    prop.group = value.group;
                    prop.type = value.type;
                    prop.deprecated = value.deprecated;
                    prop.secret = value.secret;
                    prop.enum = value.enum;
                    prop.kind = value.kind;
                    if (value.defaultValue) prop.defaultValue = value.defaultValue
                    if (!value.deprecated && value.type !== 'object') properties.push(prop);
                })
            }
        } finally {
            const result: ComponentProperty[] = [];
            if (!advanced) {
                result.push(...properties.filter(p => p.label.length === 0));
                result.push(...properties.filter(p => p.label.startsWith(type) && !p.label.includes("advanced")));
            } else {
                result.push(...properties.filter(p => p.label.startsWith(type) && p.label.includes("advanced")));
                result.push(...properties.filter(p => p.label === "advanced"));
            }
            return result;
        }
    },
}