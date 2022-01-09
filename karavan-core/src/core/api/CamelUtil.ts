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


export class CamelUtil {

    static cloneIntegration = (integration: Integration): Integration => {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({...clone});
        const flows = int.spec.flows.map(f => CamelApi.createFrom(f))
        int.spec.flows = flows;
        return int;
    }

    static cloneStep = (step: CamelElement): CamelElement => {
        const clone = JSON.parse(JSON.stringify(step));
        return CamelApi.createStep(step.dslName, clone, true);
    }

    static replacer =  (key:string, value:any): any=> {
        if (typeof value == 'object' && (value.hasOwnProperty('dslName') || value.hasOwnProperty('dsl-name'))) {
            const dslNameField = value.hasOwnProperty('dslName') ? 'dslName' : 'dsl-name';
            const dslName = value[dslNameField];
            const x = JSON.parse(JSON.stringify(value));
            delete x[dslNameField];
            if (['when', 'otherwise', 'expression'].includes(value[dslNameField])){
                return x;
            } else {
                const newValue: any = {};
                newValue[dslName] = x;
                return newValue;
            }
        } else {
            return value;
        }
    }

    static capitalizeName = (name: string) => {
        try {
            return name[0].toUpperCase() + name.substring(1);
        } catch (e) {
            return name;
        }
    };

    static camelizeName = (
        name: string,
        separator: string,
        firstSmall: boolean
    ) => {
        const res = name
            .split(separator)
            .map((value) => CamelUtil.capitalizeName(value))
            .join("");
        return firstSmall ? res[0].toLowerCase() + res.substring(1) : res;
    };

    static camelizeBody = (name: string, body: any, clone: boolean): any => {
        if (body){
            const oldKey = Object.keys(body)[0];
            const key = CamelUtil.camelizeName(oldKey, '-', true);
            return !clone && key === name ? {[key]: body[oldKey]} : body;
        } else {
            return {};
        }
    };
}
