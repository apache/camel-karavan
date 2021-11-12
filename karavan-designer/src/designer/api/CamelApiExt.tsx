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
import {CamelElement, FromStep, Integration, ProcessorStep} from "../model/CamelModel";
import {CamelMetadataApi, PropertyMeta} from "./CamelMetadata";
import {CamelApi} from "./CamelApi";
import {ComponentApi} from "./ComponentApi";

export class CamelApiExt {

    static addStepToIntegration = (integration: Integration, step: CamelElement, parentId: string, position?: number): Integration => {
        if (step.dslName === 'fromStep') {
            integration.spec.flows.push(step as FromStep);
        } else {
            const flows = CamelApi.addStep(integration.spec.flows, step, parentId, position);
            integration.spec.flows = flows as FromStep[];
        }
        return integration;
    }

    static findElement = (integration: Integration, uuid: string): CamelElement | undefined => {
        const step = CamelApi.findStep(integration.spec.flows, uuid, undefined);
        return step.step;
    }

    static moveElement = (integration: Integration, source: string, target: string): Integration => {
        const sourceFindStep = CamelApi.findStep(integration.spec.flows, source, undefined);
        const sourceStep = sourceFindStep.step;
        const sourceUuid = sourceStep?.uuid;
        const targetFindStep = CamelApi.findStep(integration.spec.flows, target, undefined);
        const parentUuid = targetFindStep.parentUuid;
        if (sourceUuid && parentUuid) {
            CamelApiExt.deleteStepFromIntegration(integration, sourceUuid);
            switch (targetFindStep.step?.dslName) {
                case 'when':
                    return CamelApiExt.addStepToIntegration(integration, sourceStep, targetFindStep.step?.uuid, undefined);
                    break;
                case 'otherwise':
                    return CamelApiExt.addStepToIntegration(integration, sourceStep, targetFindStep.step?.uuid, undefined);
                    break;
                default:
                    return CamelApiExt.addStepToIntegration(integration, sourceStep, parentUuid, targetFindStep.position);
                    break;
            }
        }
        return integration;
    }

    static deleteStepFromIntegration = (integration: Integration, uuidToDelete: string): Integration => {
        const flows = CamelApi.deleteStep(integration.spec.flows, uuidToDelete);
        integration.spec.flows = flows as FromStep[];
        return integration;
    }

    static getExpressionLanguage = (element: CamelElement | undefined): string | undefined => {
        const el: any = Object.assign({}, element);
        if (el.hasOwnProperty('expression') && el.expression) {
            return el.expression.language
        } else {
            return undefined;
        }
    }

    static getExpressionValue = (element: CamelElement | undefined): string | undefined => {
        const language = CamelApiExt.getExpressionLanguage(element);
        if (language) {
            return (element as any).expression[language];
        } else {
            return undefined;
        }
    }

    static updateIntegration = (integration: Integration, e: CamelElement, updatedUuid: string): Integration => {
        const int: Integration = new Integration({...integration});
        const flows = integration.spec.flows.map(f => CamelApiExt.updateElement(f, e) as FromStep)
        const flows2 = flows.map(f => CamelApi.createFrom(f));
        int.spec.flows = flows2
        return int;
    }

    static updateElement = (element: CamelElement, e: CamelElement): CamelElement => {
        if (element.uuid === e.uuid) {
            return e;
        }
        const result: any = Object.assign({}, element)
        Object.keys(result).forEach(key => {
            if (result[key] instanceof CamelElement) {
                result[key] = CamelApiExt.updateElement(result[key], e)
            } else if (Array.isArray(result[key])) {
                result[key] = CamelApiExt.updateElements(result[key], e)
            }
        })
        return result as CamelElement
    }

    static updateElements = (elements: CamelElement[], e: CamelElement): CamelElement[] => {
        const result: any[] = []
        elements.forEach(element => {
            const newElement = CamelApiExt.updateElement(element, e)
            result.push(newElement)
        })
        return result
    }


    static getElementProperties = (name: string | undefined): PropertyMeta[] => {
        const result: PropertyMeta[] = []
        let uri: any = undefined;
        let expression: any = undefined;
        let parameters: any = undefined;
        if (name) {
            CamelMetadataApi.getElementMeta(name)?.properties
                .filter(p => p.name !== 'steps' && p.name !== 'inheritErrorHandler')
                .filter(p => (name == 'to' && p.name !== 'pattern') || name != 'to')
                .filter(p => !p.isObject || (p.isObject && p.name === 'expression'))
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
        if (parameters) result.push(parameters)
        return result
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

    static getToStepsFromIntegration = (integration: Integration): [CamelElement, number][] => {
        const result: [CamelElement, number][] = [];
        integration.spec.flows.forEach((flow, index) => {
            const steps: [CamelElement, number][] = CamelApiExt.getOutgoingStepsFromStep(flow.from, 0);
            result.push(...steps);
        })
        return result;
    }

    static getOutgoingStepsFromStep = (step: ProcessorStep, level: number): [CamelElement, number][] => {
        const result: [CamelElement, number][] = [];
        if (['toStep', 'kameletStep'].includes(step.dslName)) result.push([step, level]);
        const element: any = Object.assign({}, step);
        Object.keys(element).forEach(key => {
            if (element[key] instanceof CamelElement) {
                const steps = CamelApiExt.getOutgoingStepsFromStep(element[key], level + 1);
                result.push(...steps);
            } else if (Array.isArray(element[key])) {
                const parallel = element.dslName === 'multicast' || element.dslName === 'choice';
                const increase = element.dslName === 'otherwise' ? 3 : 1;
                const steps = CamelApiExt.getStepsFromSteps(element[key], level + increase, parallel);
                result.push(...steps);
            }
        })
        return result;
    }

    static getStepsFromSteps = (steps: CamelElement[], level: number, parallel: boolean): [CamelElement, number][] => {
        const result: [CamelElement, number][] = [];
        steps.forEach((step, index) => {
            const steps = CamelApiExt.getOutgoingStepsFromStep(step, level + (parallel ? 1 : index));
            result.push(...steps);
        })
        return result;
    }
}
