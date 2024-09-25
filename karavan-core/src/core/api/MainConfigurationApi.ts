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
import { ApplicationProperty, ApplicationPropertyGroup } from '../model/MainConfigurationModel';

const MainApplicationProperties: ApplicationProperty[] = [];
const MainApplicationGroups: ApplicationPropertyGroup[] = [];

export class MainConfigurationApi {
    private constructor() {}


    static saveApplicationProperties = (objects: [], clean: boolean = false): void => {
        if (clean) MainApplicationProperties.length = 0;
        const properties: ApplicationProperty[] = objects.map(object => new ApplicationProperty(object));
        MainApplicationProperties.push(...properties);
    };

    static getApplicationProperties = (): ApplicationProperty[] => {
        const comps: ApplicationProperty[] = [];
        comps.push(...MainApplicationProperties);
        return comps;
    };

    static findByName = (name: string): ApplicationProperty | undefined => {
        return MainConfigurationApi.getApplicationProperties().find((c: ApplicationProperty) => c.name === name);
    };

    static saveApplicationPropertyGroups = (objects: []): void => {
        MainApplicationGroups.length = 0;
        const properties: ApplicationPropertyGroup[] = objects.map(object => new ApplicationPropertyGroup(object));
        MainApplicationProperties.push(...properties);
    };
}
