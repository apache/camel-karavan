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
import {shallow} from "zustand/shallow";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {useAppConfigStore, useFilesStore, useProjectStore} from '@/api/ProjectStore';
import {useSelectorStore} from '@/integration-designer/DesignerStore';
import {ProjectService} from '@/api/ProjectService';
import {BUILD_IN_PROJECTS, ProjectType} from '@/api/ProjectModels';
import {TopologyTab} from '@/integration-topology/TopologyTab';
import {CreateIntegrationModal} from '@/integration/files/CreateIntegrationModal';
import {DslSelector} from '@/integration-designer/selector/DslSelector';
import {BeanWizard} from '@/integration/beans/BeanWizard';
import {PackageTab} from '@/integration/package/PackageTab';
import {ImagesPanel} from "@/integration/package/ImagesPanel";
import {ReadmeTab} from "@/integration/readme/ReadmeTab";
import {FilesTabWithComplexity} from '@/integration/FilesTabWithComplexity';
import {useSearchStore} from "@/api/SearchStore";
import {ASYNCAPI_FILE_NAME_JSON, OPENAPI_FILE_NAME_JSON} from "karavan-core/lib/contants";
import {useProjectFunctions} from "@/integration/ProjectContext";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTabIndex] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [files, setFiles, setSelectedFileNames] = useFilesStore((s) => [s.files, s.setFiles, s.setSelectedFileNames], shallow);
    const [search, searchResults] = useSearchStore((s) => [s.search, s.searchResults], shallow)
    const [showSelector] = useSelectorStore((s) => [s.showSelector], shallow)

    const {createNewRouteFile} = useProjectFunctions();

    const filedFound = searchResults.filter(s => s.projectId === project.projectId)?.at(0)?.files || [];
    const iFiles = files
        .filter(f => f.name.endsWith('.camel.yaml'))
        .filter(f => search === '' || filedFound.includes(f.name))
        .map(f => new IntegrationFile(f.name, f.code));
    const openApiFile = files.filter(f => f.name === OPENAPI_FILE_NAME_JSON)?.at(0);
    const openApiJson = openApiFile?.code;
    const asyncApiFile = files.filter(f => f.name === ASYNCAPI_FILE_NAME_JSON)?.at(0);
    const asyncApiJson = asyncApiFile?.code;

    useEffect(() => {
        onRefresh();
    }, [project]);

    function onRefresh() {
        if (project.projectId) {
            setFiles([]);
            setSelectedFileNames([]);
            ProjectService.refreshProjectData(project.projectId);
            setTabIndex(project.type !== ProjectType.integration ? 'files' : tab);
        }
    }

    function isBuildIn(): boolean {
        return BUILD_IN_PROJECTS.includes(project.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';

    return isTopology
        ? (<>
                <TopologyTab openApiJson={openApiJson}
                             asyncApiJson={asyncApiJson}
                             hideToolbar={false}
                             files={iFiles}
                />
                <CreateIntegrationModal/>
                {showSelector && <DslSelector onDslSelect={createNewRouteFile} showFileNameInput={true}/>}
                <BeanWizard/>
            </>
        )
        : (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {tab === 'files' && <FilesTabWithComplexity/>}
                {!buildIn && tab === 'package' && <PackageTab/>}
                {!buildIn && tab === 'package' && config.infrastructure !== 'kubernetes' && <ImagesPanel/>}
                {!buildIn && tab === 'readme' && <ReadmeTab/>}
            </div>
        )
}

