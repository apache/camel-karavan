import {EventBus} from "@designer/utils/EventBus";
import {ProjectFile} from "@models/ProjectModels";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {v4 as uuidv4} from "uuid";
import {CamelUi} from "@designer/utils/CamelUi";
import {KaravanApi} from "@api/KaravanApi";
import {CamelElement, Integration} from "@core/model/IntegrationDefinition";
import {FILE_WORDS_SEPARATOR, KARAVAN_DOT_EXTENSION, KARAVAN_FILENAME, LANDSCAPE_FILE_NAME_JSON, OPENAPI_FILE_NAME_JSON} from "@core/contants";
import {FromDefinition, RouteConfigurationDefinition, RouteDefinition} from "@core/model/CamelDefinition";
import {CamelDefinitionApiExt} from "@core/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import {CamelDefinitionApi} from "@core/api/CamelDefinitionApi";
import {shallow} from "zustand/shallow";
import {useFilesStore, useFileStore, useProjectStore, useSelectedContainerStore, useWizardStore} from "@stores/ProjectStore";
import {ProjectService} from "@services/ProjectService";
import {useProjectInfoStore} from "@stores/useProjectInfoStore";
import {useTemplatesStore} from "@stores/SettingsStore";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";
import {toCamelCase, toSpecialRouteId} from "@designer/utils/ValidatorUtils";
import {useCommandPaletteStore} from "@command-palette/useCommandPaletteStore";
import {useDeveloperToggleStore} from "@developer/toggle/useDeveloperToggleStore";
import {useAppConfig} from "@compass/useConfig";
import {useDeploymentStatusesStore} from "@stores/DeploymentStatusesStore";
import {useKubernetesStore} from "@stores/useKubernetesStore";

export function ProjectFunctionHook() {

    const {environment} = useAppConfig();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [isRouteTemplate] = useCommandPaletteStore((s) => [s.isRouteTemplate], shallow)
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const setDeveloperView = useDeveloperToggleStore((s) => s.setDeveloperView)
    const [project, tabIndex, setTabIndex, refreshTrace, fetchCamelStatuses] =
        useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex, s.refreshTrace, s.fetchCamelStatuses], shallow);
    const fetchTemplateFiles = useTemplatesStore(s => s.fetchTemplateFiles);
    const fetchProjectInfos = useProjectInfoStore(s => s.fetchProjectInfos);
    const fetchProjectContainers = useContainerStatusesStore(s => s.fetchProjectContainers);
    const fetchDeployments = useDeploymentStatusesStore(s => s.fetchDeployments);
    const selectedContainerName = useSelectedContainerStore((s) => s.selectedContainerName);
    const setSelectedContainerName = useSelectedContainerStore((s) => s.setSelectedContainerName);
    const fetchPodEvents = useKubernetesStore((s) => s.fetchPodEvents);
    const clearPodEvents = useKubernetesStore((s) => s.clearPodEvents);
    const containers = useContainerStatusesStore(state => state.containers);
    const projectContainerNames = containers?.filter(c => c.projectId === project?.projectId)?.map(c => c.containerName);

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
        if (project?.projectId !== undefined) {
            createNewRouteFileForProject(dsl, project?.projectId, fileName)
        }
    }

    function createIntegrationRoute(
        id: string,
        fromUri: string,
        parameters: any,
        description: string,
        variableReceive: string,
        variableSend: string,
        steps: CamelElement[]
    ): Integration {
        const filename = "route-" + id;
        const fromId = toCamelCase("from-" + fromUri + "-" + id);
        const routeId = toCamelCase(filename);
        const filenameWithExtension = filename + KARAVAN_DOT_EXTENSION.CAMEL_YAML;
        const newFrom = new FromDefinition({uri: fromUri, id: fromId, variableReceive: variableReceive, parameters: parameters});
        newFrom.steps = [
            CamelDefinitionApi.createLogDefinition({message: `"Receiving:" + variables.${variableReceive}`}),
            ...steps,
            CamelDefinitionApi.createLogDefinition({message: `"Sending:" + variables.${variableSend}`})
        ]
        const route = new RouteDefinition({from: newFrom, description: description, id: routeId, nodePrefixId: routeId});
        const integration = Integration.createNew(filenameWithExtension);
        return CamelDefinitionApiExt.addStepToIntegration(integration, route, '');
    }

    function createDlqRoute(): Integration {
        const fromId = "defaultDLQ";
        const routeId = "route-error-handler";
        const newFrom = new FromDefinition({uri: "direct", id: fromId, parameters: {name: fromId}});
        newFrom.steps = [CamelDefinitionApi.createLogDefinition({message: "exchangeProperties.CamelExceptionCaught"})]
        const route = new RouteDefinition({from: newFrom, description: "Default DLQ", id: routeId, nodePrefixId: routeId});

        const routeConfiguration = CamelDefinitionApi.createRouteConfigurationDefinition({
            errorHandler: CamelDefinitionApi.createErrorHandlerDefinition({
                deadLetterChannel: CamelDefinitionApi.createDeadLetterChannelDefinition({
                    deadLetterUri: "direct:defaultDLQ",
                    redeliveryPolicy: CamelDefinitionApi.createRedeliveryPolicyDefinition({
                        maximumRedeliveries: 0,
                        redeliveryDelay: "500"
                    })
                })
            })
        });

        const filenameWithExtension = "default-error-handler" + KARAVAN_DOT_EXTENSION.CAMEL_YAML;
        let integration = Integration.createNew(filenameWithExtension);
        integration = CamelDefinitionApiExt.addStepToIntegration(integration, route, '');
        integration = CamelDefinitionApiExt.addRouteConfigurationToIntegration(integration, routeConfiguration);
        return integration;
    }

    function saveRoutesForIntegration(integration: Integration, projectId: string) {
        const yaml = CamelDefinitionYaml.integrationToYaml(integration);
        const file = new ProjectFile(integration.metadata.name, projectId, yaml, Date.now());
        saveNewFile(file, false)
    }

    function createRoutesForEmptyProject(dsl: DslMetaModel, projectId: string) {
        const receiveIntegration = createIntegrationRoute( "receive", dsl.uri, dsl.properties, "Receive Route", "receivedData", "receivedObject", [
            CamelDefinitionApi.createUnmarshalDefinition({json: CamelDefinitionApi.createJsonDataFormat({}), variableReceive: "receivedObject", variableSend: "receivedData"}),
            CamelDefinitionApi.createToDefinition({uri: "direct:processing", variableSend: "receivedObject"})
        ]);
        const internalIntegration = createIntegrationRoute( "processing", "direct",  {name: toCamelCase("processing")},"Internal Route", "receivedObject", "sendObject", [
            CamelDefinitionApi.createSetVariableDefinition({name: "sendObject", expression: CamelDefinitionApi.createExpressionDefinition({ groovy: CamelDefinitionApi.createGroovyExpression({expression: "return variables.receivedObject"})}) }),
            CamelDefinitionApi.createToDefinition({uri: "direct:send", variableSend: "sendObject"})
        ]);
        const sendIntegration = createIntegrationRoute( "send", "direct", {name: toCamelCase("send")}, "Send Route", "sendObject", "sendJSON", [
            CamelDefinitionApi.createMarshalDefinition({json: CamelDefinitionApi.createJsonDataFormat({}), variableReceive: "sendObject", variableSend: "sendJSON"})
        ]);
        saveRoutesForIntegration(receiveIntegration, projectId);
        saveRoutesForIntegration(internalIntegration, projectId);
        saveRoutesForIntegration(sendIntegration, projectId);
    }

    function createDlqForEmptyProject(projectId: string) {
        saveRoutesForIntegration(createDlqRoute(), projectId);
    }

    function createNewRouteFileForProject(dsl: DslMetaModel, projectId: string, fileName?: string) {
        try {
            if (fileName !== undefined && dsl === null) {
                const integration = Integration.createNew(fileName);
                const yaml = CamelDefinitionYaml.integrationToYaml(integration);
                const file = new ProjectFile(fileName, projectId, yaml, Date.now());
                saveNewFile(file, true, 'routes');
            } else if (dsl?.dsl === 'FromDefinition' && dsl?.uri) {
                const paramsUri = generateParamUri(dsl);
                const fullUri = `${FILE_WORDS_SEPARATOR}${paramsUri}`
                const name = toSpecialRouteId(`from${FILE_WORDS_SEPARATOR}${fullUri}`);
                const fName = (fileName != undefined ? fileName : name) + KARAVAN_DOT_EXTENSION.CAMEL_YAML;
                const route = CamelUi.createRouteFromComponent(name, dsl.uri, dsl.properties, '');
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
                const file = new ProjectFile(fName, projectId, yaml, Date.now());
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
        createOpenApiRestFileForProject(project.projectId)
    }

    function createOpenApiRestFileForProject(projectId: string) {
        try {
            const fileName = 'openapi-rest-camel.yaml';
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
            const file = new ProjectFile(fileName, projectId, yaml, Date.now());
            saveNewFile(file, false)
        } catch (e: any) {
            EventBus.sendAlert("Error creating file", e.message, "danger");
        }
    }

    function createOpenApi() {
        const openApiFile = files?.filter(f => f.name === OPENAPI_FILE_NAME_JSON)?.at(0);
        if (openApiFile === undefined) {
            createOpenApiForProject(project.projectId);
        } else {
            setFile('select', openApiFile);
        }
    }

    function createOpenApiForProject(projectId: string) {
        createOpenApiRestFileForProject(projectId);
        setDeveloperView('preview');
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
                    const failCount = results?.filter(r => !r).length;
                    EventBus.sendAlert("Warning", `${failCount} files failed to save`, "danger");
                }
            } catch (error) {
                EventBus.sendAlert("Error", "A critical error occurred during the batch save", "danger");
            }
        });
    }

    function saveFile(file: ProjectFile, afterSuccess?: () => void, hideAlert?: boolean) {
        KaravanApi.getProjectFilesByName(file.projectId, file.name, found => {
            if (found) {
                KaravanApi.putProjectFile(file, (result) => {
                    if (result) {
                        afterSuccess?.();
                        if (hideAlert !== true) EventBus.sendAlert("Success", `File ${file.name} successfully updated`, "success");
                    } else {
                        EventBus.sendAlert("Error updating file", file.name, "danger");
                    }
                })
            } else {
                KaravanApi.saveProjectFile(file, (result, fileRes) => {
                    if (result) {
                        afterSuccess?.();
                        if (hideAlert !== true) EventBus.sendAlert("Success", `File ${file.name} successfully created`, "success");
                    } else {
                        EventBus.sendAlert("Error creating file", fileRes?.response?.data, "danger");
                    }
                })
            }
        })
    }

    function isOpenApiExists(): boolean {
        const openApiFile = files?.filter(f => f.name === OPENAPI_FILE_NAME_JSON)?.at(0);
        return openApiFile !== undefined
    }

    function isAsyncApiExists(): boolean {
        const asyncApiFile = files?.filter(f => f.name === LANDSCAPE_FILE_NAME_JSON)?.at(0);
        return asyncApiFile !== undefined
    }

    function refreshData() {
        if (project?.projectId !== undefined) {
            fetchCamelStatuses(project.projectId);
            fetchProjectContainers(project.projectId);
            if (tabIndex === "build") {
                ProjectService.refreshImages(project.projectId);
            } else if (tabIndex === 'containers') {
                fetchDeployments();
                if (selectedContainerName) {
                    if (projectContainerNames?.includes(selectedContainerName)) {
                        fetchPodEvents(selectedContainerName);
                    } else {
                        setSelectedContainerName(projectContainerNames?.at(0));
                    }
                } else {
                    clearPodEvents();
                }
            }
        }
    }

    function refreshSharedData() {
        fetchTemplateFiles();
        fetchProjectInfos();
    }

    return {
        createNewRouteFile, createNewBean, createNewKamelet, createRouteConfiguration, refreshSharedData, saveFile,
        createNewRestFile, isOpenApiExists, createRoutesForEmptyProject, refreshData, createDlqForEmptyProject, createOpenApi, project, createOpenApiForProject
    }
}
