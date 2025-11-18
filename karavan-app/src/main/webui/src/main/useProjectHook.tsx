import {EventBus} from "@/integration-designer/utils/EventBus";
import {ProjectFile} from "@/api/ProjectModels";
import {DslMetaModel} from "@/integration-designer/utils/DslMetaModel";
import {v4 as uuidv4} from "uuid";
import {CamelUi} from "@/integration-designer/utils/CamelUi";
import {KaravanApi} from "@/api/KaravanApi";
import {useSelectorStore} from "@/integration-designer/DesignerStore";
import {shallow} from "zustand/shallow";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore, useWizardStore} from "@/api/ProjectStore";
import {toSpecialRouteId} from "@/integration-designer/utils/ValidatorUtils";
import {ProjectService} from "@/api/ProjectService";
import { Integration } from "karavan-core/lib/model/IntegrationDefinition";
import {FromDefinition, RouteConfigurationDefinition } from "karavan-core/lib/model/CamelDefinition";
import {CamelDefinitionApiExt } from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ASYNCAPI_FILE_NAME_JSON, FILE_WORDS_SEPARATOR, KARAVAN_DOT_EXTENSION, KARAVAN_FILENAME, OPENAPI_FILE_NAME_JSON} from "karavan-core/lib/contants";
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelDefinitionApi } from "karavan-core/lib/api/CamelDefinitionApi";

export function useProjectHook() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [isRouteTemplate] = useSelectorStore((s) => [s.isRouteTemplate], shallow)
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const [project, tabIndex, setTabIndex, refreshTrace] =
        useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex, s.refreshTrace], shallow);

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
                    const route = CamelDefinitionApi.createRouteDefinition({
                        from: new FromDefinition({uri: dsl.uri}),
                        nodePrefixId: `route${FILE_WORDS_SEPARATOR}${fullUri}`
                    });
                    const routeTemplate = CamelDefinitionApi.createRouteTemplateDefinition({route: route});
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

    function createAsyncApiJsonFile() {

    }

    function onOpenApiButtonClick() {
        const openApiFile = files.filter(f => f.name === OPENAPI_FILE_NAME_JSON)?.at(0);
        setFile('select', openApiFile);
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

    function isOpenApiExists(): boolean {
        const openApiFile = files.filter(f => f.name === OPENAPI_FILE_NAME_JSON)?.at(0);
        return openApiFile !== undefined
    }

    function isAsyncApiExists(): boolean {
        const asyncApiFile = files.filter(f => f.name === ASYNCAPI_FILE_NAME_JSON)?.at(0);
        return asyncApiFile !== undefined
    }

    function refreshData() {
        ProjectService.refreshAllContainerStatuses();
        ProjectService.refreshCamelStatus(project.projectId, config.environment);
        if (tabIndex === 'package') {
            ProjectService.refreshAllDeploymentStatuses();
            ProjectService.refreshImages(project.projectId);
        } else if (tabIndex === 'trace' && refreshTrace) {
            ProjectService.refreshCamelTraces(project.projectId, config.environment);
        }
    }

    function refreshSharedData() {
        ProjectService.refreshSharedData()
    }

    return {createNewRouteFile, createOpenApiRestFile, createNewBean, createNewKamelet, createRouteConfiguration, refreshSharedData,
        createOpenApiJsonFile, isOpenApiExists, createNewRestFile, refreshData, isAsyncApiExists, createAsyncApiJsonFile}
}
