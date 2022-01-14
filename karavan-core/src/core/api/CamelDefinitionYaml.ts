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
import {
    Integration,
    CamelElement, RouteDefinition,
} from "../model/CamelDefinition";
import {CamelUtil} from "./CamelUtil";
import {CamelDefinitionYamlStep} from "./CamelDefinitionYamlStep";

export class CamelDefinitionYaml {

    static integrationToYaml = (integration: Integration): string => {
        const clone: any = Object.assign({}, integration);
        const flows = integration.spec.flows
        clone.spec.flows = flows?.map((f: any) => CamelDefinitionYaml.cleanupElement(f));
        if (integration.crd) {
            delete clone.crd
            const i = JSON.parse(JSON.stringify(clone, null, 3)); // fix undefined in string attributes
            const text = CamelDefinitionYaml.yamlDump(i);
            return text;
        } else {
            const f = JSON.parse(JSON.stringify(clone.spec.flows, null, 3));
            const text = CamelDefinitionYaml.yamlDump(f);
            return text;
        }
    }

    static cleanupElement = (element: CamelElement): CamelElement => {
        const result: any = {};
        const object: any = Object.assign({}, element);
        if (object.dslName.endsWith('Expression')) {
            delete object.language;
            delete object.expressionName;
        } else if (object.dslName.endsWith('DataFormat')) {
            delete object.dataFormatName;
        }
        delete object.uuid;
        delete object.dslName;
        Object.keys(object)
            .forEach(key => {
                if (object[key] instanceof CamelElement || ( typeof object[key] === 'object' &&  object[key].dslName)) {
                    result[key] = CamelDefinitionYaml.cleanupElement(object[key])
                } else if (Array.isArray(object[key])) {
                    if (object[key].length > 0) result[key] = CamelDefinitionYaml.cleanupElements(object[key])
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

    static cleanupElements = (elements: CamelElement[]): CamelElement[] => {
        const result: any[] = []
        elements.forEach(element => {
            if (typeof (element) === 'object'){
                const newElement = CamelDefinitionYaml.cleanupElement(element)
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
                sortKeys: function (a:any, b:any) {
                    if (a === 'uri') return -1
                    else if (b === 'uri') return 1
                    else if (a === 'expression' && b == 'steps') return -1
                    else if (b === 'expression' && a == 'steps') return 1
                    else if (a === 'steps' && b !== 'uri') return -1
                    else if (b === 'steps' && a !== 'uri') return 1
                    else if (a > b) return 1
                    else return 0;
                },
                replacer: CamelUtil.replacer
            });
    }

    static yamlToIntegration = (filename: string, text: string): Integration => {
        const i: Integration = Integration.createNew(filename);
        const fromYaml: any = yaml.load(text);
        const camelized: any = CamelUtil.camelizeObject(fromYaml);
        if (Array.isArray(camelized)) {
            i.crd = false;
            const flows: any[] = camelized;
            i.spec.flows?.push(...CamelDefinitionYaml.flowsToCamelElements(flows));
        } else {
            i.crd = true;
            const int: Integration = new Integration({...camelized});
            i.spec.flows?.push(...CamelDefinitionYaml.flowsToCamelElements(int.spec.flows || []));
        }
        return i;
    }

    static flowsToCamelElements = (flows: any[]): CamelElement[] => {
        const result:CamelElement[] = [];
        flows.filter((e: any) => e.hasOwnProperty('route'))
            .forEach((f: any) =>
                result.push(CamelDefinitionYamlStep.readRouteDefinition(f.route)));
        flows.filter((e: any) => e.hasOwnProperty('from'))
            .forEach((f: any) =>
                result.push(CamelDefinitionYamlStep.readRouteDefinition(new RouteDefinition({from: f.from}))));
        return result;
    }
}
