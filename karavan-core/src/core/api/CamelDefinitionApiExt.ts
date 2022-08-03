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
import {CamelMetadataApi, ElementMeta, Languages, PropertyMeta} from "../model/CamelMetadata";
import {ComponentApi} from "./ComponentApi";
import {CamelUtil} from "./CamelUtil";
import {
    NamedBeanDefinition,
    ExpressionDefinition, RouteDefinition, RestDefinition, RestConfigurationDefinition
} from "../model/CamelDefinition";
import {
    Beans,
    CamelElement, CamelElementMeta,
    Integration
} from "../model/IntegrationDefinition";
import {CamelDefinitionApi} from "./CamelDefinitionApi";

export class ChildElement {
    name: string = ''
    className: string = ''
    multiple: boolean = false

    constructor(name: string, className: string, multiple: boolean) {
        this.name = name;
        this.className = className;
        this.multiple = multiple;
    }
}

export class CamelDefinitionApiExt {

    static addStepToIntegration = (integration: Integration, step: CamelElement, parentId: string, position?: number): Integration => {
        if (step.dslName === 'RouteDefinition') {
            integration.spec.flows?.push(step as RouteDefinition);
        } else {
            const flows: any[] = [];
            integration.spec.flows?.filter(flow => flow.dslName !== 'RouteDefinition').forEach(bean => flows.push(bean));
            const routes = CamelDefinitionApiExt.addStepToSteps(integration.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition') || [], step, parentId, position);
            flows.push(...routes);
            integration.spec.flows = flows;
        }
        return integration;
    }

    static addStepToStep = (step: CamelElement, stepAdded: CamelElement, parentId: string, position: number = -1): CamelElement => {
        const result = CamelUtil.cloneStep(step);
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(result.dslName);
        let added = false;
        // Check all fields except steps
        children.filter(child => child.name !== 'steps').forEach(child => {
            if (result.uuid === parentId) {
                if (child.className === stepAdded.dslName) {
                    added = true;
                    if (child.multiple) (result as any)[child.name].push(stepAdded)
                    else (result as any)[child.name] = stepAdded;
                }
            } else {
                const fieldValue = (result as any)[child.name];
                if (child.multiple) (result as any)[child.name] = CamelDefinitionApiExt.addStepToSteps((result as any)[child.name], stepAdded, parentId, position);
                else if (fieldValue) (result as any)[child.name] = CamelDefinitionApiExt.addStepToStep(fieldValue, stepAdded, parentId, position);
            }
        });
        // Then steps
        const steps = children.filter(child => child.name === 'steps');
        if (!added && steps && result.uuid === parentId) {
            if (position > -1) (result as any).steps.splice(position, 0, stepAdded);
            else (result as any).steps.push(stepAdded);
        } else if (!added && steps && (result as any).steps) {
            (result as any).steps = CamelDefinitionApiExt.addStepToSteps((result as any).steps, stepAdded, parentId, position);
        }
        return result;
    }

    static addStepToSteps = (steps: CamelElement[], step: CamelElement, parentId: string, position?: number): CamelElement[] => {
        const result: CamelElement[] = [];
        steps.forEach(el => {
            const newStep = CamelDefinitionApiExt.addStepToStep(el, step, parentId, position);
            result.push(newStep);
        })
        return result;
    }

    static findElementInIntegration = (integration: Integration, uuid: string): CamelElement | undefined => {
        const meta = CamelDefinitionApiExt.findStep(integration.spec.flows, uuid);
        return meta.step;
    }

    static findStep = (steps: CamelElement[] | undefined, uuid: string, result: CamelElementMeta = new CamelElementMeta(undefined, undefined, undefined, []), parentUuid?: string): CamelElementMeta => {
        if (result?.step !== undefined) return result;
        if (steps !== undefined) {
            for (let index = 0, step: CamelElement; step = steps[index]; index++) {
                if (step.uuid === uuid) {
                    const p = [...result.pathUuids];
                    p.push(step.uuid);
                    result = new CamelElementMeta(step, parentUuid, index, p);
                    break;
                } else {
                    const ce = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
                    ce.forEach(e => {
                        const cel = CamelDefinitionApiExt.getElementChildren(step, e);
                        if (e.multiple) {
                            result = CamelDefinitionApiExt.findStep(cel, uuid, result, step.uuid);
                            result.pathUuids.push(step.uuid);
                        } else {
                            const prop = (step as any)[e.name];
                            if (prop && prop.hasOwnProperty("uuid")) {
                                result = CamelDefinitionApiExt.findStep([prop], uuid, result, prop.uuid);
                                result.pathUuids.push(prop.uuid);
                            }
                        }
                    })
                }
            }
        }
        return new CamelElementMeta(result?.step, result?.parentUuid, result?.position, result?.pathUuids);
    }

    static moveRouteElement = (integration: Integration, source: string, target: string): Integration => {
        const routes = integration.spec.flows?.filter(f => f.dslName === 'RouteDefinition');
        const sourceFindStep = CamelDefinitionApiExt.findStep(routes, source);
        const sourceStep = sourceFindStep.step;
        const sourceUuid = sourceStep?.uuid;
        const targetFindStep = CamelDefinitionApiExt.findStep(routes, target);
        const parentUuid = targetFindStep.parentUuid;
        if (sourceUuid && parentUuid && sourceStep && !targetFindStep.pathUuids.includes(source)) {
            CamelDefinitionApiExt.deleteStepFromIntegration(integration, sourceUuid);
            switch (targetFindStep.step?.dslName) {
                case 'when':
                    return CamelDefinitionApiExt.addStepToIntegration(integration, sourceStep, targetFindStep.step?.uuid, undefined);
                case 'otherwise':
                    return CamelDefinitionApiExt.addStepToIntegration(integration, sourceStep, targetFindStep.step?.uuid, undefined);
                default:
                    return CamelDefinitionApiExt.addStepToIntegration(integration, sourceStep, parentUuid, targetFindStep.position);
            }
        }
        return integration;
    }

    static deleteStepFromIntegration = (integration: Integration, uuidToDelete: string): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.filter(flow => flow.dslName !== 'RouteDefinition').forEach(x => flows.push(x));
        const routes = CamelDefinitionApiExt.deleteStepFromSteps(integration.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition'), uuidToDelete);
        flows.push(...routes);
        integration.spec.flows = flows;
        return integration;
    }

    static deleteStepFromStep = (step: CamelElement, uuidToDelete: string): CamelElement => {
        const result = CamelDefinitionApi.createStep(step.dslName, step);
        const ce = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        ce.forEach(e => {
            const cel = CamelDefinitionApiExt.getElementChildren(step, e);
            if (e.multiple) {
                (result as any)[e.name] = CamelDefinitionApiExt.deleteStepFromSteps((result as any)[e.name], uuidToDelete);
            } else {
                const prop = (result as any)[e.name];
                if (prop && prop.hasOwnProperty("uuid")) {
                    if (prop.uuid === uuidToDelete) {
                        delete (result as any)[e.name]
                    } else {
                        (result as any)[e.name] = CamelDefinitionApiExt.deleteStepFromStep(cel[0], uuidToDelete);
                    }
                }
            }
        })
        return result;
    }

    static deleteStepFromSteps = (steps: CamelElement[] | undefined, uuidToDelete: string): CamelElement[] => {
        const result: CamelElement[] = []
        if (steps !== undefined) {
            steps.forEach(step => {
                if (step.uuid !== uuidToDelete) {
                    step = CamelDefinitionApiExt.deleteStepFromStep(step, uuidToDelete);
                    result.push(step);
                }
            })
        }
        return result
    }

    static addBeanToIntegration = (integration: Integration, bean: NamedBeanDefinition): Integration => {
        const flows: any[] = [];
        if (integration.spec.flows?.filter(flow => flow.dslName === 'Beans').length === 0) {
            flows.push(...integration.spec.flows);
            flows.push(new Beans({beans: [bean]}))
        } else {
            flows.push(...integration.spec.flows?.filter(flow => flow.dslName !== 'Beans') || []);
            integration.spec.flows?.filter(flow => flow.dslName === 'Beans').forEach(flow => {
                const beans: NamedBeanDefinition[] = [];
                if ((flow as Beans).beans.filter(b => b.uuid === bean.uuid).length === 0) {
                    beans.push(...(flow as Beans).beans.filter(b => b.uuid !== bean.uuid));
                    beans.push(bean);
                } else {
                    (flow as Beans).beans.forEach(b => {
                        if (b.uuid === bean.uuid) beans.push(bean)
                        else beans.push(b);
                    })
                }
                const newBeans = new Beans({beans: beans});
                flows.push(newBeans);
            })
        }
        integration.spec.flows = flows;
        return integration;
    }

    static deleteBeanFromIntegration = (integration: Integration, bean?: NamedBeanDefinition): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.forEach(flow => {
            if (flow.dslName === 'Beans') {
                const beans = (flow as Beans).beans.filter(b => !(b.uuid === bean?.uuid && b.type === bean?.type));
                const newBeans = new Beans({beans: beans});
                flows.push(newBeans);
            } else {
                flows.push(flow);
            }
        })
        integration.spec.flows = flows;
        return integration;
    }

    static addRestToIntegration = (integration: Integration, rest: RestDefinition): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.push(rest)
        return integration;
    }

    static addRestMethodToIntegration = (integration: Integration, method: CamelElement, restUuid: string): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.filter(flow => flow.dslName !== 'RestDefinition').forEach(x => flows.push(x));
        integration.spec.flows?.filter(flow => flow.dslName === 'RestDefinition').forEach((rest: RestDefinition) => {
            if (rest.uuid !== restUuid) {
                flows.push(rest);
            } else {
                switch (method.dslName) {
                    case 'GetDefinition':
                        rest.get = this.addRestMethodToRestMethods(rest.get, method);
                        break;
                    case 'PostDefinition':
                        rest.post = this.addRestMethodToRestMethods(rest.post, method);
                        break;
                    case 'PutDefinition':
                        rest.put = this.addRestMethodToRestMethods(rest.put, method);
                        break;
                    case 'PatchDefinition':
                        rest.patch = this.addRestMethodToRestMethods(rest.patch, method);
                        break;
                    case 'DeleteDefinition':
                        rest.delete = this.addRestMethodToRestMethods(rest.delete, method);
                        break;
                    case 'HeadDefinition':
                        rest.head = this.addRestMethodToRestMethods(rest.head, method);
                        break;
                }
                flows.push(rest);
            }
        });
        integration.spec.flows = flows;
        return integration;
    }

    static addRestMethodToRestMethods = (methods: CamelElement[] = [], method: CamelElement): CamelElement[] => {
        const elements: CamelElement[] = [];
        methods.forEach(e => {
            if (e.uuid === method.uuid) elements.push(method)
            else elements.push(e);
        })
        if (elements.filter(e => e.uuid === method.uuid).length === 0) elements.push(method);
        return elements;
    }

    static findRestMethodParent = (integration: Integration, method: CamelElement): string | undefined => {
        const rests: RestDefinition[] = integration.spec.flows?.filter(flow => flow.dslName === 'RestDefinition') || [];
        for (let rest of rests) {
            switch (method.dslName) {
                case 'GetDefinition':
                    if (rest.get?.find(m => m.uuid === method.uuid)) return rest.uuid;
                    else break;
                case 'PostDefinition':
                    if (rest.post?.find(m => m.uuid === method.uuid)) return rest.uuid;
                    else break;
                case 'PutDefinition':
                    if (rest.put?.find(m => m.uuid === method.uuid)) return rest.uuid;
                    else break;
                case 'PatchDefinition':
                    if (rest.patch?.find(m => m.uuid === method.uuid)) return rest.uuid;
                    else break;
                case 'DeleteDefinition':
                    if (rest.delete?.find(m => m.uuid === method.uuid)) return rest.uuid;
                    else break;
                case 'HeadDefinition':
                    if (rest.head?.find(m => m.uuid === method.uuid)) return rest.uuid;
                    else break;
            }
        }
    }

    static deleteRestConfigurationFromIntegration = (integration: Integration): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.filter(flow => flow.dslName !== 'RestConfigurationDefinition').forEach(x => flows.push(x));
        integration.spec.flows = flows;
        return integration;
    }

    static deleteRestFromIntegration = (integration: Integration, restUuid?: string): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.filter(flow => flow.dslName !== 'RestDefinition').forEach(x => flows.push(x));
        integration.spec.flows?.filter(flow => flow.dslName === 'RestDefinition' && flow.uuid !== restUuid).forEach(x => flows.push(x));
        integration.spec.flows = flows;
        return integration;
    }

    static deleteRestMethodFromIntegration = (integration: Integration, methodUuid?: string): Integration => {
        const flows: any[] = [];
        integration.spec.flows?.filter(flow => flow.dslName !== 'RestDefinition').forEach(x => flows.push(x));
        integration.spec.flows?.filter(flow => flow.dslName === 'RestDefinition').forEach((rest: RestDefinition) => {
            if (rest.get) rest.get = rest.get.filter(get => get.uuid !== methodUuid);
            if (rest.post) rest.post = rest.post.filter(post => post.uuid !== methodUuid);
            if (rest.put) rest.put = rest.put.filter(put => put.uuid !== methodUuid);
            if (rest.patch) rest.patch = rest.patch.filter(patch => patch.uuid !== methodUuid);
            if (rest.delete) rest.delete = rest.delete.filter(del => del.uuid !== methodUuid);
            if (rest.head) rest.head = rest.head.filter(head => head.uuid !== methodUuid);
            flows.push(rest);
        });
        integration.spec.flows = flows;
        return integration;
    }

    static getExpressionLanguageName = (expression: ExpressionDefinition | undefined): string | undefined => {
        let result: string | undefined = undefined;
        if (expression) {
            Object.keys(expression).forEach(fieldName => {
                const lang = Languages.find((value: [string, string, string]) => value[0] === fieldName);
                const val = lang ? lang[0] : undefined;
                result = val ? CamelMetadataApi.getCamelLanguageMetadataByName(val)?.name : result;
            });
        }
        return result;
    }

    static getExpressionLanguageClassName = (expression: ExpressionDefinition | undefined): string | undefined => {
        let result: string | undefined = undefined;
        if (expression) {
            Object.keys(expression).forEach(fieldName => {
                const lang = Languages.find((value: [string, string, string]) => value[0] === fieldName);
                const val = lang ? lang[0] : undefined;
                result = val ? CamelMetadataApi.getCamelLanguageMetadataByName(val)?.className : result;
            });
        }
        return result;
    }

    static getDataFormat = (element: CamelElement | undefined): ElementMeta | undefined => {
        let result: ElementMeta | undefined = undefined;
        if (element) {
            Object.keys(element).forEach(fieldName => {
                const df = CamelMetadataApi.getCamelDataFormatMetadataByName(fieldName);
                result = df ? df : result;
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
    }

    static updateIntegrationRestElement = (integration: Integration, e: CamelElement): Integration => {
        const int: Integration = CamelUtil.cloneIntegration(integration);
        const flows: CamelElement[] = [];
        const isRest = integration.spec.flows?.filter(f => f.dslName === 'RestDefinition' && f.uuid === e.uuid).length === 1;
        const isRestConfiguration = integration.spec.flows?.filter(f => f.dslName === 'RestConfigurationDefinition' && f.uuid === e.uuid).length === 1;
        if (isRestConfiguration) {
            integration.spec.flows?.filter(f => f.dslName !== 'RestConfigurationDefinition').forEach(f => flows.push(f));
            integration.spec.flows?.filter(f => f.dslName === 'RestConfigurationDefinition').forEach(f => {
                if (f.uuid === e.uuid) flows.push(CamelUtil.cloneStep(e));
                else flows.push(f);
            })
        } else if (isRest) {
            integration.spec.flows?.filter(f => f.dslName !== 'RestDefinition').forEach(f => flows.push(f));
            integration.spec.flows?.filter(f => f.dslName === 'RestDefinition').forEach(f => {
                if (f.uuid === e.uuid) flows.push(CamelUtil.cloneStep(e));
                else flows.push(f);
            })
        } else {
            integration.spec.flows?.filter(f => f.dslName !== 'RestDefinition').forEach(f => flows.push(f));
            integration.spec.flows?.filter(f => f.dslName === 'RestDefinition').forEach((rest: RestDefinition) => {
                if (rest.get) rest.get = rest.get.map(get => get.uuid === e.uuid ? e : get);
                if (rest.post) rest.post = rest.post.map(post => post.uuid === e.uuid ? e : post);
                if (rest.put) rest.put = rest.put.map(put => put.uuid === e.uuid ? e : put);
                if (rest.patch) rest.patch = rest.patch.map(patch => patch.uuid === e.uuid ? e : patch);
                if (rest.delete) rest.delete = rest.delete.map(del => del.uuid === e.uuid ? e : del);
                if (rest.head) rest.head = rest.head.map(head => head.uuid === e.uuid ? e : head);
                flows.push(rest);
            })
        }
        int.spec.flows = flows
        return int;
    }

    static updateIntegrationRouteElement = (integration: Integration, e: CamelElement): Integration => {
        const elementClone = CamelUtil.cloneStep(e);
        const int: Integration = CamelUtil.cloneIntegration(integration);
        const flows: CamelElement[] = [];
        integration.spec.flows?.filter(f => f.dslName !== 'RouteDefinition').forEach(f => flows.push(f));
        integration.spec.flows?.filter(f => f.dslName === 'RouteDefinition').forEach(f => {
            const route = CamelDefinitionApiExt.updateElement(f, elementClone) as RouteDefinition;
            flows.push(CamelDefinitionApi.createRouteDefinition(route));
        })
        int.spec.flows = flows
        return int;
    }

    static updateElement = (element: CamelElement, e: CamelElement): CamelElement => {
        if (element.uuid === e.uuid) {
            return e;
        }
        const result: any = Object.assign({}, element)
        Object.keys(result).forEach(key => {
            if (result[key] instanceof CamelElement) {
                result[key] = CamelDefinitionApiExt.updateElement(result[key], e)
            } else if (Array.isArray(result[key])) {
                result[key] = CamelDefinitionApiExt.updateElements(result[key], e)
            }
        })
        return result as CamelElement
    }

    static updateElements = (elements: CamelElement[], e: CamelElement): CamelElement[] => {
        const result: any[] = []
        elements.forEach(element => {
            if (typeof (element) === 'object') {
                const newElement = CamelDefinitionApiExt.updateElement(element, e);
                result.push(newElement);
            } else {
                result.push(element);
            }
        })
        return result
    }

    static getElementProperties = (className: string | undefined): PropertyMeta[] => {
        const result: PropertyMeta[] = []
        let uri: any = undefined;
        let expression: any = undefined;
        let parameters: any = undefined;
        if (className) {
            const properties = (className.endsWith("Definition") || className.endsWith("BuilderRef"))
                ? CamelMetadataApi.getCamelModelMetadataByClassName(className)?.properties
                : (className.endsWith("DataFormat")
                        ? CamelMetadataApi.getCamelDataFormatMetadataByClassName(className)?.properties
                        : CamelMetadataApi.getCamelLanguageMetadataByClassName(className)?.properties
                );
            properties?.filter(p => p.name !== 'steps')
                .filter(p => p.name !== 'configurationRef')
                .filter(p => (className === 'RouteDefinition' && p.name === 'id') || p.name !== 'id')
                .filter(p => (className === 'ToDefinition' && p.name !== 'pattern') || className !== 'ToDefinition')
                .forEach(p => {
                    switch (p.name) {
                        case 'uri':
                            uri = p;
                            break
                        case 'expression':
                            expression = p;
                            break
                        case 'parameters':
                            parameters = p;
                            break
                        default:
                            result.push(p)
                    }
                })
        }
        if (uri) result.unshift(uri)
        if (expression) result.unshift(expression)
        // if (className && ['marshal', 'unmarshal'].includes(className)) result.unshift(new PropertyMeta("dataFormat"))
        if (parameters) result.push(parameters)
        return result
    }


    static getElementPropertiesByName = (name: string): PropertyMeta[] => {
        const model = CamelMetadataApi.getCamelModelMetadataByName(name);
        if (model) {
            return this.getElementProperties(model.className);
        }
        const language = CamelMetadataApi.getCamelLanguageMetadataByName(name);
        if (language) {
            return this.getElementProperties(language.className);
        }
        const dataFormat = CamelMetadataApi.getCamelDataFormatMetadataByName(name);
        if (dataFormat) {
            return this.getElementProperties(dataFormat.className);
        }
        return [];
    }

    static getParametersValue = (element: CamelElement | undefined, propertyName: string, pathParameter?: boolean): any => {
        if (pathParameter) {
            const uri = (element as any).uri;
            return ComponentApi.getPathParameterValue(uri, propertyName);
        } else {
            if (element && (element as any).parameters) {
                return (element as any).parameters[propertyName];
            }
        }
    }

    static getElementChildrenDefinition = (dslName: string): ChildElement[] => {
        const result: ChildElement[] = [];
        const meta = CamelMetadataApi.getCamelModelMetadataByClassName(dslName);
        if (meta) {
            meta.properties
                .filter(p => p.isObject && CamelMetadataApi.getCamelModelMetadataByClassName(p.type))
                .forEach(p => result.push(new ChildElement(p.name, p.type, p.isArray)));

        }
        if (CamelDefinitionApi.createStep(dslName, {}).hasSteps())
            result.push(new ChildElement("steps", "CamelElement", true));
        return result;
    }

    static getElementChildren = (element: CamelElement, child: ChildElement): CamelElement[] => {
        const result: CamelElement[] = [];
        const children = (element as any)[child.name];
        if (Array.isArray(children)) {
            result.push(...children);
        } else if (children) {
            result.push(children);
        }
        return result;
    }
}
