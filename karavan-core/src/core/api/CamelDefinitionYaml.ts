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
import { Beans, CamelElement, Integration } from '../model/IntegrationDefinition';
import {
    BeanFactoryDefinition,
    RouteConfigurationDefinition,
    RouteDefinition,
} from '../model/CamelDefinition';
import { CamelUtil } from './CamelUtil';
import { CamelDefinitionYamlStep } from './CamelDefinitionYamlStep';

export class CamelDefinitionYaml {
    private constructor() {
    }

    static integrationToYaml = (integration: Integration): string => {
        const clone: any = CamelUtil.cloneIntegration(integration);
        const flows = integration.spec.flows;
        clone.spec.flows = flows
            ?.map((f: any) => CamelDefinitionYaml.cleanupElement(f))
            .filter(x => Object.keys(x).length !== 0);
        if (integration.type === 'crd') {
            delete clone.type;
            const i = JSON.parse(JSON.stringify(clone, (key, value) => CamelDefinitionYaml.replacer(key, value), 3)); // fix undefined in string attributes
            return CamelDefinitionYaml.yamlDump(i);
        } else if (integration.type === 'kamelet') {
            delete clone.type;
            // turn array of flows to object properties in template for Kamelet
            const template: any = {route: {}}
            const route: RouteDefinition = clone.spec.flows.filter((f: any) => f.dslName === 'RouteDefinition')?.[0];
            if (route) {
                template.route = Object.assign(template.route, route);
            } else if (clone.spec.template?.route) {
                template.route = clone.spec.template.route;
            } else if (clone.spec.template?.from) {
                template.route = {from: clone.spec.template?.from};
            }
            const from: RouteDefinition = clone.spec.flows.filter((f: any) => f.dslName === 'FromDefinition')?.[0];
            if (from) {
                template.from = {from: from};
            }
            const beans = clone.spec.flows.filter((f: any) => f.dslName === 'Beans')?.at(0)?.beans;
            if (beans) {
                template.beans = beans;
            } else if (clone.spec.template?.beans){
                template.beans = clone.spec.template.beans;
            }
            clone.spec.template = template;
            delete clone.spec.flows;
            const i = JSON.parse(JSON.stringify(clone, (key, value) => CamelDefinitionYaml.replacer(key, value, true), 3)); // fix undefined in string attributes
            return CamelDefinitionYaml.yamlDump(i);
        } else {
            const f = JSON.parse(
                JSON.stringify(clone.spec.flows, (key, value) => CamelDefinitionYaml.replacer(key, value), 3),
            );
            return CamelDefinitionYaml.yamlDump(f);
        }
    };

    static isEmpty = (value?: string): boolean => {
        return value === undefined || (value.trim && value.trim().length === 0);
    };

    static isEmptyObject(obj: any): boolean {
        // Check if it's an object and not null
        if (obj && typeof obj === 'object') {
            // Get all enumerable property names
            const keys = Object.keys(obj);
            // Get all non-enumerable property names
            const nonEnumProps = Object.getOwnPropertyNames(obj);
            // Check if there are no properties
            return keys.length === 0 && nonEnumProps.length === 0;
        }
        return false;
    }


    static cleanupElement = (element: CamelElement, inArray?: boolean, inSteps?: boolean): CamelElement => {
        const result: any = {};
        const object: any = { ...element };

        if (inArray) {
            object.inArray = inArray;
            object.inSteps = !!inSteps;
        }

        if (object.dslName === 'RouteTemplateDefinition') {
            object.route.inArray = true;
        } else if (object.dslName?.endsWith('Expression')) {
            delete object.language;
            delete object.expressionName;
        } else if (object.dslName?.endsWith('DataFormat')) {
            delete object.dataFormatName;
        } else if (object.dslName === 'BeanFactoryDefinition') {
            if (object.properties && Object.keys(object.properties).length === 0) {
                delete object.properties;
            }
            if (object.constructors && CamelDefinitionYaml.isEmptyObject(object.constructors)) {
                delete object.constructors;
            }
        } else if (['CatchDefinition', 'OnExceptionDefinition', 'OnCompletionDefinition', 'Resilience4jConfigurationDefinition'].includes(object.dslName) && object?.onWhen?.stepName !== undefined) {
            object.onWhen.stepName = 'onWhen';  // https://github.com/apache/camel-karavan/issues/1420
        }

        delete object.uuid;
        delete object.showChildren;

        for (const [key, value] of Object.entries(object) as [string, any][]) {
            if (value instanceof CamelElement || (typeof value === 'object' && value?.dslName)) {
                result[key] = CamelDefinitionYaml.cleanupElement(value);
            } else if (Array.isArray(value)) {
                if (value.length > 0) {
                    result[key] = CamelDefinitionYaml.cleanupElements(value, key === 'steps');
                }
            } else if (key === 'parameters' && typeof value === 'object') {
                const parameters = Object.entries(value || {})
                    .filter(([_, v]: [string, any]) => !CamelDefinitionYaml.isEmpty(v))
                    .reduce((x: any, [k, v]) => ({ ...x, [k]: v }), {});
                if (Object.keys(parameters).length > 0) {
                    result[key] = parameters;
                }
            } else {
                if (!CamelDefinitionYaml.isEmpty(value)) {
                    result[key] = value;
                }
            }
        }
        return result as CamelElement;
    };

    static cleanupElements = (elements: CamelElement[], inSteps?: boolean): CamelElement[] => {
        const result: any[] = [];
        for (const element of elements) {
            if (typeof element === 'object') {
                result.push(CamelDefinitionYaml.cleanupElement(element, true, inSteps));
            } else {
                result.push(element);
            }
        }
        return result;
    };

    static yamlDump = (integration: any): string => {
        return yaml.dump(integration, {
            noRefs: false,
            noArrayIndent: false,
            // forceQuotes: true,
            quotingType: '"',
            sortKeys: function(a: any, b: any) {
                if (a === 'steps') return 1;
                else if (b === 'steps') return -1;
                else return 0;
            },
        });
    };

    static replacer = (key: string, value: any, isKamelet: boolean = false): any => {
        if (
            typeof value === 'object' &&
            (value.hasOwnProperty('stepName') || value.hasOwnProperty('inArray') || value.hasOwnProperty('inSteps'))
        ) {
            const stepNameField = value.hasOwnProperty('stepName') ? 'stepName' : 'step-name';
            const stepName = value[stepNameField];
            const dslName = value.dslName;
            let newValue: any = JSON.parse(JSON.stringify(value));
            delete newValue.dslName;
            delete newValue[stepNameField];

            if (
                value.inArray &&
                !value.inSteps &&
                ['intercept', 'interceptFrom', 'interceptSendToEndpoint', 'onCompletion', 'onException'].includes(
                    stepName,
                )
            ) {
                delete newValue.inArray;
                delete newValue.inSteps;
                const xValue: any = {};
                xValue[stepName] = newValue;
                return xValue;
            } else if (value.inArray && dslName === 'RouteDefinition' && !isKamelet ) { // route in RouteTemplate
                delete value?.dslName;
                delete value?.stepName;
                delete value?.inArray;
                return value;
            } else if (
                (value.inArray && !value.inSteps) ||
                dslName === 'ExpressionSubElementDefinition' ||
                dslName === 'ExpressionDefinition' ||
                dslName?.endsWith('Expression') ||
                stepName === 'otherwise' ||
                stepName === 'doFinally' ||
                stepName === 'resilience4jConfiguration' ||
                stepName === 'faultToleranceConfiguration' ||
                stepName === 'errorHandler' ||
                stepName === 'onWhen' || // https://github.com/apache/camel-karavan/issues/1420
                stepName === 'deadLetterChannel' ||
                stepName === 'defaultErrorHandler' ||
                stepName === 'jtaTransactionErrorHandler' ||
                stepName === 'noErrorHandler' ||
                stepName === 'springTransactionErrorHandler' ||
                stepName === 'redeliveryPolicy' ||
                stepName === 'securityDefinitions' ||
                stepName === 'apiKey' ||
                stepName === 'basicAuth' ||
                stepName === 'bearer' ||
                stepName === 'mutualTls' ||
                stepName === 'oauth2' ||
                stepName === 'openIdConnect' ||
                stepName === 'openApi' ||
                key === 'from'
            ) {
                delete newValue.inArray;
                delete newValue.inSteps;
                return newValue;
            } else if (isKamelet && dslName === 'RouteDefinition') {
                delete value?.dslName;
                delete value?.stepName;
                return value;
            } else {
                delete newValue.inArray;
                delete newValue.inSteps;
                const xValue: any = {};
                xValue[stepName] = newValue;
                return xValue;
            }
        } else {
            if (value?.dslName === 'YAMLDataFormat') { // YAMLDataFormat constructor field
                value.constructor = value._constructor;
                delete value._constructor;
            }
            delete value?.dslName;
            return value;
        }
    };

    static yamlToIntegration = (filename: string, text: string): Integration => {
        const integration: Integration = Integration.createNew(filename);
        const fromYaml: any = yaml.load(text);
        const camelized: any = CamelUtil.camelizeObject(fromYaml);
        if (camelized?.apiVersion && camelized.apiVersion.startsWith('camel.apache.org') && camelized.kind) {
            if (camelized?.metadata) {
                integration.metadata = camelized?.metadata;
            }
            if (camelized?.spec) {
                integration.spec.definition = camelized?.spec.definition;
                integration.spec.dependencies = camelized?.spec.dependencies;
                integration.spec.types = camelized?.spec.types;
            }
            const int: Integration = new Integration({ ...camelized });
            if (camelized.kind === 'Integration') {
                integration.type = 'crd';
                integration.spec.flows?.push(...CamelDefinitionYaml.flowsToCamelElements(int.spec.flows || []));
            } else if (camelized.kind === 'Kamelet') {
                integration.type = 'kamelet';
                integration.kind = 'Kamelet';
                const flows: any[] = [];
                // turn kamelet template object properties to array of flows
                const beans = int.spec.template?.beans;
                if (beans) {
                    flows.push(new Beans({beans: beans}))
                }
                const from = int.spec.template?.from;
                if (from) {
                    flows.push(new RouteDefinition({from: from}))
                } else {
                    const route = int.spec.template?.route;
                    flows.push(route);
                }
                integration.spec.flows?.push(...CamelDefinitionYaml.flowsToCamelElements(flows || []));
            }
        } else if (Array.isArray(camelized)) {
            integration.type = 'plain';
            const flows: any[] = camelized;
            integration.spec.flows?.push(...CamelDefinitionYaml.flowsToCamelElements(flows));
        }
        return integration;
    };

    static yamlIsIntegration = (text: string): 'crd' | 'plain' | 'kamelet' | 'none' => {
        try {
            const fromYaml: any = yaml.load(text);
            const camelized: any = CamelUtil.camelizeObject(fromYaml);
            if (camelized?.apiVersion && camelized.apiVersion.startsWith('camel.apache.org') && camelized.kind) {
                if (camelized.kind === 'Integration') {
                    return 'crd';
                } else if (camelized.kind === 'Kamelet') {
                    return 'kamelet';
                }
            } else if (Array.isArray(camelized)) {
                return 'plain';
            } else {
                return 'none';
            }
        } catch (e) {
        }
        return 'none';
    };
    static flowsToCamelElements = (flows: any[]): any[] => {
        const result: any[] = [];
        flows.filter((e: any) => e.hasOwnProperty('restConfiguration'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRestConfigurationDefinition(f.restConfiguration)));
        flows.filter((e: any) => e.hasOwnProperty('rest'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRestDefinition(f.rest)));
        flows.filter((e: any) => e.hasOwnProperty('routeTemplate'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRouteTemplateDefinition(f.routeTemplate)));
        flows.filter((e: any) => e.hasOwnProperty('route'))
            .forEach((f: any) => result.push(CamelDefinitionYamlStep.readRouteDefinition(f.route)));
        flows.filter((e: any) => e.hasOwnProperty('from'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteDefinition(new RouteDefinition({from: f.from}))));
        flows.filter((e: any) => e.hasOwnProperty('beans'))
            .forEach((b: any) => result.push(CamelDefinitionYaml.readBeanDefinition(b)));
        flows.filter((e: any) => e.hasOwnProperty('routeConfiguration'))
            .forEach((e: any) => result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(e.routeConfiguration)));
        flows.filter((e: any) => e.hasOwnProperty('errorHandler'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(new RouteConfigurationDefinition({errorHandler: f.errorHandler}))));
        flows.filter((e: any) => e.hasOwnProperty('onException'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(new RouteConfigurationDefinition({onException: f.onException}))));
        flows.filter((e: any) => e.hasOwnProperty('intercept'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(new RouteConfigurationDefinition({intercept: f.intercept}))));
        flows.filter((e: any) => e.hasOwnProperty('interceptFrom'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(new RouteConfigurationDefinition({interceptFrom: f.interceptFrom}))));
        flows.filter((e: any) => e.hasOwnProperty('interceptSendToEndpoint'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(new RouteConfigurationDefinition({interceptSendToEndpoint: f.interceptSendToEndpoint}))));
        flows.filter((e: any) => e.hasOwnProperty('onCompletion'))
            .forEach((f: any) =>  result.push(CamelDefinitionYamlStep.readRouteConfigurationDefinition(new RouteConfigurationDefinition({onCompletion: f.onCompletion}))));

        return result;
    };

    static readBeanDefinition = (beans: any): Beans => {
        const result: Beans = new Beans();
        for (const bean of beans.beans) {
            const props: any = {};
            if (bean && bean.properties) {
                // convert map style to properties if requires
                for (const [key, value] of Object.entries(bean.properties)) {
                    CamelDefinitionYaml.flatMapProperty(key, value, new Map<string, any>()).forEach(
                        (v, k) => (props[k] = v),
                    );
                }
            }
            if (bean && bean.property && Array.isArray(bean.property)) {
                // convert map style to properties if requires
                Array.from(bean.property).forEach((val: any) => {
                    props[val.key] = val.value;
                })
                delete bean.property;
            }
            bean.properties = props;
            result.beans.push(new BeanFactoryDefinition(bean));
        }
        return result;
    };

    // convert map style to properties if requires
    static flatMapProperty = (key: string, value: any, properties: Map<string, any>): Map<string, any> => {
        if (value === undefined) {
            return properties;
        }

        if (typeof value === 'object') {
            for (const k in value) {
                const key2 = key + '.' + k;
                const value2: any = value[k];
                CamelDefinitionYaml.flatMapProperty(key2, value2, new Map<string, any>()).forEach((value1, key1) =>
                    properties.set(key1, value1),
                );
            }
        } else {
            properties.set(key, value);
        }
        return properties;
    };

    // add generated Integration YAML into existing Integration YAML
    static addYamlToIntegrationYaml = (
        filename: string,
        camelYaml: string | undefined,
        restYaml: string,
        addREST: boolean,
        addRoutes: boolean,
    ): string => {
        const existing =
            camelYaml !== undefined
                ? CamelDefinitionYaml.yamlToIntegration(filename, camelYaml)
                : Integration.createNew(filename);
        const generated = CamelDefinitionYaml.yamlToIntegration(filename, restYaml);

        const flows: CamelElement[] =
            existing.spec.flows?.filter(f => !['RouteDefinition', 'RestDefinition'].includes(f.dslName)) || [];

        const restE: CamelElement[] = existing.spec.flows?.filter(f => f.dslName === 'RestDefinition') || [];
        const restG: CamelElement[] = generated.spec.flows?.filter(f => f.dslName === 'RestDefinition') || [];

        if (addREST) {
            flows.push(...restG);
        } else {
            flows.push(...restE);
        }

        const routeE: CamelElement[] = existing.spec.flows?.filter(f => f.dslName === 'RouteDefinition') || [];
        const routeG: CamelElement[] = generated.spec.flows?.filter(f => f.dslName === 'RouteDefinition') || [];

        if (addRoutes) {
            flows.push(...routeG);
        } else {
            flows.push(...routeE);
        }

        existing.spec.flows = flows;
        return CamelDefinitionYaml.integrationToYaml(existing);
    };
}
