import React, {useEffect, useState} from 'react';
import {
    Flex,
    FlexItem, Tabs, Tab
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {FilesTab} from "./files/FilesTab";
import {useProjectStore} from "../api/ProjectStore";
import {DashboardTab} from "./dashboard/DashboardTab";
import {TraceTab} from "./trace/TraceTab";
import {ProjectPipelineTab} from "./pipeline/ProjectPipelineTab";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";

export const ProjectPanel = () => {

    const [tab, setTab] = useState<string | number>('files');
    const [project] = useProjectStore((state) => [state.project], shallow )

    useEffect(() => {
        onRefresh();
    });

    function onRefresh () {
        ProjectService.refreshProjectData();
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates'].includes(project.projectId);
    }

    const buildIn = isBuildIn();
    return (
        <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
            <FlexItem className="project-tabs">
                {buildIn && <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                    <Tab eventKey="files" title="Files"/>
                </Tabs>}
                {!buildIn && <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                    <Tab eventKey="files" title="Files"/>
                    <Tab eventKey="dashboard" title="Dashboard"/>
                    <Tab eventKey="trace" title="Trace"/>
                    <Tab eventKey="pipeline" title="Pipeline"/>
                </Tabs>}
            </FlexItem>
            <FlexItem>
                {buildIn && tab === 'files' && <FilesTab/>}
                {!buildIn &&
                    <>
                        {tab === 'files' && <FilesTab/>}
                        {tab === 'dashboard' && project && <DashboardTab/>}
                        {tab === 'trace' && project && <TraceTab/>}
                        {tab === 'pipeline' && <ProjectPipelineTab/>}
                    </>
                }
            </FlexItem>
        </Flex>
    )
}
