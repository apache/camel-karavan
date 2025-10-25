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
import { ApplicationProperty, ApplicationPropertyChange, ApplicationPropertyGroup } from '../model/MainConfigurationModel';

const KaravanProperties: ApplicationProperty[] = [
    new ApplicationProperty({name: 'camel.karavan.projectId', type: 'string', description: 'Project ID'}),
    new ApplicationProperty({name: 'camel.karavan.projectName', type: 'string', description: 'Project Name'}),
    new ApplicationProperty({name: 'camel.context.dev-console', type: 'boolean', description: 'Enable/Disable Developer Console on CamelContext'})
]
const KaravanGroup: ApplicationPropertyGroup[] = [
    new ApplicationPropertyGroup({name: 'camel.karavan', description: 'Karavan'}),
    new ApplicationPropertyGroup({name: 'camel.context', description: 'CamelContext'})
]

const MainApplicationProperties: ApplicationProperty[] = [];
const MainApplicationGroups: ApplicationPropertyGroup[] = [];
const ApplicationPropertyChanges: ApplicationPropertyChange[] = [];

export class MainConfigurationApi {
    private constructor() {}


    static saveApplicationProperties = (objects: any[], clean: boolean = false): void => {
        if (clean) MainApplicationProperties.length = 0;
        const properties: ApplicationProperty[] = objects.map(object => new ApplicationProperty(object));
        MainApplicationProperties.push(...properties, ...KaravanProperties);
    };

    static getApplicationProperties = (): ApplicationProperty[] => {
        const comps: ApplicationProperty[] = [];
        comps.push(...MainApplicationProperties);
        return comps;
    };

    static getApplicationPropertyGroups = (): ApplicationPropertyGroup[] => {
        const comps: ApplicationPropertyGroup[] = [];
        comps.push(...MainApplicationGroups);
        return comps;
    };

    static getApplicationPropertyChanges = (): ApplicationPropertyChange[] => {
        const comps: ApplicationPropertyChange[] = [];
        comps.push(...ApplicationPropertyChanges);
        return comps;
    };

    static findByName = (name: string): ApplicationProperty | undefined => {
        return MainConfigurationApi.getApplicationProperties().find((c: ApplicationProperty) => c.name === name);
    };

    static findChangeByPropertyName = (name: string): { removed: boolean, replaced?: string } => {
        const result: { removed: boolean, replaced?: string } = { removed: false, replaced: undefined }
        MainConfigurationApi.getApplicationPropertyChanges().forEach((change: ApplicationPropertyChange) => {
            result.removed = !!change.removed?.find(r => r.name === name) || result.removed;
            result.replaced = change.replace?.find(r => r.from === name)?.to || result.replaced;
        });
        return result;
    };

    static saveApplicationPropertyGroups = (objects: any []): void => {
        MainApplicationGroups.length = 0;
        const groups: ApplicationPropertyGroup[] = objects.map(object => new ApplicationPropertyGroup(object));
        MainApplicationGroups.push(...groups,...KaravanGroup);
    };

    static saveApplicationPropertyChanges = (objects: any []): void => {
        ApplicationPropertyChanges.length = 0;
        const changes: ApplicationPropertyChange[] = objects.map(
            (object) => object as ApplicationPropertyChange
        );
        ApplicationPropertyChanges.push(...changes);
    };
}
