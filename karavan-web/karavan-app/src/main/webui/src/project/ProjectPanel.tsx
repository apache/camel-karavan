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

import React, {useEffect, useState} from 'react';
import {
    Flex,
    FlexItem, Modal, ModalVariant, PageSection
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
import {IntegrationFile} from "../topology/TopologyStore";
import {TopologyTab} from "../topology/TopologyTab";
import {Buffer} from "buffer";
import {CreateFileModal} from "./files/CreateFileModal";
import {ProjectType} from "../api/ProjectModels";
import {ReadmeTab} from "./readme/ReadmeTab";
import {BeanWizard} from "./beans/BeanWizard";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [setShowWizard] = useWizardStore((s) => [s.setShowWizard], shallow)

    useEffect(() => {
        onRefresh();
    }, [project.projectId]);

    function onRefresh() {
        if (project.projectId) {
            ProjectService.refreshProjectData(project.projectId);
            setTab(project.type === ProjectType.normal ? 'topology' : 'files')
        }
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
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
                             onClickAddBean={() => {
                                 // setFile('create', undefined, 'beans');
                                 setShowWizard(true)
                             }}
                             onSetFile={(fileName) => selectFile(fileName)}
                />
                <CreateFileModal types={['INTEGRATION']} isKameletsProject={false}/>
                <BeanWizard/>
            </>
        )
        : (<PageSection padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection isFilled padding={{default: 'noPadding'}} className="scrollable-in">
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    {tab === 'files' && <FlexItem><FilesTab/></FlexItem>}
                    {!buildIn && tab === 'dashboard' && project && <FlexItem><DashboardTab/></FlexItem>}
                    {!buildIn && tab === 'trace' && project && <FlexItem><TraceTab/></FlexItem>}
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
