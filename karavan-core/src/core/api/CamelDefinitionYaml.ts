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
import * as yaml from 'js-yaml';
import {Integration, CamelElement, Beans, Dependency,} from "../model/IntegrationDefinition";
import {RouteDefinition, NamedBeanDefinition} from "../model/CamelDefinition";
import {CamelUtil} from "./CamelUtil";
import {CamelDefinitionYamlStep} from "./CamelDefinitionYamlStep";
import {Trait, TraitApi} from "../model/TraitDefinition";

export class CamelDefinitionYaml {

    static integrationToYaml = (integration: Integration): string => {
        const clone: any = CamelUtil.cloneIntegration(integration);
        const flows = integration.spec.flows
        clone.spec.flows = flows?.map((f: any) => CamelDefinitionYaml.cleanupElement(f)).filter(x => Object.keys(x).length !== 0);
        if (clone.spec.dependencies && Array.from(clone.spec.dependencies).length === 0) {
            delete clone.spec.dependencies;
        } else {
            clone.spec.dependencies = this.generateDependencies(clone.spec.dependencies);
        }
        if (clone.spec.traits) {
            clone.spec.traits = this.cleanupElement(clone.spec.traits);
        }
        if (integration.crd) {
            delete clone.crd
            const i = JSON.parse(JSON.stringify(clone, null, 3)); // fix undefined in string attributes
            const text = CamelDefinitionYaml.yamlDump(i);
            return text;
        } else {
            const f = JSON.parse(JSON.stringify(clone.spec.flows, null, 3));
            const text = CamelDefinitionYaml.yamlDump(f);
            if (clone.spec.dependencies && clone.spec.dependencies.length > 0) {
                const modeline = this.generateModeline(clone.spec.dependencies);
                return modeline.concat('\n', text);
            } else {
                return text;
            }
        }
    }

    static generateDependencies = (deps: Dependency[]): string[] => {
        let result: string[] = [];
        deps?.forEach(d => {
            result.push('mvn:' + d.group + ":" + d.artifact + ":" + d.version);
        })
        return result;
    }

    static generateModeline = (deps: string []): string => {
        let result = '# camel-k:'
        deps?.forEach(d => {
            result = result.concat(' dependency=', d)
        })
        return result;
    }

    static cleanupElement = (element: CamelElement, inArray?: boolean, inSteps?: boolean): CamelElement => {
        const result: any = {};
        const object: any = Object.assign({}, element);
        if (inArray) {
            object.inArray = inArray;
            object.inSteps = (inSteps === true);
        }
        if (object.dslName.endsWith('Expression')) {
            delete object.language;
            delete object.expressionName;
        } else if (object.dslName.endsWith('DataFormat')) {
            delete object.dataFormatName;
        } else if (object.dslName === 'NamedBeanDefinition') {
            if (object.properties && Object.keys(object.properties).length === 0) delete object.properties;
        }
        delete object.uuid;
        Object.keys(object)
            .forEach(key => {
                if (object[key] instanceof CamelElement || (typeof object[key] === 'object' && object[key].dslName)) {
                    result[key] = CamelDefinitionYaml.cleanupElement(object[key])
                } else if (Array.isArray(object[key])) {
                    if (object[key].length > 0) result[key] = CamelDefinitionYaml.cleanupElements(object[key], key === 'steps')
                } else if (key === 'parameters' && typeof (object[key]) === 'object') {
                    const obj = object[key];
                    const parameters = Object.keys(obj || {}).reduce((x: any, k) => {
                        // Check for null or undefined or empty
                        if (obj[k] !== null && obj[k] !== undefined && obj[k].toString().trim().length > 0) {
                            x[k] = obj[k];
                        }
                        return x;
                    }, {});
                    if (Object.keys(parameters).length > 0) result[key] = parameters;
                } else {
                    if (object[key] !== undefined && object[key].toString().trim().length > 0) result[key] = object[key];
                }
            })
        return result as CamelElement
    }

    static cleanupElements = (elements: CamelElement[], inSteps?: boolean): CamelElement[] => {
        const result: any[] = []
        elements.forEach(element => {
            if (typeof (element) === 'object') {
                const newElement = CamelDefinitionYaml.cleanupElement(element, true, inSteps)
                result.push(newElement)
            } else {
                result.push(element);
            }
        })
        return result
    }

    static yamlDump = (integration: Integration): string => {
        return yaml.dump(integration,
            {
                noRefs: false,
                noArrayIndent: false,
                sortKeys: function (a: any, b: any) {
                    if (a === 'uri') return -1
                    else if (b === 'uri') return 1
                    else if (a === 'expression' && b == 'steps') return -1
                    else if (b === 'expression' && a == 'steps') return 1
                    else if (a === 'steps' && b !== 'uri') return -1
                    else if (b === 'steps' && a !== 'uri') return 1
                    else if (a > b) return 1
                    else return 0;
                },
                replacer: (key, value) => this.replacer(key, value)
            });
    }

    static replacer = (key: string, value: any): any => {
        if (typeof value === 'object' && (value.hasOwnProperty('stepName') || value.hasOwnProperty('inArray')  || value.hasOwnProperty('inSteps'))) {
            const stepNameField = value.hasOwnProperty('stepName') ? 'stepName' : 'step-name';
            const stepName = value[stepNameField];
            const dslName = value.dslName;
            let newValue: any = JSON.parse(JSON.stringify(value));
            delete newValue.dslName;
            delete newValue[stepNameField];
            if ((value.inArray && !value.inSteps)
                || dslName === 'ExpressionSubElementDefinition'
                || dslName === 'ExpressionDefinition'
                || dslName?.endsWith('Expression')
                || stepName === 'otherwise'
                || key === 'from') {
                delete newValue.inArray;
                delete newValue.inSteps;
                return newValue;
            } else {
                delete newValue.inArray;
                delete newValue.inSteps;
                const xValue: any = {};
                xValue[stepName] = newValue;
                return xValue;
            }
        } else {
            if (value?.dslName && value.dslName.endsWith("Trait") && value.dslName !== 'Trait'){
                delete value.dslName;
                return {configuration: value};
            } else if (value?.dslName === 'Trait' && value?.threeScale){
                delete value.dslName;
                value["3scale"] = {configuration: value.threeScale};
                return value;
            }
            delete value?.dslName;
            return value;
        }
    }

    static yamlToIntegration = (filename: string, text: string): Integration => {
        const integration: Integration = Integration.createNew(filename);
        const fromYaml: any = yaml.load(text);
        const camelized: any = CamelUtil.camelizeObject(fromYaml);
        if (camelized?.apiVersion && camelized.apiVersion.startsWith('camel.apache.org') && camelized.kind && camelized.kind === 'Integration') {
            integration.crd = true;
            if (camelized?.metadata?.name) integration.metadata.name = camelized?.metadata?.name;
            const int: Integration = new Integration({...camelized});
            integration.spec.flows?.push(...this.flowsToCamelElements(int.spec.flows || []));
            integration.spec.dependencies = this.dependenciesToDependency(int.spec.dependencies);
            if (int.spec.traits) integration.spec.traits = TraitApi.traitsFromYaml(int.spec.traits);
        } else if (Array.isArray(camelized)) {
            integration.crd = false;
            const flows: any[] = camelized;
            integration.spec.flows?.push(...this.flowsToCamelElements(flows));
            integration.spec.dependencies = this.modelineToDependency(text);
            // integration.spec.traits = this.traitsToCamelElements(flows); // TODO: Plain yaml Trait ???
        }
        return integration;
    }

    static yamlIsIntegration = (text: string): boolean => {
        const fromYaml: any = yaml.load(text);
        const camelized: any = CamelUtil.camelizeObject(fromYaml);
        if (camelized?.apiVersion && camelized.apiVersion.startsWith('camel.apache.org') && camelized.kind && camelized.kind === 'Integration') {
            return true;
        } else if (Array.isArray(camelized)) {
            return true;
        } else {
            return false;
        }
    }

    static dependenciesToDependency = (deps?: any[]): Dependency[] => {
        const result: Dependency[] = [];
        deps?.forEach((d: any) => result.push(Dependency.createNew(d.toString())));
        return result;
    }

    static modelineToDependency = (text: string): Dependency[] => {
        const result: Dependency[] = [];
        const lines = text.split("\r\n");
        lines.filter(l => {
            const line = l.trim();
            return line.startsWith("#") && line.includes("camel-k");
        }).forEach(line => {
            const parts = line.split(" ");
            parts.filter(part => part.trim() && part.trim().startsWith("dependency")).forEach(part => {
                const dep = part.replace("dependency=", '');
                result.push(Dependency.createNew(dep));
            })
        });
        return result;
    }

    static flowsToCamelElements = (flows: any[]): any[] => {
        const result: any[] = [];
        flows.filter((e: any) => e.hasOwnProperty('restConfiguration'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRestConfigurationDefinition(f.restConfiguration)));
        flows.filter((e: any) => e.hasOwnProperty('rest'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRestDefinition(f.rest)));
        flows.filter((e: any) => e.hasOwnProperty('route'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRouteDefinition(f.route)));
        flows.filter((e: any) => e.hasOwnProperty('from'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteDefinition(new RouteDefinition({from: f.from}))));
        flows.filter((e: any) => e.hasOwnProperty('beans'))
            .forEach((b: any) => result.push(CamelDefinitionYaml.readBeanDefinition(b)));
        return result;
    }

    static readBeanDefinition = (beans: any): Beans => {
        const result: Beans = new Beans();
        beans.beans.forEach((b: any) => {
            const props: any = {}
            if (b && b.properties) {
                // convert map style to properties if requires
                Object.keys(b.properties).forEach(key => {
                    const value = b.properties[key];
                    CamelDefinitionYaml.flatMapProperty(key, value, new Map<string, any>())
                        .forEach((v, k) => props[k] = v);
                })
            }
            b.properties = props;
            result.beans.push(new NamedBeanDefinition(b))
        })
        return result;
    }

    // convert map style to properties if requires
    static flatMapProperty = (key: string, value: any, properties: Map<string, any>): Map<string, any> => {
        if (value === undefined) {
        } else if (typeof value === 'object') {
            Object.keys(value).forEach(k => {
                const key2 = key + "." + k;
                const value2: any = value[k];
                CamelDefinitionYaml.flatMapProperty(key2, value2, new Map<string, any>())
                    .forEach((value1, key1) => properties.set(key1, value1));
            })
        } else {
            properties.set(key, value);
        }
        return properties;
    }
}
