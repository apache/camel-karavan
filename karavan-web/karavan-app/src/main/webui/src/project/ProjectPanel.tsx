import React, {useEffect} from 'react';
import {
    Flex,
    FlexItem, Tabs, Tab, PageSection, PageSectionVariants, Gallery
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {FilesTab} from "./files/FilesTab";
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {DashboardTab} from "./dashboard/DashboardTab";
import {TraceTab} from "./trace/TraceTab";
import {ProjectBuildTab} from "./build/ProjectBuildTab";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {ImagesPanel} from "./build/ImagesPanel";
import {ContainerButtons} from "./container/ContainerButtons";
import {ProjectContainerTab} from "./container/ProjectContainerTab";
import {KameletModal} from "../knowledgebase/kamelets/KameletModal";
import {KameletCard} from "../knowledgebase/kamelets/KameletCard";
import {TopologyTab} from "./topology/TopologyTab";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);

    useEffect(() => {
        onRefresh();
    }, [project]);

    function onRefresh() {
        if (project.projectId) {
            ProjectService.refreshProjectData(project.projectId);
            setTab('files')
        }
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';
    return isTopology
        ? (<TopologyTab/>)
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
                </Flex>
            </PageSection>
        </PageSection>)
}
