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
import {Kamelet, Property} from "../model/KameletModels";
import * as yaml from 'js-yaml';

export const Kamelets: Kamelet[] = [];

export const KameletApi = {

    getKameletProperties: (kameletName: string): Property[] => {
        const kamelet: Kamelet | undefined = KameletApi.findKameletByName(kameletName);
        const properties: Property[] = [];
        try {
            if (kamelet !== undefined) {
                const map: Map<string, any> = kamelet.spec.definition.properties ? new Map(Object.entries(kamelet.spec.definition.properties)) : new Map();
                map.forEach((value, key, map) => {
                    const prop = new Property();
                    prop.id = key;
                    prop.title = value.title;
                    prop.default = value.default;
                    prop.description = value.description;
                    prop.format = value.format;
                    prop.example = value.example;
                    prop.type = value.type;
                    if (value.default) prop.value = value.default
                    prop["x-descriptors"] = value["x-descriptors"];
                    properties.push(prop);
                })
            }
        } finally {
            return properties;
        }
    },

    getKamelets: (): Kamelet[] => {
        return Kamelets;
    },

    jsonToKamelet: (json: string) => {
        const fromJson: Kamelet = JSON.parse(json) as Kamelet;
        const k: Kamelet = new Kamelet(fromJson);
        return k;
    },


    findKameletByName: (name: string): Kamelet | undefined => {
        return Kamelets.find((k: Kamelet) => k.metadata.name === name);
    },

    findKameletByUri: (uri: string): Kamelet | undefined => {
        return KameletApi.findKameletByName(uri.split(":")[1]);
    },

    requestKamelet: async (name: string): Promise<Kamelet> => {
        // const res = await axios("/kamelet/" + name);
        // const text: string = await res.data;
        // const fromYaml = yaml.load(text);
        const fromYaml = '';
        return KameletApi.jsonToKamelet(JSON.stringify(fromYaml));
    },

    yamlToKamelet: (text: string):Kamelet => {
        const fromYaml = yaml.load(text);
        return KameletApi.jsonToKamelet(JSON.stringify(fromYaml));
    },

    prepareKamelets: () => {
        Kamelets.splice(0, Kamelets.length);
        // axios.get('/kamelet',
        //     {headers: {'Accept': 'application/json'}})
        //     .then(res => {
        //         if (res.status === 200) {
        //             KameletApi.loadKamelets(res.data);
        //         }
        //     }).catch(err => {
        //     console.log(err);
        // });
    },

    loadKamelets: (kameletNames: string[]) => {
        const promises = kameletNames.map((name: string) => KameletApi.requestKamelet(name));
        Promise.all(promises).then(function (list) {
            const result: Kamelet[] = list as Kamelet[];
            Kamelets.push(...result.sort((a, b) => {
                    if (a.spec.definition.title < b.spec.definition.title) {
                        return -1;
                    }
                    return a.spec.definition.title > b.spec.definition.title ? 1 : 0;
                })
            );
        });
    },

    saveKamelets: (kameletYamls: string[]) => {
        const kamelets:Kamelet[] = kameletYamls.map(text => KameletApi.yamlToKamelet(text));
        Kamelets.push(...kamelets.sort((a, b) => {
                if (a.spec.definition.title < b.spec.definition.title) {
                    return -1;
                }
                return a.spec.definition.title > b.spec.definition.title ? 1 : 0;
            })
        );
    }
}