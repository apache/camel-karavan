import React, {useEffect, useState} from 'react';
import {capitalize, Content, Nav, NavItem, NavList,} from '@patternfly/react-core';
import {RightPanel} from "@shared/ui/RightPanel";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {useFileStore, useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {DeveloperManager} from "@features/project/developer/DeveloperManager";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {ProjectsTab} from "@features/projects/ProjectsTab";
import {ProjectFunctionHook} from "@app/navigation/ProjectFunctionHook";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

export const IntegrationsMenus = ['integrations'] as const;
export type IntegrationsMenu = typeof IntegrationsMenus[number];

export function ProjectsPage() {

    const [fetchProjects, projects, fetchProjectsCommited] = useProjectsStore((s) => [s.fetchProjects, s.projects, s.fetchProjectsCommited], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow);
    const {fetchContainers} = useContainerStatusesStore();
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const [currentMenu, setCurrentMenu] = useState<IntegrationsMenu>(IntegrationsMenus[0]);

    const {refreshSharedData} = ProjectFunctionHook();
    useDataPolling('ProjectPanel', fetchContainers, 10000);

    useEffect(() => {
        fetchProjects();
        fetchProjectsCommited();
        refreshSharedData();
    }, []);

    function title() {
        return (<Content component="h2">Projects</Content>)
    }

    const onNavSelect = (_: any, selectedItem: {
                             groupId: number | string;
                             itemId: number | string;
                             to: string;
                         }
    ) => {
        const menu = selectedItem.itemId;
        setCurrentMenu(menu as IntegrationsMenu);
        const isBuildIn = BUILD_IN_PROJECTS.includes(menu?.toString());
        if (isBuildIn) {
            const p = projects.find(p => p.projectId === menu);
            if (p) {
                setProject(p, "select");
            }
        }
        setFile('none', undefined);
    };

    function getNavigation() {
        return (
            <Nav onSelect={onNavSelect} aria-label="Nav" variant="horizontal">
                <NavList>
                    {IntegrationsMenus.map((item, i) => {
                        return (
                            <NavItem key={item} preventDefault itemId={item} isActive={currentMenu === item} to={"#"}>
                                {capitalize(item?.toString())}
                            </NavItem>
                        )
                    })}
                </NavList>
            </Nav>
        )
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={undefined}
            mainPanel={
                <div className="right-panel-card">
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        {!showFilePanel && currentMenu === 'integrations' && <ProjectsTab/>}
                        {showFilePanel && <DeveloperManager/>}
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}