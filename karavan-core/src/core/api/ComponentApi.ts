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
import {CamelMetadataApi} from "../model/CamelMetadata";

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

    getComponentTitleFromUri: (uri: string): string | undefined => {
        const componentName =  uri.split(":")[0];
        const title = ComponentApi.findByName(componentName)?.component.title;
        return title ? title : componentName;
    },

    getUriParts: (uri: string): Map<string, string> => {
        const result: Map<string, string> = new Map<string, string>();
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name) {
            const component = ComponentApi.findByName(name);
            const syntax = component?.component.syntax;
            const syntaxParts = ComponentApi.parseSyntax(syntax+'');
            const syntaxSeparators = ComponentApi.getSyntaxSeparators(syntax+'');
            let newUri = uri === name ? name+syntaxSeparators.join('') : uri;
            result.set(name, name);
            syntaxParts.filter((x,i) => i > 0).forEach((part, index) => {
                if (index < syntaxParts.length -1) {
                    const startSeparator = syntaxSeparators[index];
                    const endSeparator = syntaxSeparators[index + 1];
                    const start = newUri.indexOf(startSeparator) + startSeparator.length;
                    const end = endSeparator ? newUri.indexOf(endSeparator, start) : newUri.length;
                    const val = newUri.substr(start, end-start);
                    result.set(part, val);
                    newUri = newUri.substr(end);
                }
            })
        }
        return result;
    },

    parseSyntax: (syntax: string): string[] => {
        const separators: string[] = ['://', '//', ':', '/', '#']
        let simplifiedSyntax = ''+ syntax;
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
                if (index < parts.length -1){
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
        let simplifiedUri = ''+ uri;
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
                if (index < parts.length -1){
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
            const map = ComponentApi.getUriParts(uri);
            map.set(pathParameter, pathParameterValue);
            const separators = ComponentApi.getUriSeparators(uri);
            const result: string[] = [];
            Array.from(map.keys()).forEach((key, index) => {
                const val = map.get(key);
                result.push(val ? val : '');
                result.push(separators[index]);
            });
            return result.join('');
        }
        return uri;
    },

    getComponentProperties: (componentName: string, type: 'consumer' | 'producer'): ComponentProperty[] => {
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
                    if (!value.deprecated) properties.push(prop);
                })
            }
        } finally {
            const result: ComponentProperty[] = [];
            result.push(...properties.filter(p => p.kind === 'path'));
            result.push(...properties.filter(p => p.kind !== 'path' && p.required));
            result.push(...properties.filter(p => p.label.length === 0 && p.kind !== 'path' && !p.required));
            result.push(...properties.filter(p => p.label.startsWith(type) && !p.label.includes("advanced") && !p.required));
            result.push(...properties.filter(p => p.label === "formatting" && !p.required));
            result.push(...properties.filter(p => p.label.startsWith(type) &&
                (p.label.includes("scheduler") || p.label.includes("security") || p.label.includes("advanced"))
            ));
            result.push(...properties.filter(p => !p.label.includes(type) &&
                (p.label.includes("scheduler") || p.label.includes("security") || p.label.includes("advanced"))
            ));
            return result;
        }
    }
}