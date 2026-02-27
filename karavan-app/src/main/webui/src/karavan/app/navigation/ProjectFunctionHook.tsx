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

import {EventBus} from "@features/project/designer/utils/EventBus";
import {ProjectFile} from "@models/ProjectModels";
import {DslMetaModel} from "@features/project/designer/utils/DslMetaModel";
import {v4 as uuidv4} from "uuid";
import {CamelUi} from "@features/project/designer/utils/CamelUi";
import {KaravanApi} from "@api/KaravanApi";
import {Integration} from "@karavan-core/model/IntegrationDefinition";
import {FILE_WORDS_SEPARATOR, KARAVAN_DOT_EXTENSION, KARAVAN_FILENAME, OPENAPI_FILE_NAME_JSON} from "@karavan-core/contants";
import {RouteConfigurationDefinition} from "@karavan-core/model/CamelDefinition";
import {CamelDefinitionApiExt} from "@karavan-core/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "@karavan-core/api/CamelDefinitionYaml";
import {CamelDefinitionApi} from "@karavan-core/api/CamelDefinitionApi";
import {useDesignerStore, useSelectorStore} from "@features/project/designer/DesignerStore";
import {shallow} from "zustand/shallow";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore, useWizardStore} from "@stores/ProjectStore";
import {toSpecialRouteId} from "@features/project/designer/utils/ValidatorUtils";
import {ProjectService} from "@services/ProjectService";
import {useTemplatesStore} from "@stores/SettingsStore";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

export function ProjectFunctionHook() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [isRouteTemplate] = useSelectorStore((s) => [s.isRouteTemplate], shallow)
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)
    const [project, tabIndex, setTabIndex, refreshTrace, fetchCamelStatuses] =
        useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex, s.refreshTrace, s.fetchCamelStatuses], shallow);
    const {fetchTemplateFiles} = useTemplatesStore();
    const { fetchContainers } = useContainerStatusesStore();

    function createRouteConfiguration() {
        const integration = Integration.createNew(KARAVAN_FILENAME.ROUTE_CONFIGURATION);
        const routeConfiguration = new RouteConfigurationDefinition();
        const i = CamelDefinitionApiExt.addRouteConfigurationToIntegration(integration, routeConfiguration);
        const yaml = CamelDefinitionYaml.integrationToYaml(i);
        const file = new ProjectFile(KARAVAN_FILENAME.ROUTE_CONFIGURATION, project.projectId, yaml, Date.now());
        saveNewFile(file, true, 'routes')
    }

    function generateParamUri(dsl: DslMetaModel) {
        const uuid = uuidv4().substring(0, 3)
        const uri = dsl.uri + FILE_WORDS_SEPARATOR +
            (dsl.properties && Object.keys(dsl.properties).length > 0
                ? Object.values(dsl.properties).join(FILE_WORDS_SEPARATOR)
                : uuid);
        return uri
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function createNewRouteFile(dsl: DslMetaModel, parentId: string, position?: number | undefined, fileName?: string) {
        try {
            if (dsl.dsl === 'FromDefinition' && dsl.uri) {
                const paramsUri = generateParamUri(dsl);
                const fullUri = `From${FILE_WORDS_SEPARATOR}${paramsUri}`

                const name = toSpecialRouteId(`from${FILE_WORDS_SEPARATOR}${fullUri}`);
                const fName = (fileName != undefined ? fileName : name) + KARAVAN_DOT_EXTENSION.CAMEL_YAML;
                const route = CamelUi.createRouteFromComponent(dsl.uri, dsl.properties, '');
                const integration = Integration.createNew(fName);
                let i;
                if (isRouteTemplate) {
                    const keys = dsl.properties ? Object.keys(dsl.properties) : [];
                    const key = keys.at(0);
                    const routeId = dsl.properties?.[key] + "Route";
                    const templateId = dsl.properties?.[key] + "RouteTemplate";
                    const route = CamelUi.createRouteFromComponent(dsl.uri, dsl.properties, '');
                    route.id = routeId
                    route.nodePrefixId = routeId
                    const routeTemplate = CamelDefinitionApi.createRouteTemplateDefinition({id: templateId, route: route});
                    i = CamelDefinitionApiExt.addRouteTemplateToIntegration(integration, routeTemplate);
                } else {
                    i = CamelDefinitionApiExt.addStepToIntegration(integration, route, '');
                }

                const yaml = CamelDefinitionYaml.integrationToYaml(i);
                const file = new ProjectFile(fName, project.projectId, yaml, Date.now());
                saveNewFile(file, true, 'routes')
            }
        } catch (e: any) {
            console.error(e);
            EventBus.sendAlert("Error creating file", e.message, "danger");
        }
    }

    function createNewRestFile() {
        try {
            const fileExists = files.find(f => f.name === "rest-api.camel.yaml") !== undefined;
            const uuid = uuidv4().substring(0, 3)
            const fileName = 'rest-api' + (fileExists ? FILE_WORDS_SEPARATOR + uuid : '') + '.camel.yaml';
            const nodePrefixId = 'rest-' + uuid;
            const rest = CamelDefinitionApi.createRestDefinition({
                id: nodePrefixId,
                description: 'Service Example',
                path: 'example',
                consumes: 'application/json',
                produces: 'application/json',
                get: [CamelDefinitionApi.createGetDefinition({to: 'direct:getExample', description: 'GET Example'})],
                post: [CamelDefinitionApi.createPostDefinition({to: 'direct:postExample', description: 'POST Example'})],
                delete: [CamelDefinitionApi.createDeleteDefinition({to: 'direct:deleteExample', description: 'DELETE Example'})],
            });
            const restConfiguration = CamelDefinitionApi.createRestConfigurationDefinition({
                inlineRoutes: false,
            });
            const integration = Integration.createNew(fileName);
            let i = CamelDefinitionApiExt.addRestToIntegration(integration, rest);
            i = CamelDefinitionApiExt.addRestToIntegration(i, restConfiguration);
            const yaml = CamelDefinitionYaml.integrationToYaml(i);
            const file = new ProjectFile(fileName, project.projectId, yaml, Date.now());
            saveNewFile(file, true, 'rest')
        } catch (e: any) {
            EventBus.sendAlert("Error creating file", e.message, "danger");
        }
    }

    function createNewKamelet() {
        setFile('create', undefined, 'kamelet')
    }

    function createNewBean() {
        setShowWizard(true)
    }

    function createOpenApiRestFile() {
        try {
            const fileName = 'openapi-rest-config.camel.yaml';
            const rest = CamelDefinitionApi.createRestDefinition({
                id: 'openApiRestService',
                openApi: CamelDefinitionApi.createOpenApiDefinition({specification: 'classpath://' + OPENAPI_FILE_NAME_JSON})
            });
            const restConfiguration = CamelDefinitionApi.createRestConfigurationDefinition({
                inlineRoutes: false,
            });
            const integration = Integration.createNew(fileName);
            let i = CamelDefinitionApiExt.addRestToIntegration(integration, rest);
            i = CamelDefinitionApiExt.addRestToIntegration(i, restConfiguration);
            const yaml = CamelDefinitionYaml.integrationToYaml(i);
            const file = new ProjectFile(fileName, project.projectId, yaml, Date.now());
            saveNewFile(file, false)
        } catch (e: any) {
            EventBus.sendAlert("Error creating file", e.message, "danger");
        }
    }

    function createOpenApiJsonFile() {

    }

    function createAsyncApi() {

    }

    function createOpenApi() {

    }

    function saveNewFile(file: ProjectFile, openFile: boolean, designerTab?: "routes" | "rest" | "beans" | "kamelet") {
        KaravanApi.saveProjectFile(file, (result, fileRes) => {
            if (result) {
                EventBus.sendAlert("Success", `File ${file.name} successfully created`, "success");
                // ProjectService.refreshProjectData(project.projectId);
                if (file.code && openFile) {
                    setFile('select', file, designerTab);
                    setTabIndex(0);
                } else {
                    setFile("none");
                }
            } else {
                EventBus.sendAlert("Error creating file", fileRes?.response?.data, "danger");
            }
        })
    }

    async function saveFiles(projectId: string, filesToSave: ProjectFile[], afterSuccess?: () => void) {

        // 1. Fetch all existing files for the project once
        KaravanApi.getFiles(projectId, async (existingFiles: ProjectFile[]) => {
            const existingNames = new Set(existingFiles.map(f => f.name));

            // 2. Map each file to a Promise (Update if exists, Create if not)
            const savePromises = filesToSave.map(file => {
                return new Promise<boolean>((resolve) => {
                    const alreadyExists = existingNames.has(file.name);

                    if (alreadyExists) {
                        KaravanApi.putProjectFile(file, (result) => resolve(!!result));
                    } else {
                        KaravanApi.saveProjectFile(file, (result) => resolve(!!result));
                    }
                });
            });

            try {
                // 3. Wait for all individual save/put operations to finish
                const results = await Promise.all(savePromises);
                const allSuccessful = results.every(res => res === true);

                // 4. Final actions after all operations complete
                if (allSuccessful) {
                    afterSuccess?.();
                    EventBus.sendAlert("Success", `All ${filesToSave.length} files processed`, "success");
                } else {
                    const failCount = results.filter(r => !r).length;
                    EventBus.sendAlert("Warning", `${failCount} files failed to save`, "danger");
                }
            } catch (error) {
                EventBus.sendAlert("Error", "A critical error occurred during the batch save", "danger");
            }
        });
    }

    function saveFile(file: ProjectFile, afterSuccess?: () => void) {
        KaravanApi.getProjectFilesByName(file.projectId, file.name, found => {
            if (found) {
                KaravanApi.putProjectFile(file, (result) => {
                    if (result) {
                        afterSuccess?.();
                        EventBus.sendAlert("Success", `File ${file.name} successfully updated`, "success");
                    } else {
                        EventBus.sendAlert("Error updating file", file.name, "danger");
                    }
                })
            } else {
                KaravanApi.saveProjectFile(file, (result, fileRes) => {
                    if (result) {
                        afterSuccess?.();
                        EventBus.sendAlert("Success", `File ${file.name} successfully created`, "success");
                    } else {
                        EventBus.sendAlert("Error creating file", fileRes?.response?.data, "danger");
                    }
                })
            }
        })
    }

    function refreshData() {
        fetchCamelStatuses(project.projectId, config.environment);
        fetchContainers();
        if (tabIndex === "build") {
            ProjectService.refreshAllDeploymentStatuses();
            ProjectService.refreshImages(project.projectId);
        } else if (tabIndex === 'camel' && refreshTrace) {
            ProjectService.refreshCamelTraces(project.projectId, config.environment);
        } if (tabIndex === 'topology') {
        }
    }

    function refreshSharedData() {
        fetchTemplateFiles();
    }

    return {createNewRouteFile, createOpenApiRestFile, createNewBean, createNewKamelet, createRouteConfiguration, refreshSharedData,
         project, createNewRestFile, refreshData, createAsyncApi, createOpenApi}
}
