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
import { CamelMetadataApi, ElementMeta, Languages, PropertyMeta } from '../model/CamelMetadata';
import { CamelUtil } from './CamelUtil';
import {
    BeanFactoryDefinition,
    ExpressionDefinition,
    RouteDefinition,
    RestDefinition,
    RouteConfigurationDefinition, FromDefinition,
} from '../model/CamelDefinition';
import { Beans, CamelElement, CamelElementMeta, Integration } from '../model/IntegrationDefinition';
import { CamelDefinitionApi } from './CamelDefinitionApi';

export class ChildElement {
    constructor(public name: string = '', public className: string = '', public multiple: boolean = false) {}
}

export class CamelDefinitionApiExt {
    private constructor() {}

    // additional helper functions for more readability
    private static getFlowsOfType(integration: Integration, type: string): CamelElement[] {
        return integration.spec.flows?.filter(flow => flow.dslName === type) ?? [];
    }

    private static getFlowsNotOfTypes(integration: Integration, types: string[]): any[] {
        return integration.spec.flows?.filter(flow => !types.includes(flow.dslName)) ?? [];
    }

    static replaceFromInIntegration = (integration: Integration, fromId: string, newFrom: FromDefinition): Integration => {
        const flows: any = [];
        CamelDefinitionApiExt.getFlowsNotOfTypes(integration, ['RouteDefinition']).forEach(bean =>
            flows.push(bean),
        );
        CamelDefinitionApiExt.getFlowsOfType(integration, 'RouteDefinition').map(flow => {
            const route = (flow as RouteDefinition);
            if (route.from.id === fromId) {
                newFrom.steps = [...route.from.steps];
                route.from = newFrom;
                flows.push(route);
            } else {
                flows.push(route);
            }
        })
        integration.spec.flows = flows;
        return integration;
    };

    static addStepToIntegration = (integration: Integration, step: CamelElement, parentId: string, position?: number,): Integration => {
        if (step.dslName === 'RouteDefinition') {
            integration.spec.flows?.push(step as RouteDefinition);
        } else {
            const flows: any = [];
            CamelDefinitionApiExt.getFlowsNotOfTypes(integration, ['RouteConfigurationDefinition', 'RouteDefinition']).forEach(bean =>
                flows.push(bean),
            );
            const routes = CamelDefinitionApiExt.addStepToSteps(CamelDefinitionApiExt.getFlowsOfType(integration, 'RouteDefinition'), step, parentId, position,);
            flows.push(...routes);
            const routeConfigurations = CamelDefinitionApiExt.addStepToSteps(
                CamelDefinitionApiExt.getFlowsOfType(integration, 'RouteConfigurationDefinition'),step, parentId, position,);
            flows.push(...routeConfigurations);
            integration.spec.flows = flows;
        }
        return integration;
    }; 

    static addStepToStep = (step: CamelElement, stepAdded: CamelElement, parentId: string, position: number = -1,): CamelElement => {
        const result = CamelUtil.cloneStep(step);
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(result.dslName);
        let added = false;

        // Check all fields except steps
        for (const child of children.filter(child => child.name !== 'steps') ?? []) {
            if (result.uuid === parentId) {
                if (child.className === stepAdded.dslName) {
                    added = true;
                    if (child.multiple) {
                        (result as any)[child.name].push(stepAdded);
                    } else {
                        (result as any)[child.name] = stepAdded;
                    }
                }
            } else {
                const fieldValue = (result as any)[child.name];
                if (child.multiple) {
                    (result as any)[child.name] = CamelDefinitionApiExt.addStepToSteps((result as any)[child.name], stepAdded, parentId, position,);
                } else if (fieldValue) {
                    (result as any)[child.name] = CamelDefinitionApiExt.addStepToStep(fieldValue, stepAdded, parentId, position);
                }
            }
        }

        // Then steps
        const steps = children.filter(child => child.name === 'steps');
        if (!added && steps && result.uuid === parentId) {
            if (position > -1) {
                (result as any).steps.splice(position, 0, stepAdded);
            } else {
                (result as any).steps.push(stepAdded);
            }
        } else if (!added && steps && (result as any).steps) {
            (result as any).steps = CamelDefinitionApiExt.addStepToSteps((result as any).steps, stepAdded, parentId, position);
        }

        return result;
    };
    
    static addStepToSteps = (steps: CamelElement[], step: CamelElement, parentId: string, position?: number,): CamelElement[] => {
        const result: CamelElement[] = [];
        for (const element of steps) {
            const newStep = CamelDefinitionApiExt.addStepToStep(element, step, parentId, position);
            result.push(newStep);
        }
        return result;
    };

    static findElementInIntegration = (integration: Integration, uuid: string): CamelElement | undefined => {
        return CamelDefinitionApiExt.findElementMetaInIntegration(integration, uuid)?.step;
    };

    static findElementMetaInIntegration = (integration: Integration, uuid: string): CamelElementMeta => {
        const i = CamelUtil.cloneIntegration(integration);
        const routes = i.spec.flows?.filter(flow =>
            ['RouteConfigurationDefinition', 'RouteDefinition'].includes(flow.dslName),
        );
        return CamelDefinitionApiExt.findElementInElements(routes, uuid);
    };

    static findElementPathUuids = (integration: Integration, uuid: string): string[] => {
        const result: string[] = [];
        let meta = CamelDefinitionApiExt.findElementMetaInIntegration(integration, uuid);
        if (meta && meta.parentUuid) {
            while (meta.step?.dslName !== 'FromDefinition') {
                if (meta.parentUuid) {
                    result.push(meta.parentUuid);
                    meta = CamelDefinitionApiExt.findElementMetaInIntegration(integration, meta.parentUuid);
                } else {
                    break;
                }
            }
        }
        return result;
    };

    static findElementInElements = (steps: CamelElement[] | undefined, uuid: string, result: CamelElementMeta = new CamelElementMeta(undefined, undefined, undefined),
                                    parentUuid?: string,): CamelElementMeta => {
        if (result?.step !== undefined) {
            return result;
        }

        if (steps !== undefined) {
            for (let index = 0, step: CamelElement; (step = steps[index]); index++) {
                if (step.uuid === uuid) {
                    result = new CamelElementMeta(step, parentUuid, index);
                    break;
                } else {
                    const ce = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
                    for (const e of ce) {
                        const cel = CamelDefinitionApiExt.getElementChildren(step, e);
                        if (e.multiple) {
                            result = CamelDefinitionApiExt.findElementInElements(cel, uuid, result, step.uuid);
                        } else {
                            const prop = (step as any)[e.name];
                            if (prop && prop.hasOwnProperty('uuid')) {
                                result = CamelDefinitionApiExt.findElementInElements([prop], uuid, result, step.uuid);
                            }
                        }
                    }
                }
            }
        }
        return new CamelElementMeta(result?.step, result?.parentUuid, result?.position);
    };

    static hasElementWithId = (integration: Integration, id: string): number => {
        return CamelDefinitionApiExt.checkIfHasId(integration, id, 0);
    };

    static checkIfHasId = (obj: Object, id: string, counter: number): number => {
        for (const propName in obj) {
            let prop = (obj as any)[propName];
            if (propName === 'id' && id === prop) {
                counter++;
                counter = CamelDefinitionApiExt.checkIfHasId(prop, id, counter);
            } else if (typeof prop === 'object' && prop !== null) {
                counter = CamelDefinitionApiExt.checkIfHasId(prop, id, counter);
            } else if (Array.isArray(prop)) {
                for (const element of prop) {
                    CamelDefinitionApiExt.checkIfHasId(element, id, counter);
                }
            }
        }
        return counter;
    };

    static moveRouteElement = (integration: Integration, source: string, target: string, asChild: boolean,): Integration => {
        const sourceFindStep = CamelDefinitionApiExt.findElementMetaInIntegration(integration, source);
        const sourceStep = sourceFindStep.step;
        const sourceUuid = sourceStep?.uuid;
        const targetFindStep = CamelDefinitionApiExt.findElementMetaInIntegration(integration, target);
        const parentUuid = targetFindStep.parentUuid;
        if (sourceUuid && parentUuid && sourceStep && !CamelDefinitionApiExt.findElementPathUuids(integration, target).includes(source)) {
            CamelDefinitionApiExt.deleteStepFromIntegration(integration, sourceUuid);
            if (asChild) {
                return CamelDefinitionApiExt.addStepToIntegration(
                    integration,
                    sourceStep,
                    target,
                    (targetFindStep?.step as any)?.steps?.length,
                );
            } else {
                switch (targetFindStep.step?.dslName) {
                    case 'when':
                        return CamelDefinitionApiExt.addStepToIntegration(integration, sourceStep, targetFindStep.step?.uuid, undefined);
                    case 'otherwise':
                        return CamelDefinitionApiExt.addStepToIntegration(integration, sourceStep, targetFindStep.step?.uuid, undefined);
                    default:
                        return CamelDefinitionApiExt.addStepToIntegration(integration, sourceStep, parentUuid, targetFindStep.position);
                }
            }
        }
        return integration;
    };

    static deleteStepFromIntegration = (integration: Integration, uuidToDelete: string): Integration => {
        const flows: any[] =
            integration.spec.flows?.filter(
                flow => !['RouteConfigurationDefinition', 'RouteDefinition'].includes(flow.dslName),
            ) ?? [];
        const routes = CamelDefinitionApiExt.deleteStepFromSteps(
            integration.spec.flows?.filter(flow =>
                ['RouteConfigurationDefinition', 'RouteDefinition'].includes(flow.dslName),
            ),
            uuidToDelete,
        );
        flows.push(...routes);
        integration.spec.flows = flows;
        return integration;
    };

    static deleteStepFromStep = (step: CamelElement, uuidToDelete: string): CamelElement => {
        const result = CamelDefinitionApi.createStep(step.dslName, step);
        const ce = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        for (const e of ce) {
            const cel = CamelDefinitionApiExt.getElementChildren(step, e);
            if (e.multiple) {
                (result as any)[e.name] = CamelDefinitionApiExt.deleteStepFromSteps((result as any)[e.name], uuidToDelete);
            } else {
                const prop = (result as any)[e.name];
                if (prop?.hasOwnProperty('uuid')) {
                    if (prop.uuid === uuidToDelete) {
                        delete (result as any)[e.name];
                    } else {
                        (result as any)[e.name] = CamelDefinitionApiExt.deleteStepFromStep(cel[0], uuidToDelete);
                    }
                }
            }
        }
        return result;
    };

    static deleteStepFromSteps = (steps: CamelElement[] | undefined, uuidToDelete: string): CamelElement[] => {
        const result: CamelElement[] = [];
        if (steps !== undefined) {
            for (const step of steps) {
                if (step.uuid !== uuidToDelete) {
                    const newStep = CamelDefinitionApiExt.deleteStepFromStep(step, uuidToDelete);
                    result.push(newStep);
                }
            }
        }
        return result;
    };

    static addBeanToIntegration = (integration: Integration, bean: BeanFactoryDefinition): Integration => {
        const flows: any[] = [];
        const beans: Beans[] = integration.spec.flows?.filter(flow => flow.dslName === 'Beans') ?? [];
        if (integration.spec.flows && beans.length === 0) {
            flows.push(...integration.spec.flows);
            flows.push(new Beans({ beans: [bean] }));
        } else {
            flows.push(...integration.spec.flows?.filter(flow => flow.dslName !== 'Beans') ?? []);
            for (const flow of beans) {
                const beans: BeanFactoryDefinition[] = [];
                if ((flow as Beans).beans.filter(b => b.uuid === bean.uuid).length === 0) {
                    beans.push(...(flow as Beans).beans.filter(b => b.uuid !== bean.uuid));
                    beans.push(bean);
                } else {
                    for (const b of (flow as Beans).beans) {
                        if (b.uuid === bean.uuid) beans.push(bean);
                        else beans.push(b);
                    }
                }
                const newBeans = new Beans({ beans: beans });
                flows.push(newBeans);
            }
        }
        integration.spec.flows = flows;
        return integration;
    };

    static deleteBeanFromIntegration = (integration: Integration, bean?: BeanFactoryDefinition): Integration => {
        const flows: any[] = [];
        for (const flow of integration.spec.flows ?? []) {
            if (flow.dslName === 'Beans') {
                const beans: BeanFactoryDefinition[] = (flow as Beans).beans.filter(
                    b => !(b.uuid === bean?.uuid && b.type === bean?.type),
                );
                if (beans.length > 0) {
                    const newBeans = new Beans({ beans: beans });
                    flows.push(newBeans);
                }
            } else {
                flows.push(flow);
            }
        }
        integration.spec.flows = flows;
        return integration;
    };

    static addRouteConfigurationToIntegration = (
        integration: Integration,
        routeConfiguration: RouteConfigurationDefinition,
    ): Integration => {
        integration.spec.flows?.push(routeConfiguration);
        return integration;
    };

    static deleteRouteConfigurationFromIntegration = (
        integration: Integration,
        routeConfiguration: RouteConfigurationDefinition,
    ): Integration => {
        const newFlows: any[] = [];
        const flows: any[] = integration.spec.flows ?? [];
        newFlows.push(...flows.filter(flow => flow.dslName !== 'RouteConfigurationDefinition'));
        newFlows.push(
            ...flows.filter(
                flow => flow.dslName === 'RouteConfigurationDefinition' && flow.uuid !== routeConfiguration.uuid,
            ),
        );
        integration.spec.flows = newFlows;
        return integration;
    };

    static updateRouteConfigurationToIntegration = (integration: Integration, e: CamelElement): Integration => {
        const elementClone = CamelUtil.cloneStep(e);
        const integrationClone: Integration = CamelUtil.cloneIntegration(integration);

        integrationClone.spec.flows = integration.spec.flows?.map(flow => {
            if (flow.dslName === 'RouteConfigurationDefinition') {
                const route = CamelDefinitionApiExt.updateElement(flow, elementClone) as RouteConfigurationDefinition;
                return CamelDefinitionApi.createRouteConfigurationDefinition(route);
            }
            return flow;
        });
        return integrationClone;
    };

    static addRestToIntegration = (integration: Integration, rest: RestDefinition): Integration => {
        integration.spec.flows?.push(rest);
        return integration;
    };

    static addRestMethodToIntegration = (
        integration: Integration,
        method: CamelElement,
        restUuid: string,
    ): Integration => {
        const flows: any[] = [];
        const methodFunctions: { [key: string]: (rest: RestDefinition, method: CamelElement) => void } = {
            GetDefinition: (rest: RestDefinition, method: CamelElement) => {
                rest.get = CamelDefinitionApiExt.addRestMethodToRestMethods(rest.get, method);
            },
            PostDefinition: (rest: RestDefinition, method: CamelElement) => {
                rest.post = CamelDefinitionApiExt.addRestMethodToRestMethods(rest.post, method);
            },
            PutDefinition: (rest: RestDefinition, method: CamelElement) => {
                rest.put = CamelDefinitionApiExt.addRestMethodToRestMethods(rest.put, method);
            },
            PatchDefinition: (rest: RestDefinition, method: CamelElement) => {
                rest.patch = CamelDefinitionApiExt.addRestMethodToRestMethods(rest.patch, method);
            },
            DeleteDefinition: (rest: RestDefinition, method: CamelElement) => {
                rest.delete = CamelDefinitionApiExt.addRestMethodToRestMethods(rest.delete, method);
            },
            HeadDefinition: (rest: RestDefinition, method: CamelElement) => {
                rest.head = CamelDefinitionApiExt.addRestMethodToRestMethods(rest.head, method);
            },
        };

        for (let flow of integration.spec.flows ?? []) {
            if (flow.dslName === 'RestDefinition') {
                if (flow.uuid !== restUuid) {
                    flows.push(flow);
                } else {
                    if (method.dslName in methodFunctions) {
                        methodFunctions[method.dslName](flow, method);
                    }
                    flows.push(flow);
                }
            } else {
                flows.push(flow);
            }
        }

        integration.spec.flows = flows;
        return integration;
    };

    static addRestMethodToRestMethods = (methods: CamelElement[] = [], method: CamelElement): CamelElement[] => {
        const elements: CamelElement[] = [];
        for (const e of methods) {
            if (e.uuid === method.uuid) {
                elements.push(method);
            } else {
                elements.push(e);
            }
        }
        if (elements.filter(e => e.uuid === method.uuid).length === 0) {
            elements.push(method);
        }
        return elements;
    };

    static findRestMethodParent = (integration: Integration, method: CamelElement): string | undefined => {
        const rests: RestDefinition[] = integration.spec.flows?.filter(flow => flow.dslName === 'RestDefinition') ?? [];
        const methodTypes = ['get', 'post', 'put', 'patch', 'delete', 'head'];

        for (const rest of rests) {
            for (const type of methodTypes) {
                if (
                    method.dslName.toLowerCase() === `${type}definition` &&
                    (rest as any)[type]?.find((m: any) => m.uuid === method.uuid)
                ) {
                    return rest.uuid;
                }
            }
        }
    };

    static deleteRestConfigurationFromIntegration = (integration: Integration): Integration => {
        const flows: any[] = [];

        for (const flow of integration.spec.flows ?? []) {
            if (flow.dslName !== 'RestConfigurationDefinition') {
                flows.push(flow);
            }
        }

        integration.spec.flows = flows;
        return integration;
    };

    static deleteRestFromIntegration = (integration: Integration, restUuid?: string): Integration => {
        const flows: any[] = [];

        for (const flow of integration.spec.flows ?? []) {
            if (flow.dslName !== 'RestDefinition' || flow.uuid !== restUuid) {
                flows.push(flow);
            }
        }

        integration.spec.flows = flows;
        return integration;
    };

    static deleteRestMethodFromIntegration = (integration: Integration, methodUuid?: string): Integration => {
        const flows: any[] = [];
        const methods = ['get', 'post', 'put', 'patch', 'delete', 'head'];

        for (const flow of integration.spec.flows ?? []) {
            if (flow.dslName === 'RestDefinition') {
                for (const method of methods) {
                    if (flow[method]) {
                        flow[method] = flow[method].filter((item: any) => item.uuid !== methodUuid);
                    }
                }
            }
            flows.push(flow);
        }

        integration.spec.flows = flows;
        return integration;
    };

    static getExpressionLanguageName = (expression: ExpressionDefinition | undefined): string | undefined => {
        let result: string | undefined = undefined;
        if (expression) {
            for (const fieldName in expression) {
                if ((expression as any)[fieldName] === undefined) {
                    continue;
                }

                const lang = Languages.find((value: [string, string, string]) => value[0] === fieldName);
                if (lang) {
                    const camelLangMetadata = CamelMetadataApi.getCamelLanguageMetadataByName(lang[0]);
                    if (camelLangMetadata?.name) {
                        result = camelLangMetadata.name;
                        break;
                    }
                }
            }
        }
        return result;
    };

    static getExpressionLanguageClassName = (expression: ExpressionDefinition | undefined): string | undefined => {
        let result: string | undefined = undefined;
        if (expression) {
            for (const fieldName in expression) {
                if ((expression as any)[fieldName] === undefined) {
                    continue;
                }

                const lang = Languages.find((value: [string, string, string]) => value[0] === fieldName);
                if (lang) {
                    const camelLangMetadata = CamelMetadataApi.getCamelLanguageMetadataByName(lang[0]);
                    if (camelLangMetadata?.className) {
                        result = camelLangMetadata.className;
                        break;
                    }
                }
            }
        }
        return result;
    };

    static getDataFormat = (element: CamelElement | undefined): ElementMeta | undefined => {
        let result: ElementMeta | undefined = undefined;
        if (element) {
            Object.keys(element).forEach(fieldName => {
                const df = CamelMetadataApi.getCamelDataFormatMetadataByName(fieldName);
                result =  (element as any)[fieldName] ? df : result;
            });
        }
        return result;
    }

    static getExpressionValue = (expression: ExpressionDefinition | undefined): CamelElement | undefined => {
        const language = CamelDefinitionApiExt.getExpressionLanguageName(expression);
        if (language) {
            return (expression as any)[language];
        } else {
            return undefined;
        }
    };

    static updateIntegrationRestElement = (integration: Integration, e: CamelElement): Integration => {
        const int: Integration = CamelUtil.cloneIntegration(integration);
        const flows: CamelElement[] = [];

        const methods = ['get', 'post', 'put', 'patch', 'delete', 'head'];

        const isRest = (flow: any) => flow.dslName === 'RestDefinition' && flow.uuid === e.uuid;
        const isRestConfig = (flow: any) => flow.dslName === 'RestConfigurationDefinition' && flow.uuid === e.uuid;

        const isSingleRest = integration.spec.flows?.filter(isRest).length === 1;
        const isSingleRestConfig = integration.spec.flows?.filter(isRestConfig).length === 1;

        for (const flow of integration.spec.flows ?? []) {
            if ((isSingleRest && isRest(flow)) || (isSingleRestConfig && isRestConfig(flow))) {
                flows.push(CamelUtil.cloneStep(e));
            } else if (flow.dslName === 'RestDefinition') {
                for (const method of methods) {
                    if (flow[method]) {
                        for (let i = 0; i < flow[method].length; i++) {
                            if (flow[method][i].uuid === e.uuid) {
                                flow[method][i] = e;
                            }
                        }
                    }
                }
                flows.push(flow);
            } else {
                flows.push(flow);
            }
        }

        int.spec.flows = flows;
        return int;
    };

    static updateIntegrationRouteElement = (integration: Integration, e: CamelElement): Integration => {
        const elementClone = CamelUtil.cloneStep(e);
        const int: Integration = CamelUtil.cloneIntegration(integration);
        const flows: CamelElement[] = [];

        for (const flow of integration.spec.flows ?? []) {
            if (flow.dslName === 'RouteDefinition') {
                const route = CamelDefinitionApiExt.updateElement(flow, elementClone) as RouteDefinition;
                flows.push(CamelDefinitionApi.createRouteDefinition(route));
            } else if (flow.dslName === 'RouteConfigurationDefinition') {
                const routeConfiguration = CamelDefinitionApiExt.updateElement(flow, elementClone) as RouteConfigurationDefinition;
                flows.push(CamelDefinitionApi.createRouteConfigurationDefinition(routeConfiguration));
            } else {
                flows.push(flow);
            }
        }

        int.spec.flows = flows;
        return int;
    };

    static updateIntegrationBeanElement = (integration: Integration, e: CamelElement): Integration => {
        const elementClone = CamelUtil.cloneStep(e);
        const int: Integration = CamelUtil.cloneIntegration(integration);
        const flows: CamelElement[] = [];

        for (const flow of integration.spec.flows ?? []) {
            if (flow.dslName === 'Beans') {
                const route = CamelDefinitionApiExt.updateElement(flow, elementClone) as BeanFactoryDefinition;
                flows.push(CamelDefinitionApi.createBeanFactoryDefinition(route));
            } else {
                flows.push(flow);
            }
        }

        int.spec.flows = flows;
        return int;
    };

    static updateElement = (element: CamelElement, e: CamelElement): CamelElement => {
        if (element.uuid === e.uuid) {
            return e;
        }
        const result: any = { ...element };
        for (const key in result) {
            if (result[key] instanceof CamelElement) {
                result[key] = CamelDefinitionApiExt.updateElement(result[key], e);
            } else if (Array.isArray(result[key])) {
                result[key] = CamelDefinitionApiExt.updateElements(result[key], e);
            }
        }
        return result as CamelElement;
    };

    static updateElements = (elements: CamelElement[], e: CamelElement): CamelElement[] => {
        const result: any[] = [];
        for (const element of elements) {
            if (typeof element === 'object') {
                const newElement = CamelDefinitionApiExt.updateElement(element, e);
                result.push(newElement);
            } else {
                result.push(element);
            }
        }
        return result;
    };

    static getElementProperties = (className: string | undefined): PropertyMeta[] => {
        const result: PropertyMeta[] = [];
        let uri: any = undefined;
        let expression: any = undefined;
        let parameters: any = undefined;

        if (className) {
            const properties =
                className.endsWith('Definition') || className.endsWith('BuilderRef') || className.endsWith('Config')
                    ? CamelMetadataApi.getCamelModelMetadataByClassName(className)?.properties
                    : className.endsWith('DataFormat')
                    ? CamelMetadataApi.getCamelDataFormatMetadataByClassName(className)?.properties
                    : CamelMetadataApi.getCamelLanguageMetadataByClassName(className)?.properties;

            if (properties) {
                for (const p of properties.filter(p => p.name !== 'steps' && p.name !== 'configurationRef')) {
                    switch (p.name) {
                        case 'uri':
                            uri = p;
                            break;
                        case 'expression':
                            expression = p;
                            break;
                        case 'parameters':
                            parameters = p;
                            break;
                        default:
                            result.push(p);
                    }
                }
            }
        }

        if (uri) {
            result.unshift(uri);
        }
        if (expression) {
            result.unshift(expression);
        }
        if (parameters) {
            result.push(parameters);
        }

        return result;
    };

    static getElementPropertiesByName = (name: string): PropertyMeta[] => {
        const model = CamelMetadataApi.getCamelModelMetadataByName(name);
        if (model) {
            return CamelDefinitionApiExt.getElementProperties(model.className);
        }
        const language = CamelMetadataApi.getCamelLanguageMetadataByName(name);
        if (language) {
            return CamelDefinitionApiExt.getElementProperties(language.className);
        }
        const dataFormat = CamelMetadataApi.getCamelDataFormatMetadataByName(name);
        if (dataFormat) {
            return CamelDefinitionApiExt.getElementProperties(dataFormat.className);
        }
        return [];
    };

    static getParametersValue = (element: CamelElement | undefined, propertyName: string, pathParameter?: boolean): any => {
        if (element && (element as any).parameters) {
            return (element as any).parameters[propertyName];
        }
    };

    static getElementChildrenDefinition = (dslName: string): ChildElement[] => {
        const result: ChildElement[] = [];
        const meta = CamelMetadataApi.getCamelModelMetadataByClassName(dslName);

        if (meta) {
            for (const property of meta.properties) {
                if (property.isObject && CamelMetadataApi.getCamelModelMetadataByClassName(property.type)) {
                    result.push(new ChildElement(property.name, property.type, property.isArray));
                }
            }
        }

        if (CamelDefinitionApi.createStep(dslName, {}).hasSteps())
            result.push(new ChildElement('steps', 'CamelElement', true));
        return result;
    };

    static getElementChildren = (element: CamelElement, child: ChildElement): CamelElement[] => {
        let children = (element as any)[child.name];
        if (!Array.isArray(children)) {
            children = children ? [children] : [];
        }
        return children;
    };
}
