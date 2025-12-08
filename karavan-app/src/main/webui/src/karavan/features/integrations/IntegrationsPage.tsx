import React, {useEffect, useState} from 'react';
import {capitalize, Content, Nav, NavItem, NavList,} from '@patternfly/react-core';
import {RightPanel} from "@shared/ui/RightPanel";
import {ProjectService} from "@services/ProjectService";
import {BUILD_IN_PROJECTS, Project} from "@models/ProjectModels";
import {useFileStore, useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {DeveloperManager} from "@features/integration/developer/DeveloperManager";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {ProjectsTab} from "@features/integrations/ProjectsTab";
import {KaravanApi} from "@api/KaravanApi";
import {ProjectsToolbar} from "@features/integrations/ProjectsToolbar";
import {SettingsToolbar} from "@features/integrations/SettingsToolbar";
import {FilesTabWithComplexity} from "@features/integration/files/FilesTabWithComplexity";

export const IntegrationsMenus = ['projects', 'kamelets', 'configuration', 'templates'] as const;
export type IntegrationsMenu = typeof IntegrationsMenus[number];

export function IntegrationsPage() {

    const [setProjects, projects] = useProjectsStore((s) => [s.setProjects, s.projects], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow);
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const [currentMenu, setCurrentMenu] = useState<IntegrationsMenu>(IntegrationsMenus[0]);

    useEffect(() => {
        KaravanApi.getProjects((projects: Project[]) => {
            setProjects(projects);
        });
        const interval1 = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 2000)
        return () => {
            clearInterval(interval1);
        }
    }, []);

    function title() {
        return (<Content component="h2">Integrations</Content>)
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
            tools={currentMenu === 'projects' ? <ProjectsToolbar/> : <SettingsToolbar/>}
            mainPanel={
                <div className="right-panel-card">
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        {!showFilePanel && currentMenu === 'projects' && <ProjectsTab/>}
                        {!showFilePanel && currentMenu === 'kamelets' && <FilesTabWithComplexity />}
                        {!showFilePanel && currentMenu === 'configuration' && <FilesTabWithComplexity />}
                        {!showFilePanel && currentMenu === 'templates' && <FilesTabWithComplexity />}
                        {showFilePanel && <DeveloperManager/>}
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}