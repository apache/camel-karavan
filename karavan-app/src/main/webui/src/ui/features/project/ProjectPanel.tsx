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
import {JvmTab} from "@features/project/project-jvm/JvmTab";
import {ContainersTab} from "@features/project/project-containers/ContainersTab";
import {CamelTab} from "@features/project/project-camel/CamelTab";
import {PodTab} from "@features/project/project-pod/PodTab";
import "./ProjectPanel.css"

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
    const isTopology = tab === 'architecture';

    return isTopology
        ? (<div className="project-architecture-page">
                <TopologyTab asyncApiJson={asyncApiJson}/>
                <CreateProjectModal/>
                {showSelector && <DslSelector onDslSelect={createNewRouteFile} showFileNameInput={true}/>}
                <BeanWizard/>
            </div>
        )
        : (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {tab === 'source' && <SourcesTab/>}
                {!buildIn && tab === "build" && <BuildTab/>}
                {/*{!buildIn && tab === "build" && config.infrastructure !== 'kubernetes' && <ImagesPanel/>}*/}
                {!buildIn && tab === 'readme' && <ReadmeTab/>}
                {!buildIn && tab === 'pod' && <ProjectContainersContextProvider><PodTab/></ProjectContainersContextProvider>}
                {!buildIn && tab === 'log' && <ProjectContainersContextProvider><ContainerLogTab/></ProjectContainersContextProvider>}
                {!buildIn && tab === 'JVM' && <ProjectContainersContextProvider><JvmTab/></ProjectContainersContextProvider>}
                {!buildIn && tab === 'containers' && <ProjectContainersContextProvider><ContainersTab/></ProjectContainersContextProvider>}
                {!buildIn && tab === 'camel' && <ProjectContainersContextProvider><CamelTab/></ProjectContainersContextProvider>}
            </div>
        )
}

