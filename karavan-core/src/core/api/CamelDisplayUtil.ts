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
import {Integration, CamelElement} from "../model/IntegrationDefinition";
import {CamelUtil} from "./CamelUtil";
import {CamelDefinitionApi} from "./CamelDefinitionApi";
import {CamelDefinitionApiExt} from "./CamelDefinitionApiExt";

export class CamelDisplayUtil {

    static isStepDefinitionExpanded = (integration: Integration, stepUuid: string, selectedUuid: string | undefined): boolean => {
        const expandedUuids: string[] = [];
        if (selectedUuid) {
            expandedUuids.push(...this.getParentStepDefinitions(integration.spec.flows, selectedUuid));
        }
        return expandedUuids.includes(stepUuid);
    }

    static getParentStepDefinitions = (flows: CamelElement[] | undefined, uuid: string): string[] => {
        const result: string[] = [];
        let meta = CamelDefinitionApiExt.findStep(flows, uuid);
        while (meta.step?.dslName !== 'FromDefinition') {
            if (meta.step?.dslName === 'StepDefinition') result.push(meta.step.uuid);
            if (meta.parentUuid) meta = CamelDefinitionApiExt.findStep(flows, meta.parentUuid);
        }
        return result;
    }

    static setIntegrationVisibility = (integration: Integration, selectedUuid: string | undefined): Integration => {
        const clone: any = CamelUtil.cloneIntegration(integration);
        const flows = integration.spec.flows;
        const expandedUuids: string[] = [];
        if (selectedUuid) {
            expandedUuids.push(...this.getParentStepDefinitions(flows, selectedUuid));
        }
        clone.spec.flows = flows?.map((f: any) => this.setElementVisibility(f, true, expandedUuids)).filter(x => Object.keys(x).length !== 0);
        return clone;
    }

    static setElementVisibility = (step: CamelElement, showChildren: boolean, expandedUuids: string[]): CamelElement => {
        const result = CamelDefinitionApi.createStep(step.dslName, step);
        result.show = showChildren;
        if (result.dslName === 'StepDefinition' && !expandedUuids.includes(result.uuid)) {
            showChildren = false;
        } else if (result.dslName === 'StepDefinition' && expandedUuids.includes(result.uuid)) {
            showChildren = true;
        }
        const ce = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        ce.forEach(e => {
            const cel = CamelDefinitionApiExt.getElementChildren(step, e);
            if (e.multiple) {
                (result as any)[e.name] = this.setElementsVisibility((result as any)[e.name], showChildren, expandedUuids);
            } else {
                const prop = (result as any)[e.name];
                if (prop && prop.hasOwnProperty("uuid")) {
                    (result as any)[e.name] = this.setElementVisibility(cel[0], showChildren, expandedUuids);
                }
            }
        })
        return result;
    }

    static setElementsVisibility = (steps: CamelElement[] | undefined, showChildren: boolean, expandedUuids: string[]): CamelElement[] => {
        const result: CamelElement[] = []
        if (steps !== undefined) {
            steps.forEach(step => {
                step = this.setElementVisibility(step, showChildren, expandedUuids);
                result.push(step);
            })
        }
        return result
    }
}
