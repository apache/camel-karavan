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
import {KameletModel, Property} from "../model/KameletModels";
import * as yaml from 'js-yaml';

export const Kamelets: KameletModel[] = [];
export const CustomNames: string[] = [];

export const KameletApi = {

    getCustomKameletNames: (): string [] => {
        return CustomNames;
    },

    saveCustomKameletNames: (names: string[]) => {
        CustomNames.length = 0;
        CustomNames.push(...names);
    },

    getKameletProperties: (kameletName: string): Property[] => {
        const kamelet: KameletModel | undefined = KameletApi.findKameletByName(kameletName);
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

    getKamelets: (): KameletModel[] => {
        return Kamelets.sort((a, b) => {
            if (a.title().toLowerCase() < b.title().toLowerCase()) {
                return -1;
            }
            return a.title().toLowerCase() > b.title().toLowerCase() ? 1 : 0;
        });
    },

    jsonToKamelet: (json: string) => {
        const fromJson: KameletModel = JSON.parse(json) as KameletModel;
        const k: KameletModel = new KameletModel(fromJson);
        return k;
    },


    findKameletByName: (name: string): KameletModel | undefined => {
        return Kamelets.find((k: KameletModel) => k.metadata.name === name);
    },

    findKameletByUri: (uri: string): KameletModel | undefined => {
        return KameletApi.findKameletByName(uri.split(":")[1]);
    },

    yamlToKamelet: (text: string):KameletModel => {
        const fromYaml = yaml.load(text);
        return KameletApi.jsonToKamelet(JSON.stringify(fromYaml));
    },

    saveKamelets: (kameletYamls: string[], clean: boolean = false) => {
        const kamelets:KameletModel[] = kameletYamls.map(text => KameletApi.yamlToKamelet(text));
        if (clean) Kamelets.length = 0;
        Kamelets.push(...kamelets.sort((a, b) => {
                if (a.spec.definition.title.toLowerCase() < b.spec.definition.title.toLowerCase()) {
                    return -1;
                }
                return a.spec.definition.title.toLowerCase() > b.spec.definition.title.toLowerCase() ? 1 : 0;
            })
        );
    },

    saveKamelet: (yaml: string) => {
        const kamelet:KameletModel = KameletApi.yamlToKamelet(yaml);
        if (Kamelets.findIndex((k:KameletModel) => k.metadata.name === kamelet.metadata.name) === -1) {
            Kamelets.push(kamelet);
        }
    }
}