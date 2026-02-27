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
import {shallow} from "zustand/shallow";
import {useFilesStore, useProjectStore} from '@stores/ProjectStore';
import {useSelectorStore} from '@features/project/designer/DesignerStore';
import {ProjectService} from '@services/ProjectService';
import {BUILD_IN_PROJECTS, ProjectType} from '@models/ProjectModels';
import {TopologyTab} from '@features/project/project-topology/TopologyTab';
import {CreateProjectModal} from '@features/project/files/CreateProjectModal';
import {DslSelector} from '@features/project/designer/selector/DslSelector';
import {BeanWizard} from '@features/project/beans/BeanWizard';
import {BuildTab} from '@features/project/project-build/BuildTab';
import {ReadmeTab} from "@features/project/readme/ReadmeTab";
import {SourcesTab} from '@features/project/files/SourcesTab';
import {useProjectFunctions} from "@features/project/ProjectContext";
import {ContainerLogTab} from "@features/project/ContainerLogTab";
import {ProjectContainersContextProvider} from "@features/project/ProjectContainersContextProvider";
import {ContainersTab} from "@features/project/project-containers/ContainersTab";
import {PodTab} from "@features/project/project-pod/PodTab";

export function ProjectPanel() {

    const [project, tab, setTabIndex] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [setFiles, setSelectedFileNames] = useFilesStore((s) => [s.setFiles, s.setSelectedFileNames], shallow);
    const [showSelector] = useSelectorStore((s) => [s.showSelector], shallow)
    const [asyncApiJson] = useState<string>('');

    const {createNewRouteFile, refreshSharedData} = useProjectFunctions();

    useEffect(() => {
        onRefresh();
    }, [project]);

    function onRefresh() {
        if (project?.projectId) {
            setFiles([]);
            setSelectedFileNames([]);
            ProjectService.refreshProjectData(project.projectId);
            setTabIndex(project.type !== ProjectType.integration ? 'source' : tab);
            refreshSharedData();
        }
    }

    function isBuildIn(): boolean {
        return BUILD_IN_PROJECTS.includes(project.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';

    return isTopology
        ? (<>
                <TopologyTab asyncApiJson={asyncApiJson}/>
                <CreateProjectModal/>
                {showSelector && <DslSelector onDslSelect={createNewRouteFile} showFileNameInput={true}/>}
                <BeanWizard/>
            </>
        )
        : (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {tab === 'source' && <SourcesTab/>}
                {!buildIn && tab === "build" && <BuildTab/>}
                {/*{!buildIn && tab === "build" && config.infrastructure !== 'kubernetes' && <ImagesPanel/>}*/}
                {!buildIn && tab === 'readme' && <ReadmeTab/>}
                {!buildIn && tab === 'pod' && <ProjectContainersContextProvider><PodTab/></ProjectContainersContextProvider>}
                {!buildIn && tab === 'log' && <ProjectContainersContextProvider><ContainerLogTab/></ProjectContainersContextProvider>}
                {!buildIn && tab === 'containers' && <ProjectContainersContextProvider><ContainersTab/></ProjectContainersContextProvider>}
            </div>
        )
}

