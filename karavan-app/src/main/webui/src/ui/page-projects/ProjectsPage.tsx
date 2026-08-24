import React, {useEffect, useState} from 'react';
import {capitalize, Content, Tab, Tabs, TabsComponent, TabTitleText,} from '@patternfly/react-core';
import {RightPanel} from "@shared/ui/RightPanel";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {useFileStore, useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {DeveloperManager} from "@developer/DeveloperManager";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {ProjectsTab} from "./table/ProjectsTab";
import {ProjectFunctionHook} from "@page-project/ProjectFunctionHook";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";
import {ArchitectureTab} from "./architecture/ArchitectureTab";
import "./ProjectsPage.css"
import {TabProps} from "@patternfly/react-core/src/components/Tabs/Tab";
import {useDashboardStore} from "@stores/DashboardStore";
import CreateProjectDrawerPanel from "./CreateProjectDrawerPanel";

export const IntegrationsMenus = ['integrations', 'architecture'] as const;
export type IntegrationsMenu = typeof IntegrationsMenus[number];

export function ProjectsPage() {

    const [fetchProjects, projects, fetchProjectsCommited, fetchProjectLabels] =
        useProjectsStore((s) => [s.fetchProjects, s.projects, s.fetchProjectsCommited, s.fetchProjectLabels], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow);
    const {fetchContainers} = useContainerStatusesStore();
    const {showSideBar, setShowSideBar} = useDashboardStore();
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const [currentMenu, setCurrentMenu] = useState<IntegrationsMenu>(IntegrationsMenus[0]);

    const {refreshSharedData} = ProjectFunctionHook();
    useDataPolling('ProjectPanel', fetchContainers, 7000);

    useEffect(() => {
        fetchProjects();
        fetchProjectsCommited();
        refreshSharedData();
        fetchProjectLabels();
        return () => {
            setShowSideBar(null);
        }
    }, []);

    function title() {
        return (<Content component="h2">Projects</Content>)
    }

    const onNavSelect = (event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: TabProps['eventKey']) => {
        setCurrentMenu(eventKey as IntegrationsMenu);
        const isBuildIn = BUILD_IN_PROJECTS.includes(eventKey?.toString());
        if (isBuildIn) {
            const p = projects.find(p => p.projectId === eventKey);
            if (p) {
                setProject(p, "select");
            }
        }
        setFile('none', undefined);
    };


    function getNavigation() {
        return (
            <Tabs
                onSelect={onNavSelect}
                isNav
                component={TabsComponent.nav}
                activeKey={currentMenu}
            >
                {IntegrationsMenus.map((item, i) =>
                    <Tab
                        key={item}
                        eventKey={item}
                        title={<TabTitleText>{capitalize(item)}</TabTitleText>}
                    />
                )}
            </Tabs>
        )
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={undefined}
            drawerPanel={<CreateProjectDrawerPanel/>}
            mainPanel={
                <ErrorBoundaryWrapper onError={error => console.error(error)}>
                    {!showFilePanel && currentMenu === 'architecture' && <ArchitectureTab/>}
                    {!showFilePanel && currentMenu === 'integrations' && <ProjectsTab/>}
                    {showFilePanel && <DeveloperManager/>}
                </ErrorBoundaryWrapper>
            }
        />
    )
}