import React, {useEffect} from 'react';
import {shallow} from "zustand/shallow";
import {useFilesStore, useProjectStore} from '@stores/ProjectStore';
import {ProjectService} from '@services/ProjectService';
import {BUILD_IN_PROJECTS, ProjectType} from '@models/ProjectModels';
import {TopologyTab} from './project-topology/TopologyTab';
import {CreateProjectModal} from './files/CreateProjectModal';
import {BeanWizard} from './beans/BeanWizard';
import {BuildTab} from './project-build/BuildTab';
import {SourcesTab} from './files/SourcesTab';
import {ContainerLogTab} from "./logs/ContainerLogTab";
import {ProjectContainersContextProvider} from "./ProjectContainersContextProvider";
import {ContainersTab} from "./project-containers/ContainersTab";
import "./ProjectPanel.css"
import {ProjectFunctionHook} from "./ProjectFunctionHook";

function ProjectPanel() {

    const [project, tabIndex, setTabIndex] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [setFiles, setSelectedFileNames] = useFilesStore((s) => [s.setFiles, s.setSelectedFileNames], shallow);

    const {refreshSharedData} = ProjectFunctionHook();

    useEffect(() => {
        onRefresh();
    }, [project?.projectId]);

    function onRefresh() {
        if (project?.projectId && project.type === ProjectType.integration) {
            setFiles([]);
            setSelectedFileNames([]);
            ProjectService.refreshProjectData(project.projectId);
            setTabIndex(project.type !== ProjectType.integration ? 'source' : tabIndex);
            refreshSharedData();
        }
    }

    function isBuildIn(): boolean {
        return project?.projectId && BUILD_IN_PROJECTS.includes(project?.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tabIndex === 'topology';

    return isTopology
        ? (<div className="project-architecture-page">
                <TopologyTab/>
                <CreateProjectModal/>
                <BeanWizard/>
            </div>
        )
        : (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {tabIndex === 'source' && <SourcesTab/>}
                {!buildIn && tabIndex === "build" && <BuildTab/>}
                {!buildIn && tabIndex === 'log' && <ProjectContainersContextProvider><ContainerLogTab/></ProjectContainersContextProvider>}
                {!buildIn && tabIndex === 'containers' && <ProjectContainersContextProvider><ContainersTab/></ProjectContainersContextProvider>}
            </div>
        )
}

export default ProjectPanel

