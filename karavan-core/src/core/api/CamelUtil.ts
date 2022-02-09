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
import {
    Integration,
    CamelElement, Bean, Beans,
} from "../model/CamelDefinition";
import {CamelDefinitionApi} from "./CamelDefinitionApi";

export class CamelUtil {

    static cloneIntegration = (integration: Integration): Integration => {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({...clone});
        const flows: any[] = [];
        int.spec.flows?.filter((e: any) => e.dslName === 'RouteDefinition')
            .forEach(f => flows.push(CamelDefinitionApi.createStep(f.dslName, f)));
        int.spec.flows?.filter((e: any) => e.dslName === 'Beans')
            .forEach(beans => {
                const newBeans = new Beans();
                (beans as Beans).beans.forEach(b => newBeans.beans.push(CamelUtil.cloneBean(b)));
                flows.push(newBeans);
            });
        int.spec.flows = flows;
        return int;
    }

    static cloneStep = (step: CamelElement): CamelElement => {
        const clone = JSON.parse(JSON.stringify(step));
        return CamelDefinitionApi.createStep(step.dslName, clone, true);
    }

    static cloneBean = (bean: Bean): Bean => {
        const clone = JSON.parse(JSON.stringify(bean));
        return new Bean(clone);
    }

    static replacer = (key:string, value:any): any => {
        if (typeof value == 'object' && (value.hasOwnProperty('stepName') || value.hasOwnProperty('step-name'))) {
            const stepNameField = value.hasOwnProperty('stepName') ? 'stepName' : 'step-name';
            const stepName = value[stepNameField];
            const x = JSON.parse(JSON.stringify(value));
            delete x[stepNameField];
            if (['when', 'otherwise', 'expression', 'doCatch', 'doFinally'].includes(value[stepNameField])){
                return x;
            } else if (key === 'from'){
                return x;
            } else {
                const newValue: any = {};
                newValue[stepName] = x;
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
    }

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
    }

    static camelizeBody = (name: string, body: any, clone: boolean): any => {
        if (body && Object.keys(body).length > 0){
            const oldKey = Object.keys(body)[0];
            const key = CamelUtil.camelizeName(oldKey, '-', true);
            return !clone && key === name ? {[key]: body[oldKey]} : body;
        } else {
            return {};
        }
    }

    static camelizeObject = (body: any): any => {
        if (Array.isArray(body)){
            const result: any [] = [];
            (body as []).forEach(value => {
                if (typeof value == 'object'){
                    result.push(CamelUtil.camelizeObject(value));
                } else {
                    result.push(value);
                }
            });
            return result;
        } else {
            const result: any = {};
            if (body && Object.keys(body).length > 0) {
                Object.keys(body).forEach(key => {
                    const newKey = CamelUtil.camelizeName(key, "-", true);
                    if (typeof body[key] == 'object' || Array.isArray(body[key])){
                        result[newKey] = CamelUtil.camelizeObject(body[key]);
                    } else {
                        result[newKey] = body[key];
                    }
                });
            }
            return result;
        }
    }
}
