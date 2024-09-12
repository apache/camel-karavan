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
import { Integration, CamelElement } from '../model/IntegrationDefinition';
import { CamelUtil } from './CamelUtil';
import { CamelDefinitionApi } from './CamelDefinitionApi';
import { CamelDefinitionApiExt } from './CamelDefinitionApiExt';
import { KameletModel } from '../model/KameletModels';
import { RouteDefinition } from '../model/CamelDefinition';
import { ComponentApi } from './ComponentApi';
import { CamelMetadataApi } from '../model/CamelMetadata';

export class CamelDisplayUtil {
    private constructor() {}

    static getTitle = (element: CamelElement): string => {
        const k: KameletModel | undefined = CamelUtil.getKamelet(element);
        if (k) {
            return k.title();
        } else if (element.dslName === 'RouteDefinition') {
            const routeId = (element as RouteDefinition).id
            return routeId ? routeId : CamelUtil.capitalizeName((element as any).stepName);
        } else if ((element as any).uri && (['ToDefinition', 'FromDefinition', 'PollDefinition'].includes(element.dslName))) {
            const uri = (element as any).uri
            return ComponentApi.getComponentTitleFromUri(uri) || '';
        } else {
            const title = CamelMetadataApi.getCamelModelMetadataByClassName(element.dslName);
            return title ? title.title : CamelUtil.capitalizeName((element as any).stepName);
        }
    }

    static getDescription = (element: CamelElement): string => {
        const kamelet: KameletModel | undefined = CamelUtil.getKamelet(element);
        if (kamelet) {
            return kamelet.spec.definition.description;
        } else if ((element as any).uri && (['ToDefinition', 'FromDefinition', 'PollDefinition'].includes(element.dslName))) {
            const uri = (element as any).uri
            return ComponentApi.getComponentDescriptionFromUri(uri) || '';
        } else {
            const description = CamelMetadataApi.getCamelModelMetadataByClassName(element.dslName)?.description;
            return description ? description : CamelDisplayUtil.getTitle(element);
        }
    }

    static getStepDescription = (element: CamelElement): string => {
        const description = (element as any).description;
        return description ? description : CamelDisplayUtil.getTitle(element);
    }

    static isStepDefinitionExpanded = (integration: Integration, stepUuid: string, selectedUuid: string | undefined): boolean => {
        const expandedUuids: string[] = [];
        if (selectedUuid) {
            expandedUuids.push(...CamelDisplayUtil.getParentStepDefinitions(integration, selectedUuid));
        }
        return expandedUuids.includes(stepUuid);
    }

    static getParentStepDefinitions = (integration: Integration, uuid: string): string[] => {
        const result: string[] = [];
        let meta = CamelDefinitionApiExt.findElementMetaInIntegration(integration, uuid);
        let i = 0;
        while (meta && meta.step?.dslName !== 'FromDefinition' && i < 100) {
            i++;
            if (meta.step?.dslName === 'StepDefinition') {
                result.push(meta.step.uuid);
            }
            if (meta.parentUuid) {
                meta = CamelDefinitionApiExt.findElementMetaInIntegration(integration, meta.parentUuid);
            } else {
                break;
            }
        }
        return result;
    }

    static setIntegrationVisibility = (integration: Integration, selectedUuid: string | undefined): Integration => {
        const clone: Integration = CamelUtil.cloneIntegration(integration);
        const expandedUuids: string[] = [];
        if (selectedUuid) {
            expandedUuids.push(...CamelDisplayUtil.getParentStepDefinitions(integration, selectedUuid));
        }

        const flows: any[] = [];
        for (const flow of clone.spec.flows || []) {
            if (flow.dslName !== 'RouteDefinition') {
                flows.push(flow);
            } else {
                const visibleRoute = CamelDisplayUtil.setElementVisibility(flow, true, expandedUuids);
                if (Object.keys(visibleRoute).length !== 0) {
                    flows.push(visibleRoute);
                }
            }
        }

        clone.spec.flows = flows;
        return clone;
    }

    static setElementVisibility = (step: CamelElement, showChildren: boolean, expandedUuids: string[]): CamelElement => {
        const result = CamelDefinitionApi.createStep(step.dslName, step);
        result.showChildren = showChildren;
        if (result.dslName === 'StepDefinition') {
            showChildren = expandedUuids.includes(result.uuid);
        }

        const elementChildDefinition = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        for (const element of elementChildDefinition) {
            const camelElement = CamelDefinitionApiExt.getElementChildren(step, element);
            if (element.multiple) {
                (result as any)[element.name] = CamelDisplayUtil.setElementsVisibility((result as any)[element.name], showChildren, expandedUuids)
            } else {
                const prop = (result as any)[element.name];
                if (prop && prop.hasOwnProperty('uuid')) {
                    (result as any)[element.name] = CamelDisplayUtil.setElementVisibility(camelElement[0], showChildren,expandedUuids)
                }
            }
        }
        return result;
    }

    static setElementsVisibility = (steps: CamelElement[] | undefined, showChildren: boolean, expandedUuids: string[]): CamelElement[] => {
        const result: CamelElement[] = [];
        if (steps) {
            for (const step of steps) {
                result.push(CamelDisplayUtil.setElementVisibility(step, showChildren, expandedUuids));
            }
        }
        return result;
    }
}
