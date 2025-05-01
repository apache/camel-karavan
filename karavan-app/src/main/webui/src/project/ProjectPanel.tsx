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

import React, {useEffect} from 'react';
import {
    Flex,
    FlexItem, PageSection
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore, useWizardStore} from "../api/ProjectStore";
import {PackageTab} from "./package/PackageTab";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {ImagesPanel} from "./package/ImagesPanel";
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {TopologyTab} from "../topology/TopologyTab";
import {Buffer} from "buffer";
import {BUILD_IN_PROJECTS, ProjectFile, ProjectType} from "../api/ProjectModels";
import {ReadmeTab} from "./readme/ReadmeTab";
import {BeanWizard} from "./beans/BeanWizard";
import {CreateIntegrationModal} from "./files/CreateIntegrationModal";
import {TraceTab} from "./trace/TraceTab";
import {DslSelector} from "../designer/selector/DslSelector";
import {useSelectorStore} from "../designer/DesignerStore";
import {DslMetaModel} from "../designer/utils/DslMetaModel";
import {v4 as uuidv4} from "uuid";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {FromDefinition, RouteConfigurationDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {KaravanApi} from "../api/KaravanApi";
import {EventBus} from "../designer/utils/EventBus";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {FilesTab} from "./files/FilesTab";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files, setFiles, setSelectedFileNames] = useFilesStore((s) => [s.files, s.setFiles, s.setSelectedFileNames], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const [showSelector, isRouteTemplate] = useSelectorStore((s) => [s.showSelector, s.isRouteTemplate], shallow)
    const isDev = config.environment === 'dev';

    const iFiles = files.map(f => new IntegrationFile(f.name, f.code));
    const codes = iFiles.map(f => f.code).join("");
    const key = Buffer.from(codes).toString('base64');

    useEffect(() => {
        onRefresh();
    }, [project.projectId]);

    function onRefresh() {
        if (project.projectId) {
            setFiles([]);
            setSelectedFileNames([]);
            ProjectService.refreshProjectData(project.projectId);
            setTab(project.type !== ProjectType.normal ? 'files' : tab);
        }
    }

    function isBuildIn(): boolean {
        return BUILD_IN_PROJECTS.includes(project.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';

    function createRouteConfiguration() {
        const fileName = 'route-configuration.camel.yaml';
        const integration = Integration.createNew(fileName);
        const routeConfiguration = new RouteConfigurationDefinition();
        const i = CamelDefinitionApiExt.addRouteConfigurationToIntegration(integration, routeConfiguration);
        const yaml = CamelDefinitionYaml.integrationToYaml(i);
        const file = new ProjectFile(fileName, project.projectId, yaml, Date.now());
        saveNewFile(file, 'routes')
    }

    function createNewRouteFile(dsl: DslMetaModel, parentId: string) {
        try {
            if (dsl.dsl === 'FromDefinition') {
                const uuid = uuidv4().substring(0, 3)
                const simpleUri = dsl.uri?.replace('kamelet:', '');
                const name = 'from-' + simpleUri;
                const fileName = name + '-' + uuid + '.camel.yaml';
                const nodePrefixId = 'route-' + uuid;
                const route = CamelDefinitionApi.createRouteDefinition({
                    id: nodePrefixId,
                    nodePrefixId: nodePrefixId,
                    description: CamelUtil.capitalizeName(name.replace('-', ' ')),
                    from: new FromDefinition({uri: dsl.uri}),
                });
                const integration = Integration.createNew(fileName);
                let i;
                if (isRouteTemplate) {
                    const route = CamelDefinitionApi.createRouteDefinition({
                        from: new FromDefinition({uri: dsl.uri}),
                        nodePrefixId: 'route-' + uuidv4().substring(0, 3)
                    });
                    const routeTemplate = CamelDefinitionApi.createRouteTemplateDefinition({route: route});
                     i = CamelDefinitionApiExt.addRouteTemplateToIntegration(integration, routeTemplate);
                } else {
                     i = CamelDefinitionApiExt.addStepToIntegration(integration, route, '');
                }

                const yaml = CamelDefinitionYaml.integrationToYaml(i);
                const file = new ProjectFile(fileName, project.projectId, yaml, Date.now());
                saveNewFile(file, 'routes')
            }
        } catch (e: any) {
            EventBus.sendAlert("Error creating file", e.message, "danger");
        }
    }

    function createNewRestFile() {
        try {
            const fileExists = files.find(f => f.name === "rest-api.camel.yaml") !== undefined;
            const uuid = uuidv4().substring(0, 3)
            const fileName = 'rest-api' + (fileExists ? '-' + uuid : '') + '.camel.yaml';
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
            saveNewFile(file, 'rest')
        } catch (e: any) {
            EventBus.sendAlert("Error creating file", e.message, "danger");
        }
    }

    function saveNewFile(file: ProjectFile, designerTab?: "routes" | "rest" | "beans" | "kamelet") {
        KaravanApi.saveProjectFile(file, (result, fileRes) => {
            if (result) {
                EventBus.sendAlert("Success", "File successfully created", "success");
                ProjectService.refreshProjectData(project.projectId);
                if (file.code) {
                    setFile('select', file, designerTab);
                } else {
                    setFile("none");
                }
            } else {
                EventBus.sendAlert("Error creating file", fileRes?.response?.data, "danger");
            }
        })
    }
    return isTopology
        ? (
            <>
                <TopologyTab key={key}
                             hideToolbar={false}
                             files={files.map(f => new IntegrationFile(f.name, f.code))}
                             onClickAddRouteConfiguration={() => createRouteConfiguration()}
                             onClickAddREST={() => createNewRestFile()}
                             onClickAddKamelet={() => setFile('create', undefined, 'kamelet')}
                             onClickAddBean={() => {
                                 setShowWizard(true)
                             }}
                             isDev={isDev}
                />
                <CreateIntegrationModal/>
                {showSelector && <DslSelector onDslSelect={createNewRouteFile}/>}
                <BeanWizard/>
            </>
        )
        : (<PageSection padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection isFilled padding={{default: 'noPadding'}} className="scrollable-in">
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    {tab === 'files' && <FlexItem><FilesTab/></FlexItem>}
                    {!buildIn && tab === 'trace' && project && <TraceTab/>}
                    {!buildIn && tab === 'package' && <FlexItem><PackageTab/></FlexItem>}
                    {!buildIn && tab === 'package' && config.infrastructure !== 'kubernetes' && <FlexItem><ImagesPanel/></FlexItem>}
                    {!buildIn && tab === 'readme' && <FlexItem><ReadmeTab/></FlexItem>}
                </Flex>
            </PageSection>
        </PageSection>)
}

