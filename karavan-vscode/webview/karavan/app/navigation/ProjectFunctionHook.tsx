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

export function ProjectFunctionHook() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [isRouteTemplate] = useSelectorStore((s) => [s.isRouteTemplate], shallow)
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)
    const [project, tabIndex, setTabIndex, refreshTrace, fetchCamelStatuses] =
        useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex, s.refreshTrace, s.fetchCamelStatuses], shallow);

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
        
    }

    async function saveFiles(projectId: string, filesToSave: ProjectFile[], afterSuccess?: () => void) {

        // 1. Fetch all existing files for the project once
        
    }

    function saveFile(file: ProjectFile, afterSuccess?: () => void) {
        
    }

    function refreshData() {
        
    }

    function refreshSharedData() {
    
    }

    return {createNewRouteFile, createOpenApiRestFile, createNewBean, createNewKamelet, createRouteConfiguration, refreshSharedData,
         project, createNewRestFile, refreshData, createAsyncApi, createOpenApi}
}
