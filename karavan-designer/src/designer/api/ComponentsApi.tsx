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
import { Component } from "../model/ComponentModels";

export const Components: Component[] = [];

export const ComponentsApi = {

    jsonToComponent: (json: string) => {
        const fromJson: Component = JSON.parse(json) as Component;
        const k: Component = new Component(fromJson);
        return k;
    },

    saveComponents: (jsons: string[]) => {
        const components:Component[] = jsons.map(json => ComponentsApi.jsonToComponent(json));
        Components.push(...components);
    },

    saveComponent: (json: string) => {
        const component:Component = ComponentsApi.jsonToComponent(json);
        Components.push(component);
    },

    getComponents: (): Component[] => {
        return Components.sort((a, b) => {
            if (a.component.name < b.component.name) {
                return -1;
            }
            return a.component.name > b.component.name ? 1 : 0;
        });
    },
}