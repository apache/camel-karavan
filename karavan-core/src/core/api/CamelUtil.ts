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
import {
    Integration,
    CamelElement, Beans, Dependency,
} from "../model/IntegrationDefinition";
import {CamelDefinitionApi} from "./CamelDefinitionApi";
import {KameletDefinition, NamedBeanDefinition, ToDefinition} from "../model/CamelDefinition";
import {KameletApi} from "./KameletApi";
import {KameletModel, Property} from "../model/KameletModels";
import {ComponentProperty} from "../model/ComponentModels";
import {ComponentApi} from "./ComponentApi";
import {CamelMetadataApi} from "../model/CamelMetadata";
import {CamelDefinitionApiExt} from "./CamelDefinitionApiExt";

export class CamelUtil {

    static cloneIntegration = (integration: Integration): Integration => {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({...clone});
        const flows: any[] = [];
        int.spec.dependencies = int.spec.dependencies?.map(d => this.cloneDependency(d));
        int.spec.flows?.filter((e: any) => e.dslName !== 'Beans')
            .forEach(f => flows.push(CamelDefinitionApi.createStep(f.dslName, f)));
        int.spec.flows?.filter((e: any) => e.dslName === 'Beans')
            .forEach(beans => {
                const newBeans = new Beans();
                (beans as Beans).beans.forEach(b => newBeans.beans.push(CamelUtil.cloneBean(b)));
                flows.push(newBeans);
            });
        int.spec.flows = flows;
        return int;
    }

    static cloneStep = (step: CamelElement): CamelElement => {
        const clone = JSON.parse(JSON.stringify(step));
        return CamelDefinitionApi.createStep(step.dslName, clone, true);
    }

    static cloneDependency = (dependency: Dependency): Dependency => {
        const clone = JSON.parse(JSON.stringify(dependency));
        const newDependency = new Dependency(clone);
        newDependency.uuid = dependency.uuid;
        return newDependency;
    }

    static cloneBean = (bean: NamedBeanDefinition): NamedBeanDefinition => {
        const clone = JSON.parse(JSON.stringify(bean));
        const newBean = new NamedBeanDefinition(clone);
        newBean.uuid = bean.uuid;
        return newBean;
    }

    static capitalizeName = (name: string) => {
        try {
            return name[0].toUpperCase() + name.substring(1);
        } catch (e) {
            return name;
        }
    }

    static camelizeName = (
        name: string,
        separator: string,
        firstSmall: boolean
    ) => {
        const res = name
            .split(separator)
            .map((value) => CamelUtil.capitalizeName(value))
            .join("");
        return firstSmall ? res[0].toLowerCase() + res.substring(1) : res;
    }

    static camelizeBody = (name: string, body: any, clone: boolean): any => {
        if (body && Object.keys(body).length > 0){
            const oldKey = Object.keys(body)[0];
            const key = CamelUtil.camelizeName(oldKey, '-', true);
            return !clone && key === name ? {[key]: body[oldKey]} : body;
        } else {
            return {};
        }
    }

    static camelizeObject = (body: any): any => {
        if (Array.isArray(body)){
            const result: any [] = [];
            (body as []).forEach(value => {
                if (typeof value == 'object'){
                    result.push(CamelUtil.camelizeObject(value));
                } else {
                    result.push(value);
                }
            });
            return result;
        } else {
            const result: any = {};
            if (body && Object.keys(body).length > 0) {
                Object.keys(body).forEach(key => {
                    const newKey = CamelUtil.camelizeName(key, "-", true);
                    if (typeof body[key] == 'object' || Array.isArray(body[key])){
                        result[newKey] = CamelUtil.camelizeObject(body[key]);
                    } else {
                        result[newKey] = body[key];
                    }
                });
            }
            return result;
        }
    }

    static isKameletComponent = (element: CamelElement | undefined): boolean => {
        if (element?.dslName === 'KameletDefinition') {
            return true;
        } else if (element && ["FromDefinition", "ToDefinition"].includes(element.dslName)) {
            const uri: string = (element as any).uri;
            return uri !== undefined && uri.startsWith("kamelet:");
        } else {
            return false;
        }
    }

    static getKamelet = (element: CamelElement): KameletModel | undefined => {
        if (element.dslName === 'KameletDefinition') {
            return KameletApi.findKameletByName((element as KameletDefinition).name || '');
        } else if (element.dslName === 'ToDefinition' && (element as ToDefinition).uri?.startsWith("kamelet:")) {
            const kameletName = (element as ToDefinition).uri?.replace("kamelet:", "");
            return KameletApi.findKameletByName(kameletName);
        } else if (["FromDefinition", "FromDefinition", "ToDefinition"].includes(element.dslName)) {
            const uri: string = (element as any).uri;
            const k =
                uri !== undefined ? KameletApi.findKameletByUri(uri) : undefined;
            return k;
        } else {
            return undefined;
        }
    }

    static getKameletProperties = (element: any): Property[] => {
        const kamelet = this.getKamelet(element)
        return kamelet
            ? KameletApi.getKameletProperties(kamelet?.metadata.name)
            : [];
    }

    static getComponentProperties = (element: any): ComponentProperty[] => {
        const dslName: string = (element as any).dslName;
        if (dslName === 'ToDynamicDefinition'){
            const component = ComponentApi.findByName(dslName);
            return component ? ComponentApi.getComponentProperties(component?.component.name,'producer') : [];
        } else {
            const uri: string = (element as any).uri;
            const name = ComponentApi.getComponentNameFromUri(uri);
            if (name){
                const component = ComponentApi.findByName(name);
                return component ? ComponentApi.getComponentProperties(component?.component.name, element.dslName === 'FromDefinition' ? 'consumer' : 'producer') : [];
            } else {
                return [];
            }
        }
    }

    static checkRequired = (element: CamelElement): [boolean, string []] => {
        const result: [boolean, string []] = [true, []];
        const className = element.dslName;
        let elementMeta =  CamelMetadataApi.getCamelModelMetadataByClassName(className);
        if (elementMeta === undefined && className.endsWith("Expression")) elementMeta = CamelMetadataApi.getCamelLanguageMetadataByClassName(className);
        elementMeta?.properties.filter(p => p.required).forEach(p => {
            const value = (element as any)[p.name];
            if (p.type === 'string' && (value === undefined || value.trim().length === 0)){
                result[0] = false;
                result[1].push("Property " + p.displayName + " is required");
            } else if (p.type === 'ExpressionDefinition'){
                const expressionMeta =  CamelMetadataApi.getCamelModelMetadataByClassName('ExpressionDefinition');
                let expressionCheck = false;
                expressionMeta?.properties.forEach(ep => {
                    const expValue = value[ep.name];
                    if (expValue){
                        const checkedExpression = this.checkRequired(expValue);
                        if (checkedExpression[0]) expressionCheck = true;
                    }
                })
                result[0] = expressionCheck;
                if (!expressionCheck) result[1].push("Expression is not defined");
            }
        })
        if (['FromDefinition', 'ToDefinition'].includes(className)){
            const isKamelet = this.isKameletComponent(element);
            if (!isKamelet){
                this.getComponentProperties(element).filter(p => p.required).forEach(p => {
                    const value = CamelDefinitionApiExt.getParametersValue(element, p.name, p.kind === 'path');
                   if (value === undefined || value.trim().length === 0){
                       result[0] = false;
                       result[1].push("Property " + p.displayName + " is required");
                   }
                })
            }
        }
        return result;
    }

    static findPlaceholdersInObject = (item: any, result: Set<string> = new Set<string>()): Set<string> => {
        if (typeof item === 'object'){
            Object.keys(item).forEach(key => {
                const value = (item as any)[key];
                if (Array.isArray(value)){
                    this.findPlaceholdersInArray(value, result);
                } else if (typeof value === 'object'){
                    this.findPlaceholdersInObject(value, result);
                } else {
                    const r = this.findPlaceholder(value.toString());
                    if (r[0] && r[1]) result.add(r[1]);
                }
            })
        } else {
            const r = this.findPlaceholder(item.toString());
            if (r[0] && r[1]) result.add(r[1]);
        }
        return result;
    }

    static findPlaceholdersInArray = (items: any[] | undefined, result: Set<string> = new Set<string>()): Set<string> => {
        if (items !== undefined) {
            items.forEach(item => {
                if (typeof item === 'object'){
                    this.findPlaceholdersInObject(item, result);
                } else {
                    const r = this.findPlaceholder(item.toString());
                    if (r[0] && r[1]) result.add(r[1]);
                }
            })
        }
        return result;
    }

    static findPlaceholder = (value: string): [boolean, string?] => {
        let result = false;
        let placeholder = undefined;
        if (value !== undefined) {
            const val = value.trim();
            result = val.includes("{{") && val.includes("}}");
            const start = val.search("{{") + 2;
            const end = val.search("}}");
            placeholder = val.substring(start, end).trim();
        }
        return [result, placeholder];
    }
}
