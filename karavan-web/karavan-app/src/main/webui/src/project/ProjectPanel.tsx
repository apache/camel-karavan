import React, {useEffect} from 'react';
import {
    Flex,
    FlexItem, Tabs, Tab
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {FilesTab} from "./files/FilesTab";
import {useProjectStore} from "../api/ProjectStore";
import {DashboardTab} from "./dashboard/DashboardTab";
import {TraceTab} from "./trace/TraceTab";
import {ProjectBuildTab} from "./build/ProjectBuildTab";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {ImagesPanel} from "./build/ImagesPanel";
import {ContainerButtons} from "./container/ContainerButtons";
import {ProjectContainerTab} from "./container/ProjectContainerTab";

export function ProjectPanel () {

    const [project,tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow );

    useEffect(() => {
        onRefresh();
    }, [project]);

    function onRefresh () {
        if (project.projectId) {
            ProjectService.refreshProjectData(project.projectId);
        }
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    const buildIn = isBuildIn();
    return (
        <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
            <FlexItem className="project-tabs">
                {!buildIn && <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                    <Tab eventKey="files" title="Files"/>
                    <Tab eventKey="dashboard" title="Dashboard"/>
                    <Tab eventKey="trace" title="Trace"/>
                    <Tab eventKey="build" title="Build"/>
                    <Tab eventKey="container" title="Container"/>
                </Tabs>}
            </FlexItem>
            <FlexItem>
                {buildIn && tab === 'files' && <FilesTab/>}
                {!buildIn &&
                    <>
                        {tab === 'files' && <FilesTab/>}
                        {tab === 'dashboard' && project && <DashboardTab/>}
                        {tab === 'trace' && project && <TraceTab/>}
                        {tab === 'build' && <ProjectBuildTab/>}
                        {tab === 'build' && <ImagesPanel/>}
                        {tab === 'container' && <ProjectContainerTab/>}
                    </>
                }
            </FlexItem>
        </Flex>
    )
}
