/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the 'License'); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
    CamelElement, Integration,
    IntegrationFile,
} from '../model/IntegrationDefinition';
import { CamelDefinitionYaml } from './CamelDefinitionYaml';
import { FromDefinition} from '../model/CamelDefinition';
import { CamelDefinitionApiExt } from './CamelDefinitionApiExt';

const sendReceiveDSL: string[] =
    ['ToDefinition', 'FromDefinition', 'ToDynamicDefinition', 'PollEnrichDefinition',
        'EnrichDefinition', 'WireTapDefinition', 'UnmarshalDefinition', 'MarshalDefinition'];

export const GLOBAL = 'global:';
export const  ROUTE = 'route:';


export class VariableUtil {
    private constructor() {
    }

    static findVariables = (files: IntegrationFile[]): string[] => {
        const integrations = files.filter(file => file.name?.endsWith(".camel.yaml"))
            .map(file => CamelDefinitionYaml.yamlToIntegration(file.name, file.code));
        return VariableUtil.findVariablesInIntegrations(integrations);
    };

    static findVariablesInIntegrations = (integrations: Integration[]): string[] => {
        const result: string[] = []
        integrations.forEach(i => {
            const filename = i.metadata.name;
            const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
            routes?.forEach(route => {
                const from: FromDefinition = route.from;
                VariableUtil.findVariablesInStep(from, result);
            })

        })
        return VariableUtil.sortVariables(result);
    };

    static sortVariables = (variables: string[]): string [] => {
        const global = [...new Set(variables.filter(v => v && v.startsWith(GLOBAL)))].sort();
        const route = [...new Set(variables.filter(v => v && v.startsWith(ROUTE)))].sort();
        const exchange = [...new Set(variables.filter(v => v && !v.startsWith(ROUTE) && !v.startsWith(GLOBAL)))].sort();
        return global.concat(route, exchange);
    }

    static findVariablesInStep = (step: CamelElement, result: string[]) => {
        if (step !== undefined) {
            const el = (step as any);
            if (sendReceiveDSL.includes(el.dslName)) {
                VariableUtil.findVariablesInProps(el, 'variableSend', result);
                VariableUtil.findVariablesInProps(el, 'variableReceive', result);
            } else if (el.dslName === 'ConvertVariableDefinition') {
                VariableUtil.findVariablesInProps(el, 'name', result);
                VariableUtil.findVariablesInProps(el, 'toName', result);
            } else if (el.dslName === 'SetVariableDefinition') {
                VariableUtil.findVariablesInProps(el, 'name', result);
            } else if (el.dslName === 'RemoveVariableDefinition') {
                VariableUtil.findVariablesInProps(el, 'name', result);
            }
            // check children elements
            const childElements = CamelDefinitionApiExt.getElementChildrenDefinition(el.dslName);
            childElements.forEach(child => {
                if (child.multiple) {
                    const sub = (el[child.name] as CamelElement[]);
                    VariableUtil.findVariablesInSteps(sub, result);
                } else {
                    const sub = (el[child.name] as CamelElement);
                    VariableUtil.findVariablesInStep(sub, result);
                }
            })
        }
    }

    static findVariablesInSteps = (steps: CamelElement[], result: string[]) => {
        if (steps !== undefined && steps.length > 0) {
            steps.forEach(step => VariableUtil.findVariablesInStep(step, result))
        }
    }

    static findVariablesInProps = (step: CamelElement, propertyName: string, result: string[]) => {
        const el = (step as any);
        if (el.hasOwnProperty(propertyName)) {
            result.push(el[propertyName])
        }
    }
}
