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
    CamelElement,
} from "../model/CamelModel";
import {CamelApi} from "./CamelApi";

// TODO need to split and regroup functions here
export class CamelYaml {

    static integrationToYaml = (integration: Integration): string => {
        const clone: any = Object.assign({}, integration);
        const flows = integration.spec.flows
        clone.spec.flows = flows.map((f: any) => CamelYaml.cleanupElement(f));
        const i = JSON.parse(JSON.stringify(clone, null, 3)); // fix undefined in string attributes
        const text = yaml.dump(i);
        return text;
    }

    static cleanupElement = (element: CamelElement): CamelElement => {
        const result: any = {};
        const object: any = Object.assign({}, element);
        if (object.dslName === 'expression') {
            delete object.language
        }
        delete object.uuid
        delete object.dslName
        Object.keys(object)
            .sort((a, b) => {
                if (a === 'uri') return -1
                else if (a === 'steps') return 1
                else return 0;
            })
            .forEach(key => {
                if (object[key] instanceof CamelElement) {
                    result[key] = CamelYaml.cleanupElement(object[key])
                } else if (Array.isArray(object[key])) {
                    result[key] = CamelYaml.cleanupElements(object[key])
                } else {
                    result[key] = object[key];
                }
            })
        return result as CamelElement
    }

    static cleanupElements = (elements: CamelElement[]): CamelElement[] => {
        const result: any[] = []
        elements.forEach(element => {
            const newElement = CamelYaml.cleanupElement(element)
            result.push(newElement)
        })
        return result
    }

    static yamlToIntegration = (text: string): Integration => {
        const fromYaml: any = yaml.load(text);
        const int: Integration = new Integration({...fromYaml});
        const flows = int.spec.flows.map(f => CamelApi.createFrom(f))
        int.spec.flows = flows;
        return int;
    }

    static cloneIntegration = (integration: Integration): Integration => {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({...clone});
        const flows = int.spec.flows.map(f => CamelApi.createFrom(f))
        int.spec.flows = flows;
        return int;
    }

    static cloneStep = (step: CamelElement): CamelElement => {
        const dslName = step.dslName.replace("Step", "");
        const clone = JSON.parse(JSON.stringify(step));
        return CamelApi.createStep(dslName, clone);
    }
}
