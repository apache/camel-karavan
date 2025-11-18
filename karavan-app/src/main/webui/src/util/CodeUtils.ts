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

import {APPLICATION_PROPERTIES, ProjectFile} from "@/api/ProjectModels";
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration, IntegrationFile, KameletTypes, MetadataLabels} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelUi} from "@/integration-designer/utils/CamelUi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {EventBus} from "@/integration-designer/utils/EventBus";
import {ApplicationProperty} from "karavan-core/lib/model/MainConfigurationModel";
import {MainConfigurationApi} from "karavan-core/lib/api/MainConfigurationApi";

export class CodeUtils {

    static getBeans(files: ProjectFile[]): BeanFactoryDefinition[] {
        const result: BeanFactoryDefinition[] = [];
        CodeUtils.getIntegrations(files).forEach(integration => {
            const beans = CamelUi.getBeans(integration);
            result.push(...beans);
        })
        return result;
    }

    static getIntegrations(files: IntegrationFile[]): Integration[] {
        const integrations: Integration[] = [];
        files.filter((file) => file.name.endsWith(".camel.yaml")).forEach((file) => {
            try {
                const i = CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
                integrations.push(i);
            } catch (e: any){
                console.error(e);
                EventBus.sendAlert(`Error parsing ${file.name}`, e?.message, 'danger');
            }
        })
        return integrations;
    }

    static getPropertyPlaceholders(files: ProjectFile[]): [string, string][] {
        const result: [string, string][] = []
        const code = CodeUtils.getPropertyCode(files);
        if (code) {
            const lines = code.split('\n').map((line) => line.trim());
            lines
                .filter(line => !line.startsWith("camel.") && !line.startsWith("jkube.") && !line.startsWith("jib."))
                .filter(line => line !== undefined && line !== null && line.length > 0)
                .forEach(line => {
                    const parts = line.split("=");
                    if (parts.length > 0) {
                        result.push([parts[0], parts[1]]);
                    }
                })
        }
        return result;
    }

    static getPropertyCode(files: ProjectFile[]) {
        const file = files.filter(f => f.name === APPLICATION_PROPERTIES)?.at(0);
        return file?.code;
    }

    static getCodeForNewFile(fileName: string, type: string, copyFromKamelet?: string): string {
        if (type === 'INTEGRATION') {
            return CamelDefinitionYaml.integrationToYaml(Integration.createNew(fileName, 'plain'));
        } else if (type === 'KAMELET') {
            const filenameParts = fileName.replace('.kamelet.yaml', '').split('-');
            const name = filenameParts.join('-');
            const type: string | undefined = filenameParts.slice(-1)[0]
            const kameletType: KameletTypes | undefined = (type === "sink" || type === "source" || type === "action") ? type : undefined;
            const integration = Integration.createNew(name, 'kamelet');
            const meta: MetadataLabels = new MetadataLabels({"camel.apache.org/kamelet.type": kameletType});
            integration.metadata.labels = meta;
            if (copyFromKamelet !== undefined && copyFromKamelet !== '') {
                const kamelet= KameletApi.getAllKamelets().filter(k => k.metadata.name === copyFromKamelet).at(0);
                if (kamelet) {
                    (integration as any).spec = kamelet.spec;
                    (integration as any).metadata.labels = kamelet.metadata.labels;
                    (integration as any).metadata.annotations = kamelet.metadata.annotations;
                    const i = CamelUtil.cloneIntegration(integration);
                    return CamelDefinitionYaml.integrationToYaml(i);
                }
            }
            return CamelDefinitionYaml.integrationToYaml(integration);
        } else {
            return '';
        }
    }

    static getApplicationPropertiesCurrentValues(code: string): ApplicationProperty[] {
        if (!code) return []; // Add a guard for null or undefined code
        return code.split(/\r?\n/)
            .filter((p: string) => p.trim() !== '' && p.indexOf('#') !== 0) // Skip empty/whitespace lines and comments
            .map((p: string) => {
                const i = p.indexOf("=");
                // Handle lines that might not contain '='
                if (i === -1) {
                    return {name: p.trim(), value: ''};
                }
                const key = p.substring(0, i).trim();
                const value = p.substring(i + 1).trim();
                return {name: key, value: value};
            });
    }


    /**
     * Replaces all deprecated property keys in a given .properties string with their new names.
     *
     * @param code The input string containing properties in .ini format.
     * @returns A new string with deprecated keys replaced.
     */
    static getReplaceAllPropertiesNames(code: string): string {
        // 1. Split the input text into an array of lines.
        const lines = code.split('\n');

        // 2. Process each line to check for and replace keys.
        const updatedLines = lines.map(line => {
            const trimmedLine = line.trim();

            // 3. Ignore comments (starting with # or !) and empty lines.
            if (trimmedLine.startsWith('#') || trimmedLine.startsWith('!') || trimmedLine === '') {
                return line;
            }

            // 4. Find the first separator (= or :) to isolate the key.
            const separatorIndex = trimmedLine.search(/[=:]/);

            // If no separator is found or the line starts with it, it's not a valid key-value pair.
            if (separatorIndex <= 0) {
                return line;
            }

            // Extract the key, trimming any whitespace around it.
            const key = trimmedLine.substring(0, separatorIndex).trim();

            // 5. Use the API to check if the key is deprecated.
            const change = MainConfigurationApi.findChangeByPropertyName(key);

            // 6. If a new name is found, replace the old key in the original line.
            // This replacement preserves leading whitespace and the value part of the string.
            if (change && change.replaced) {
                return line.replace(key, change.replaced);
            }

            // 7. If no change is needed, return the original line.
            return line;
        });

        // 8. Join the updated lines back into a single string.
        return updatedLines.join('\n');
    }

    static sortApplicationProperties(input: string): string {
        // Define priority order for prefixes
        const priorities = [
            'camel.karavan.',
            'camel.jbang.',
            'camel.context',
            'camel.',
            'jib.',
            'jkube.'
        ];

        // Function to determine the priority of each line
        const getPriority = (line: string): number => {
            for (let i = 0; i < priorities.length; i++) {
                if (line.startsWith(priorities[i])) {
                    return i; // Return the index as priority
                }
            }
            return priorities.length; // Return a default priority for lines not matching any prefix
        };

        // Split input string into lines, sort them by priority and return the sorted result
        return input
            .split('\n')
            .sort((a, b) => {
                const priorityA = getPriority(a);
                const priorityB = getPriority(b);

                // If priorities are equal, use lexicographical order
                if (priorityA === priorityB) {
                    return a.localeCompare(b);
                }

                // Otherwise, sort by priority
                return priorityA - priorityB;
            })
            .join('\n');
    }
}