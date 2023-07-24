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
import { Component, ComponentProperty, SupportedComponent } from '../model/ComponentModels';
import { CamelElement } from '../model/IntegrationDefinition';

const Components: Component[] = [];
const SupportedComponents: SupportedComponent[] = [];
let SupportedOnly: boolean = false;

export class ComponentApi {
    private constructor() {}

    static setSupportedOnly = (supportedOnly: boolean): void => {
        SupportedOnly = supportedOnly;
    };

    static saveSupportedComponents = (jsons: string): void => {
        SupportedComponents.length = 0;
        const sc: SupportedComponent[] = (JSON.parse(jsons) as []).map(json => new SupportedComponent(json));
        SupportedComponents.push(...sc);
    };

    static getSupportedComponents = (): SupportedComponent[] => {
        return SupportedComponents;
    };

    static jsonToComponent = (json: string): Component => {
        const fromJson: Component = JSON.parse(json) as Component;
        const k: Component = new Component(fromJson);
        return k;
    };

    static saveComponents = (jsons: string[], clean: boolean = false): void => {
        if (clean) Components.length = 0;
        const components: Component[] = jsons.map(json => ComponentApi.jsonToComponent(json));
        Components.push(...components);
    };

    static saveComponent = (json: string): void => {
        const component: Component = ComponentApi.jsonToComponent(json);
        if (Components.findIndex((c: Component) => c.component.name === component.component.name) === -1) {
            Components.push(component);
        }
    };

    static getComponents = (): Component[] => {
        const comps: Component[] = [];
        if (SupportedOnly) {
            comps.push(
                ...Components.filter(
                    comp => SupportedComponents.findIndex(sc => sc.name === comp.component.name) !== -1,
                ),
            );
        } else {
            comps.push(...Components);
        }
        return comps
            .map(comp => {
                const sc = SupportedComponents.find(sc => sc.name === comp.component.name);
                if (sc !== undefined) {
                    comp.component.supportLevel = sc.level;
                    comp.component.supportType = 'Supported';
                    return comp;
                } else {
                    comp.component.supportType = 'Community';
                    return comp;
                }
            })
            .sort((a, b) => a.component.name.localeCompare(b.component.name, undefined, { sensitivity: 'base' }));
    };

    static findByName = (name: string): Component | undefined => {
        return ComponentApi.getComponents().find((c: Component) => c.component.name === name);
    };

    static getComponentNameFromUri = (uri: string): string | undefined => {
        return uri !== undefined ? uri.split(':')[0] : undefined;
    };

    static getComponentTitleFromUri = (uri: string): string | undefined => {
        if (uri !== undefined) {
            const componentName = uri.split(':')[0];
            const title = ComponentApi.findByName(componentName)?.component.title;
            return title ? title : componentName;
        } else {
            return undefined;
        }
    };

    static getComponentDescriptionFromUri = (uri: string): string | undefined => {
        if (uri !== undefined) {
            const componentName = uri.split(':')[0];
            const description = ComponentApi.findByName(componentName)?.component.description;
            return description ? description : componentName;
        } else {
            return undefined;
        }
    };

    static parseElementUri(def: any): any {
        const uriParts = ComponentApi.parseUri(def.uri);
        if (uriParts.length > 1 && !def.uri.startsWith('kamelet:')) {
            const uriValues = ComponentApi.getUriParts(def.uri);
            uriValues.forEach((value, key) => {
                def.parameters[key] = value;
            });
            def.uri = uriParts[0];
        }
        return def;
    }

    static getUriParts = (uri: string): Map<string, string> => {
        const result: Map<string, string> = new Map<string, string>();
        const name = ComponentApi.getComponentNameFromUri(uri);
        if (name) {
            const component = ComponentApi.findByName(name);
            const syntax = component?.component.syntax;
            const syntaxParts = ComponentApi.parseSyntax(syntax + '');
            const syntaxSeparators = ComponentApi.getSyntaxSeparators(syntax + '');
            let newUri = uri === name ? name + syntaxSeparators.join('') : uri;

            if (name === 'salesforce') {
                // workaround for salesforce component
                const parts = newUri.split(':');
                if (parts.length === 2) result.set('operationName', parts.at(1) || '').set('topicName', '');
                else if (parts.length === 3)
                    result.set('operationName', parts.at(1) || '').set('topicName', parts.at(2) || '');
            } else if (name === 'cxf') {
                // workaround for CXF component
                const cxfParts = newUri.split(':');
                const firstPart = cxfParts.at(1);
                const secondPart = cxfParts.at(2);
                if (cxfParts.length === 3 && firstPart === 'bean' && secondPart)
                    result.set('beanId', firstPart + ':' + secondPart);
                if (cxfParts.length === 2 && firstPart?.startsWith('//')) result.set('address', firstPart);
            } else if (name === 'jt400') {
                // workaround for JT400 component
                const jt400Parts = newUri.split('.').join(':').split('/').join(':').split('@').join(':').split(':');
                const userID = jt400Parts.at(1) || '';
                const password = jt400Parts.at(2) || '';
                const systemName = jt400Parts.at(3) || '';
                const objectPath = jt400Parts.at(4) || '';
                const type = jt400Parts.at(5) || '';
                result.set('userID', userID);
                result.set('password', password);
                result.set('systemName', systemName);
                result.set('objectPath', objectPath);
                result.set('type', type);
            } else {
                // workarounds end
                syntaxParts
                    .filter((_, i) => i > 0)
                    .forEach((part, index) => {
                        if (index < syntaxParts.length - 1) {
                            const startSeparator = syntaxSeparators[index];
                            const endSeparator = syntaxSeparators[index + 1];
                            const start = newUri.indexOf(startSeparator) + startSeparator.length;
                            const end = endSeparator ? newUri.indexOf(endSeparator, start) : newUri.length;
                            const val = newUri.substring(start, end);
                            result.set(part, val);
                            newUri = newUri.substring(end);
                        }
                    });
            }
        }
        return result;
    };

    static parseSyntax = (syntax: string): string[] => {
        const separators: string[] = ['://', '//', ':', '/', '#'];
        let simplifiedSyntax = '' + syntax;
        separators.forEach(s => {
            simplifiedSyntax = simplifiedSyntax?.replaceAll(s, ':');
        });
        return simplifiedSyntax.split(':');
    };

    static getSyntaxSeparators = (syntax: string): string[] => {
        const result: string[] = [];
        const parts: string[] = ComponentApi.parseSyntax(syntax);
        let str = '';
        parts.forEach((part, index) => {
            if (index < parts.length - 1) {
                const start = syntax.indexOf(part, str.length) + part.length;
                const end = syntax.indexOf(parts[index + 1], start);
                const separator = syntax.substring(start, end);
                result.push(separator);
                str = str + part + separator;
            }
        });
        return result;
    };

    static parseUri = (uri?: string): string[] => {
        const separators: string[] = ['://', '//', ':', '/', '#'];
        let simplifiedUri = '' + uri;
        separators.forEach(s => {
            simplifiedUri = simplifiedUri.replaceAll(s, ':');
        });
        return simplifiedUri.split(':');
    };

    static getUriSeparators = (uri: string): string[] => {
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
                    const separator = syntax.substring(start, end);
                    result.push(separator);
                    str = str + part + separator;
                }
            });
        }
        return result;
    };

    static getPathParameterValue = (uri: string, pathParameter: string): string | undefined => {
        return ComponentApi.getUriParts(uri).get(pathParameter);
    };

    static getComponentProperties = (componentName: string, type: 'consumer' | 'producer'): ComponentProperty[] => {
        const invertedType = type === 'consumer' ? 'producer' : 'consumer';
        const component: Component | undefined = ComponentApi.findByName(componentName);
        const properties: ComponentProperty[] = [];
        if (component !== undefined && component.properties) {
            for (const [key, value] of Object.entries(component.properties) as [string, any][]) {
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
                if (value.defaultValue) {
                    prop.defaultValue = value.defaultValue;
                }
                if (!value.deprecated) {
                    properties.push(prop);
                }
            }
        }
        const result: ComponentProperty[] = [];
        result.push(...properties.filter(p => p.kind === 'path'));
        result.push(...properties.filter(p => p.kind !== 'path' && p.required));
        result.push(...properties.filter(p => p.label.length === 0 && p.kind !== 'path' && !p.required));
        result.push(
            ...properties.filter(p => !p.label.includes(invertedType) && !p.label.includes('advanced') && !p.required),
        );
        result.push(...properties.filter(p => p.label === 'formatting' && !p.required));
        result.push(
            ...properties.filter(
                p =>
                    !p.label.includes(invertedType) &&
                    (p.label.includes('scheduler') || p.label.includes('security') || p.label.includes('advanced')),
            ),
        );
        result.push(
            ...properties.filter(
                p =>
                    !p.label.includes(invertedType) &&
                    (p.label.includes('scheduler') || p.label.includes('security') || p.label.includes('advanced')),
            ),
        );
        return Array.from(new Map(result.map(item => [item.name, item])).values());
    };
}
