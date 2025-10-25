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
import {Flex, FlexItem, PageSection} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore, useWizardStore} from "@/api/ProjectStore";
import {PackageTab} from "./package/PackageTab";
import {ProjectService} from "@/api/ProjectService";
import {shallow} from "zustand/shallow";
import {ImagesPanel} from "./package/ImagesPanel";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {TopologyTab} from "@/topology/TopologyTab";
import {Buffer} from "buffer";
import {BUILD_IN_PROJECTS, ProjectFile, ProjectType} from "@/api/ProjectModels";
import {ReadmeTab} from "./readme/ReadmeTab";
import {BeanWizard} from "./beans/BeanWizard";
import {CreateIntegrationModal} from "./files/CreateIntegrationModal";
import {DslSelector} from "@/designer/selector/DslSelector";
import {useSelectorStore} from "@/designer/DesignerStore";
import {KaravanApi} from "@/api/KaravanApi";
import {EventBus} from "@/designer/utils/EventBus";
import {FilesTab} from "./files/FilesTab";
import {useProjectHook} from "@/project/useProjectHook";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files, setFiles, setSelectedFileNames] = useFilesStore((s) => [s.files, s.setFiles, s.setSelectedFileNames], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const [showSelector, isRouteTemplate] = useSelectorStore((s) => [s.showSelector, s.isRouteTemplate], shallow)

    const projectFunctions = useProjectHook;
    const {createNewRouteFile} = projectFunctions();

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
            setTab(project.type !== ProjectType.integration ? 'files' : tab);
        }
    }

    function isBuildIn(): boolean {
        return BUILD_IN_PROJECTS.includes(project.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';


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
                             files={iFiles}
                             projectFunctions={projectFunctions}
                />
                <CreateIntegrationModal/>
                {showSelector && <DslSelector onDslSelect={createNewRouteFile}/>}
                <BeanWizard/>
            </>
        )
        : (<PageSection hasBodyWrapper={false} padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection hasBodyWrapper={false} isFilled padding={{default: 'noPadding'}} className="scrollable-in">
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    {tab === 'files' && <FlexItem><FilesTab/></FlexItem>}
                    {!buildIn && tab === 'package' && <FlexItem><PackageTab/></FlexItem>}
                    {!buildIn && tab === 'package' && config.infrastructure !== 'kubernetes' && <FlexItem><ImagesPanel/></FlexItem>}
                    {!buildIn && tab === 'readme' && <FlexItem><ReadmeTab/></FlexItem>}
                </Flex>
            </PageSection>
        </PageSection>)
}

