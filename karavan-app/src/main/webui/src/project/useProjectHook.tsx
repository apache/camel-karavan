import './OpenApiDesigner.css'
import {EventBus} from "@/designer/utils/EventBus";
import {ProjectFile} from "@/api/ProjectModels";
import {DslMetaModel} from "@/designer/utils/DslMetaModel";
import {v4 as uuidv4} from "uuid";
import {CamelUi} from "@/designer/utils/CamelUi";
import {KaravanApi} from "@/api/KaravanApi";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {FILE_WORDS_SEPARATOR, KARAVAN_DOT_EXTENSION, KARAVAN_FILENAME, OPENAPI_FILE_NAME_JSON} from "karavan-core/lib/contants";
import {FromDefinition, RouteConfigurationDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {useDesignerStore, useSelectorStore} from "@/designer/DesignerStore";
import {shallow} from "zustand/shallow";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore, useWizardStore} from "@/api/ProjectStore";

export function useProjectHook() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTabIndex] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [files, setFiles, setSelectedFileNames] = useFilesStore((s) => [s.files, s.setFiles, s.setSelectedFileNames], shallow);
    const [showSelector, isRouteTemplate] = useSelectorStore((s) => [s.showSelector, s.isRouteTemplate], shallow)
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)

    function createRouteConfiguration() {
        const integration = Integration.createNew(KARAVAN_FILENAME.ROUTE_CONFIGURATION);
        const routeConfiguration = new RouteConfigurationDefinition();
        const i = CamelDefinitionApiExt.addRouteConfigurationToIntegration(integration, routeConfiguration);
        const yaml = CamelDefinitionYaml.integrationToYaml(i);
        const file = new ProjectFile(KARAVAN_FILENAME.ROUTE_CONFIGURATION, project.projectId, yaml, Date.now());
        saveNewFile(file, true, 'routes')
    }

    function createNewRouteFile(dsl: DslMetaModel) {
        try {
            if (dsl.dsl === 'FromDefinition' && dsl.uri) {
                const uuid = uuidv4().substring(0, 3)
                const simpleUri = dsl.uri?.replace('kamelet:', '');
                const paramsUri =
                    dsl.properties && Object.keys(dsl.properties).length > 0
                        ? Object.values(dsl.properties).join(FILE_WORDS_SEPARATOR)
                        : uuid;

                const fullUri = paramsUri
                    ? `${simpleUri}${FILE_WORDS_SEPARATOR}${paramsUri}`
                    : simpleUri;

                const name = `from${FILE_WORDS_SEPARATOR}${fullUri}`;
                const fileName = name + FILE_WORDS_SEPARATOR + KARAVAN_DOT_EXTENSION.CAMEL_YAML;
                const nodePrefixId = `route${FILE_WORDS_SEPARATOR}` + fullUri;
                const route = CamelUi.createRouteFromComponent(dsl.uri, '', '');
                route.id = nodePrefixId;
                route.nodePrefixId = nodePrefixId;
                route.description = CamelUtil.capitalizeName(name.replace(FILE_WORDS_SEPARATOR, ' '));
                const integration = Integration.createNew(fileName);
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
                const file = new ProjectFile(fileName, project.projectId, yaml, Date.now());
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


    function onOpenApiButtonClick() {
        const openApiFile = files.filter(f => f.name === OPENAPI_FILE_NAME_JSON)?.at(0);
        if (openApiFile === undefined) {
            createOpenApiRestFile();
            setDesignerSwitch(true);
            const code = "{}";
            const openApiFile = new ProjectFile(OPENAPI_FILE_NAME_JSON, project.projectId, code, Date.now());
            saveNewFile(openApiFile, true);
        } else {
            setFile('select', openApiFile);
        }
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

    return {createNewRouteFile, createOpenApiRestFile, createNewBean, createNewKamelet, createRouteConfiguration}
}
