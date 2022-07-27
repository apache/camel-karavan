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

export const Components: Component[] = [];

export const ComponentApi = {

    jsonToComponent: (json: string) => {
        const fromJson: Component = JSON.parse(json) as Component;
        const k: Component = new Component(fromJson);
        return k;
    },

    saveComponents: (jsons: string[], clean: boolean = false) => {
        if (clean) Components.length = 0;
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

    getComponentTitleFromUri: (uri: string): string | undefined => {
        const componentName = uri.split(":")[0];
        const title = ComponentApi.findByName(componentName)?.component.title;
        return title ? title : componentName;
    },

    getComponentDescriptionFromUri: (uri: string): string | undefined => {
        const componentName = uri.split(":")[0];
        const description = ComponentApi.findByName(componentName)?.component.description;
        return description ? description : componentName;
    },

    getUriParts: (uri: string): Map<string, string> => {
        const result: Map<string, string> = new Map<string, string>();
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name) {
            const component = ComponentApi.findByName(name);
            const syntax = component?.component.syntax;
            const syntaxParts = ComponentApi.parseSyntax(syntax + '');
            const syntaxSeparators = ComponentApi.getSyntaxSeparators(syntax + '');
            let newUri = uri === name ? name + syntaxSeparators.join('') : uri;
            result.set(name, name);
            if (name === 'salesforce') { // workaround for salesforce component
                const parts = newUri.split(":");
                if (parts.length === 2) result.set("operationName", parts.at(1) || '').set("topicName", '')
                else if (parts.length === 3) result.set("operationName", parts.at(1) || '').set("topicName", parts.at(2) || '')
            } else if (name === 'cxf') { // workaround for CXF component
                const cxfParts = newUri.split(":");
                const firstPart = cxfParts.at(1);
                const secondPart = cxfParts.at(2);
                if (cxfParts.length === 3 && firstPart === 'bean' && secondPart) result.set("beanId", firstPart + ":" + secondPart);
                if (cxfParts.length === 2 && firstPart?.startsWith("//")) result.set("address", firstPart);
            } else if (name === 'jt400') { // workaround for JT400 component
                const jt400Parts = newUri.split(".").join(':').split('/').join(':').split('@').join(':').split(':')
                const userID = jt400Parts.at(1) || '';
                const password = jt400Parts.at(2) || '';
                const systemName = jt400Parts.at(3) || '';
                const objectPath = jt400Parts.at(4) || '';
                const type = jt400Parts.at(5) || '';
                result.set("userID", userID);
                result.set("password", password);
                result.set("systemName", systemName);
                result.set("objectPath", objectPath);
                result.set("type", type);
            } else { // workarounds end
                syntaxParts.filter((x, i) => i > 0).forEach((part, index) => {
                    if (index < syntaxParts.length - 1) {
                        const startSeparator = syntaxSeparators[index];
                        const endSeparator = syntaxSeparators[index + 1];
                        const start = newUri.indexOf(startSeparator) + startSeparator.length;
                        const end = endSeparator ? newUri.indexOf(endSeparator, start) : newUri.length;
                        const val = newUri.substr(start, end - start);
                        result.set(part, val);
                        newUri = newUri.substr(end);
                    }
                })
            }
        }
        return result;
    },

    parseSyntax: (syntax: string): string[] => {
        const separators: string[] = ['://', '//', ':', '/', '#']
        let simplifiedSyntax = '' + syntax;
        separators.forEach(s => {
            simplifiedSyntax = simplifiedSyntax?.replaceAll(s, ":");
        });
        return simplifiedSyntax.split(":");
    },

    getSyntaxSeparators: (syntax: string): string[] => {
        const result: string[] = [];
        const parts: string[] = ComponentApi.parseSyntax(syntax);
        let str = '';
        parts.forEach((part, index) => {
            if (index < parts.length - 1) {
                const start = syntax.indexOf(part, str.length) + part.length;
                const end = syntax.indexOf(parts[index + 1], start);
                const separator = syntax.substr(start, end - start);
                result.push(separator);
                str = str + part + separator;
            }
        })
        return result;
    },

    parseUri: (uri?: string): string[] => {
        const separators: string[] = ['://', '//', ':', '/', '#']
        let simplifiedUri = '' + uri;
        separators.forEach(s => {
            simplifiedUri = simplifiedUri?.replaceAll(s, ":");
        });
        return simplifiedUri.split(":");
    },

    getUriSeparators: (uri: string): string[] => {
        const result: string[] = [];
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name) {
            const component = ComponentApi.findByName(name);
            const syntax = '' + component?.component.syntax;
            const parts: string[] = Array.from(ComponentApi.getUriParts(uri).keys());
            let str = '';
            parts.forEach((part, index) => {
                if (index < parts.length - 1) {
                    const start = syntax.indexOf(part, str.length) + part.length;
                    const end = syntax.indexOf(parts[index + 1], start);
                    const separator = syntax.substr(start, end - start);
                    result.push(separator);
                    str = str + part + separator;
                }
            })
        }
        return result;
    },

    getPathParameterValue: (uri: string, pathParameter: string): string | undefined => {
        return ComponentApi.getUriParts(uri).get(pathParameter);
    },

    buildComponentUri: (uri: string, pathParameter: string, pathParameterValue: string): string | undefined => {
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name) {
            if (name === 'cxf') { // workaround for CXF component start
                if (pathParameter === 'beanId' && pathParameterValue && pathParameterValue.trim().length > 0) return "cxf:" + pathParameterValue;
                if (pathParameter === 'address' && pathParameterValue && pathParameterValue.trim().length > 0) return "cxf:" + pathParameterValue;
            } else { // workarounds end
                const map = ComponentApi.getUriParts(uri);
                map.set(pathParameter, pathParameterValue);
                const separators = ComponentApi.getUriSeparators(uri);
                const result: string[] = [];
                Array.from(map.keys()).forEach((key, index) => {
                    const val = map.get(key) || '';
                    const separator = separators[index];
                    result.push(val);
                    if (separator) result.push(separators[index]);
                });
                if (result.at(result.length -1) === '') return result.slice(0, -2).join(''); // remove last colon
                return result.join('');
            }
        }
        return uri;
    },

    getComponentProperties: (componentName: string, type: 'consumer' | 'producer'): ComponentProperty[] => {
        const invertedType = type === 'consumer' ? 'producer' : 'consumer';
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
                    prop.required = value.required;
                    if (value.defaultValue) prop.defaultValue = value.defaultValue
                    if (!value.deprecated) properties.push(prop);
                })
            }
        } finally {
            const result: ComponentProperty[] = [];
            result.push(...properties.filter(p => p.kind === 'path'));
            result.push(...properties.filter(p => p.kind !== 'path' && p.required));
            result.push(...properties.filter(p => p.label.length === 0 && p.kind !== 'path' && !p.required));
            result.push(...properties.filter(p => !p.label.includes(invertedType) && !p.label.includes("advanced") && !p.required));
            result.push(...properties.filter(p => p.label === "formatting" && !p.required));
            result.push(...properties.filter(p => !p.label.includes(invertedType) &&
                (p.label.includes("scheduler") || p.label.includes("security") || p.label.includes("advanced"))
            ));
            result.push(...properties.filter(p => !p.label.includes(invertedType) &&
                (p.label.includes("scheduler") || p.label.includes("security") || p.label.includes("advanced"))
            ));
            return Array.from(new Map(result.map(item => [item.name, item])).values());
        }
    }
}