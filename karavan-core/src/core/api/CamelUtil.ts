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
import { Integration, CamelElement, Beans, MetadataLabels, KameletTypes } from '../model/IntegrationDefinition';
import { CamelDefinitionApi } from './CamelDefinitionApi';
import {
    KameletDefinition,
    BeanFactoryDefinition,
    RouteConfigurationDefinition,
    ToDefinition,
} from '../model/CamelDefinition';
import { KameletApi } from './KameletApi';
import { KameletModel, Property } from '../model/KameletModels';
import { ComponentProperty } from '../model/ComponentModels';
import { ComponentApi } from './ComponentApi';
import { CamelMetadataApi, SensitiveKeys } from '../model/CamelMetadata';
import { CamelDefinitionApiExt } from './CamelDefinitionApiExt';
import { v4 as uuidv4 } from 'uuid';
import { CamelDefinitionYaml } from './CamelDefinitionYaml';

export class CamelUtil {
    private constructor() {
    }

    static cloneIntegration = (integration: Integration): Integration => {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({ ...clone });
        const flows: any[] = [];

        for (const flow of int.spec.flows || []) {
            if (flow.dslName !== 'Beans') {
                flows.push(CamelDefinitionApi.createStep(flow.dslName, flow));
            } else {
                const newBeans = new Beans();
                newBeans.beans.push(...(flow as Beans).beans.map(bean => CamelUtil.cloneBean(bean)));
                flows.push(newBeans);
            }
        }

        for (const routeConfiguration of int.spec.flows?.filter(flow => flow.dslName === 'RouteConfiguration') || []) {
            const newRouteConfiguration = CamelUtil.cloneRouteConfiguration(routeConfiguration);
            flows.push(newRouteConfiguration);
        }

        int.spec.flows = flows;
        return int;
    };

    static cloneStep = (step: CamelElement, generateUuids: boolean = false): CamelElement => {
        const clone = JSON.parse(
            JSON.stringify(step, (key, value) => {
                if (generateUuids && key === 'uuid') {
                    return uuidv4();
                } else {
                    return value;
                }
            }),
        );
        return CamelDefinitionApi.createStep(step.dslName, clone, true);
    };

    static cloneBean = (bean: BeanFactoryDefinition): BeanFactoryDefinition => {
        const clone = JSON.parse(JSON.stringify(bean));
        const newBean = new BeanFactoryDefinition(clone);
        newBean.uuid = bean.uuid;
        return newBean;
    };

    static cloneRouteConfiguration = (
        routeConfiguration: RouteConfigurationDefinition,
    ): RouteConfigurationDefinition => {
        const clone = JSON.parse(JSON.stringify(routeConfiguration));
        const RouteConfiguration = new RouteConfigurationDefinition(clone);
        RouteConfiguration.uuid = routeConfiguration.uuid;
        return RouteConfiguration;
    };

    static capitalizeName = (name: string): string => {
        if (name.length === 0) {
            return name;
        }
        return name[0].toUpperCase() + name.substring(1);
    };

    static camelizeName = (name: string, separator: string, firstSmall: boolean): string => {
        if (name.length === 0) return name;
        const res = name
            .split(separator)
            .map(value => CamelUtil.capitalizeName(value))
            .join('');
        return firstSmall ? res[0].toLowerCase() + res.substring(1) : res;
    };

    static camelizeBody = (name: string, body: any, clone: boolean): any => {
        if (body && Object.keys(body).length > 0) {
            const oldKey = Object.keys(body)[0];
            const key = CamelUtil.camelizeName(oldKey, '-', true);
            return !clone && key === name ? { [key]: body[oldKey] } : body;
        } else {
            return {};
        }
    };

    static camelizeObject = (body: any): any => {
        if (Array.isArray(body)) {
            return body.map(value => (typeof value === 'object' ? CamelUtil.camelizeObject(value) : value));
        } else if (typeof body === 'object') {
            const result: any = {};
            for (const key in body) {
                if (body?.hasOwnProperty(key)) {
                    const newKey = CamelUtil.camelizeName(key, '-', true);
                    const value = body[key];
                    if (typeof value === 'object' || Array.isArray(value)) {
                        result[newKey] = CamelUtil.camelizeObject(value);
                    } else {
                        result[newKey] = value;
                    }
                }
            }
            return result;
        } else {
            return body;
        }
    };

    static isKameletComponent = (element: CamelElement | undefined): boolean => {
        if (element?.dslName === 'KameletDefinition') {
            return true;
        } else if (element?.dslName === 'FromDefinition' || element?.dslName === 'ToDefinition') {
            const uri: string = (element as any).uri;
            return uri !== undefined && uri.startsWith('kamelet:');
        } else {
            return false;
        }
    };

    static getKamelet = (element: CamelElement): KameletModel | undefined => {
        if (element.dslName === 'KameletDefinition') {
            return KameletApi.findKameletByName((element as KameletDefinition).name || '');
        } else if (element.dslName === 'ToDefinition' && (element as ToDefinition).uri?.startsWith('kamelet:')) {
            const kameletName = (element as ToDefinition).uri?.replace('kamelet:', '');
            return KameletApi.findKameletByName(kameletName);
        } else if (['FromDefinition', 'FromDefinition', 'ToDefinition'].includes(element.dslName)) {
            const uri: string = (element as any).uri;
            return uri !== undefined ? KameletApi.findKameletByUri(uri) : undefined;
        } else {
            return undefined;
        }
    };

    static getKameletProperties = (element: any, requiredOnly: boolean = false): Property[] => {
        const kamelet = CamelUtil.getKamelet(element);
        const props: Property[] = kamelet ? KameletApi.getKameletProperties(kamelet?.metadata.name) : [];
        if (requiredOnly) {
            const required = kamelet?.spec.definition.required;
            return props.filter(value => required?.includes(value.id));
        } else {
            return props;
        }
    };

    static getKameletRequiredParameters = (element: any): string[] => {
        const kamelet = CamelUtil.getKamelet(element);
        return kamelet ? kamelet.spec.definition.required : [];
    };

    static getComponentProperties = (element: any): ComponentProperty[] => {
        const dslName: string = (element as any).dslName;
        const uri: string = (element as any).uri;
        const name = ComponentApi.getComponentNameFromUri(uri);

        if (dslName === 'ToDynamicDefinition') {
            const component = ComponentApi.findByName(dslName);
            return component ? ComponentApi.getComponentProperties(component?.component.name, 'producer') : [];
        } else {
            if (name) {
                const component = ComponentApi.findByName(name);
                return component
                    ? ComponentApi.getComponentProperties(
                        component?.component.name,
                        element.dslName === 'FromDefinition' ? 'consumer' : 'producer',
                    )
                    : [];
            } else {
                return [];
            }
        }
    };

    static checkRequired = (element: CamelElement): [boolean, string[]] => {
        const result: [boolean, string[]] = [true, []];
        const className = element.dslName;
        let elementMeta = CamelMetadataApi.getCamelModelMetadataByClassName(className);

        if (elementMeta === undefined && className.endsWith('Expression')) {
            elementMeta = CamelMetadataApi.getCamelLanguageMetadataByClassName(className);
        }

        if (elementMeta) {
            for (const property of elementMeta.properties.filter(p => p.required)) {
                const value = (element as any)[property.name];
                if (property.type === 'string' && !property.isArray && (value === undefined || !value.trim())) {
                    result[0] = false;
                    result[1].push(`${property.displayName} is required`);
                } else if (['ExpressionSubElementDefinition', 'ExpressionDefinition'].includes(property.type)) {
                    const expressionMeta = CamelMetadataApi.getCamelModelMetadataByClassName('ExpressionDefinition');
                    const expressionCheck = expressionMeta && value !== undefined && expressionMeta?.properties.some(ep => {
                        const expValue = value[ep.name];
                        if (expValue) {
                            const checkedExpression = CamelUtil.checkRequired(expValue);
                            return checkedExpression[0];
                        }
                        return false;
                    });
                    result[0] = !!expressionCheck;
                    if (!expressionCheck) {
                        result[1].push('Expression is not defined');
                    }
                }
            }
        }

        if (className === 'FromDefinition' || className === 'ToDefinition') {
            if (!CamelUtil.isKameletComponent(element)) {
                const requiredProperties = CamelUtil.getComponentProperties(element).filter(p => p.required);
                for (const property of requiredProperties) {
                    const value = CamelDefinitionApiExt.getParametersValue(element, property.name, property.kind === 'path');
                    if (value === undefined || (property.type === 'string' && value.trim().length === 0)) {
                        result[0] = false;
                        result[1].push(`${property.displayName} is required`);
                    }
                }
                const secretProperties = CamelUtil.getComponentProperties(element).filter(p => p.secret);
                for (const property of secretProperties) {
                    const value = CamelDefinitionApiExt.getParametersValue(element, property.name, property.kind === 'path');
                    if (value !== undefined && property.type === 'string'
                        && (!value?.trim()?.startsWith("{{") || !value?.trim()?.endsWith('}}'))) {
                        result[0] = false;
                        result[1].push(`${property.displayName} is set in plain text`);
                    }
                }
            } else {
                const kamelet = CamelUtil.getKamelet(element);
                let allSet = true;
                const elementAsAny = (element as any);
                const filledParameters = elementAsAny ? Object.keys(elementAsAny.parameters) : [];
                const missingParameters =
                    kamelet?.spec.definition.required?.filter(name => !filledParameters.includes(name)) || [];
                if (missingParameters.length > 0) {
                    allSet = false;
                    result[1].push(...missingParameters.map(name => `${name} is required`));
                }
                const sensitiveParameters = filledParameters.filter(p => CamelUtil.checkIfKameletParameterSensitive(p, kamelet));
                sensitiveParameters.forEach(p => {
                    const value = elementAsAny?.parameters[p];
                    if (value !== undefined && (!value?.trim()?.startsWith("{{") || !value?.trim()?.endsWith('}}'))) {
                        result[0] = false;
                        result[1].push(`${p} is set in plain text`);
                    }
                });
                result[0] = allSet;
            }
        }
        if (result[1] && result[1].length > 0) {
            result[0] = false;
        }
        return result;
    };

    static checkIfKameletParameterSensitive(parameter: string, kamelet?: KameletModel): boolean {
        if (SensitiveKeys.includes(parameter)) {
            return true;
        } else {
            return (kamelet?.spec.definition.properties?.[parameter] as any)?.type === 'password';
        }
    }

    static findPlaceholdersInObject = (item: any, result: Set<string> = new Set<string>()): Set<string> => {
        if (typeof item === 'object') {
            for (const value of Object.values(item)) {
                if (value == undefined) {
                    continue;
                } else if (Array.isArray(value)) {
                    CamelUtil.findPlaceholdersInArray(value, result);
                } else if (typeof value === 'object') {
                    CamelUtil.findPlaceholdersInObject(value, result);
                } else {
                    const placeholder = CamelUtil.findPlaceholder(value.toString());
                    if (placeholder[0] && placeholder[1]) {
                        result.add(placeholder[1]);
                    }
                }
            }
        } else {
            const placeholder = CamelUtil.findPlaceholder(item.toString());
            if (placeholder[0] && placeholder[1]) {
                result.add(placeholder[1]);
            }
        }
        return result;
    };

    static findPlaceholdersInArray = (
        items: any[] | undefined,
        result: Set<string> = new Set<string>(),
    ): Set<string> => {
        if (items) {
            for (const item of items) {
                if (typeof item === 'object') {
                    CamelUtil.findPlaceholdersInObject(item, result);
                } else {
                    const placeholder = CamelUtil.findPlaceholder(item.toString());
                    if (placeholder[0] && placeholder[1]) {
                        result.add(placeholder[1]);
                    }
                }
            }
        }
        return result;
    };

    static findPlaceholder = (value: string): [boolean, string?] => {
        const val = value?.trim();
        const result = val?.includes('{{') && val?.includes('}}');
        const start = val?.search('{{') + 2;
        const end = val?.search('}}');
        const placeholder = val?.substring(start, end)?.trim();
        return [result, placeholder];
    };

    static createNewKameletCode = (kameletName: string, kameletType: KameletTypes, copyFromKameletName?: string): string => {
        const integration = Integration.createNew(kameletName, 'kamelet');
        const meta: MetadataLabels = new MetadataLabels({ 'camel.apache.org/kamelet.type': kameletType });
        integration.metadata.labels = meta;
        if (copyFromKameletName !== undefined && copyFromKameletName !== '') {
            const kamelet = KameletApi.getKamelets().filter(k => k.metadata.name === copyFromKameletName).at(0);
            if (kamelet) {
                (integration as any).spec = kamelet.spec;
                (integration as any).metadata.labels = kamelet.metadata.labels;
                (integration as any).metadata.annotations = kamelet.metadata.annotations;
                const i = CamelUtil.cloneIntegration(integration);
                return CamelDefinitionYaml.integrationToYaml(i);
            }
        }
        return CamelDefinitionYaml.integrationToYaml(integration);
    };
}
