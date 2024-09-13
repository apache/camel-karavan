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
import {FilesTab} from "./files/FilesTab";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore, useWizardStore} from "../api/ProjectStore";
import {DashboardTab} from "./dashboard/DashboardTab";
import {TraceTab} from "./trace/TraceTab";
import {ProjectBuildTab} from "./builder/ProjectBuildTab";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {ImagesPanel} from "./builder/ImagesPanel";
import {ProjectContainerTab} from "./container/ProjectContainerTab";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {TopologyTab} from "../topology/TopologyTab";
import {Buffer} from "buffer";
import {BUILD_IN_PROJECTS, ProjectType} from "../api/ProjectModels";
import {ReadmeTab} from "./readme/ReadmeTab";
import {BeanWizard} from "./beans/BeanWizard";
import {CreateIntegrationModal} from "./files/CreateIntegrationModal";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files, setFiles, setSelectedFileNames] = useFilesStore((s) => [s.files, s.setFiles, s.setSelectedFileNames], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)
    const isDev = config.environment === 'dev';

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

    function selectFile(fileName: string) {
        const file = files.filter(f => f.name === fileName)?.at(0);
        if (file) {
            setFile('select', file);
        }
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';

    const iFiles = files.map(f => new IntegrationFile(f.name, f.code));
    const codes = iFiles.map(f => f.code).join("");
    const key = Buffer.from(codes).toString('base64')

    return isTopology
        ? (
            <>
                <TopologyTab key={key}
                             hideToolbar={false}
                             files={files.map(f => new IntegrationFile(f.name, f.code))}
                             onClickAddRoute={() => setFile('create', undefined, 'routes')}
                             onClickAddREST={() => setFile('create', undefined, 'rest')}
                             onClickAddKamelet={() => setFile('create', undefined, 'kamelet')}
                             onClickAddBean={() => {
                                 // setFile('create', undefined, 'beans');
                                 setShowWizard(true)
                             }}
                             onSetFile={(fileName) => selectFile(fileName)}
                             isDev={isDev}
                />
                <CreateIntegrationModal/>
                <BeanWizard/>
            </>
        )
        : (<PageSection padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection isFilled padding={{default: 'noPadding'}} className="scrollable-in">
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    {tab === 'files' && <FlexItem><FilesTab/></FlexItem>}
                    {!buildIn && tab === 'dashboard' && project && <FlexItem><DashboardTab/></FlexItem>}
                    {!buildIn && tab === 'trace' && project && <TraceTab/>}
                    {!buildIn && tab === 'build' && <FlexItem><ProjectBuildTab/></FlexItem>}
                    {!buildIn && tab === 'build' && config.infrastructure !== 'kubernetes' &&
                        <FlexItem><ImagesPanel/></FlexItem>}
                    {!buildIn && tab === 'container' && <FlexItem><ProjectContainerTab/></FlexItem>}
                    {!buildIn && tab === 'container' && config.infrastructure !== 'kubernetes' &&
                        <FlexItem><ImagesPanel/></FlexItem>}
                    {!buildIn && tab === 'readme' && <FlexItem><ReadmeTab/></FlexItem>}
                </Flex>
            </PageSection>
        </PageSection>)
}
