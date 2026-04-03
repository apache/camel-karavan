import React, {useEffect, useState} from 'react';
import {capitalize, Content, Nav, NavItem, NavList,} from '@patternfly/react-core';
import {RightPanel} from "@shared/ui/RightPanel";
import {useFilesStore, useFileStore, useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {DeveloperManager} from "@features/project/developer/DeveloperManager";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {SourcesTab} from "@features/project/files/SourcesTab";
import {useParams} from "react-router-dom";
import {SettingsMenu, SettingsMenus, useSettingsStore} from "@stores/SettingsStore";
import {ROUTES} from "@app/navigation/Routes";
import {ProjectFile} from "@models/ProjectModels";

export function SettingsPage() {

    const [projects] = useProjectsStore((s) => [s.projects], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow);
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const [fetchFiles, fetchCommitedFiles] = useFilesStore((s) => [s.fetchFiles, s.fetchCommitedFiles], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const {setCurrentMenu, currentMenu} = useSettingsStore();
    const [key, setKey] = useState<string>();

    let {projectId, fileName} = useParams();

    useEffect(() => {
        window.history.replaceState({}, "", `${ROUTES.SETTINGS}`);
        if (projectId && fileName) {
            selectProject(projectId, fileName);
        } else {
            selectProject(SettingsMenus[0], fileName);
            setCurrentMenu(SettingsMenus[0]);
        }
        return () => {
            setCurrentMenu(SettingsMenus[0]);
        };
    }, []);

    function title() {
        return (<Content component="h2">Settings</Content>)
    }

    const onNavSelect = (_: any, selectedItem: {
                             groupId: number | string;
                             itemId: number | string;
                             to: string;
                         }
    ) => {
        const menu = selectedItem.itemId;
        setCurrentMenu(menu as SettingsMenu);
        selectProject(menu as string, undefined);
        setFile("none", undefined);
    };

    function selectProject(projectId: string, fileName?: string) {
        const p = projects.find(p => p.projectId === projectId);
        if (p) {
            setProject(p, "select");
            fetchFiles(p.projectId).then(value => {
                fetchCommitedFiles(p.projectId).then(_ => {
                    selectFile(value, fileName);
                })
            });
        }
    }

    function selectFile(newFiles: ProjectFile[], fileName?: string) {
        if (fileName) {
            const f = newFiles?.find(file => file.name === fileName);
            setFile('select', f);
        } else {
            setFile('none', undefined);
        }
        setKey(new Date().toLocaleString("en-US"));
    }

    function getNavigation() {
        return (
            <Nav onSelect={onNavSelect} aria-label="Nav" variant="horizontal">
                <NavList>
                    {SettingsMenus.map((item, i) => {
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
                <div key={key} className="right-panel-card">
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        {!showFilePanel && currentMenu === 'templates' && <SourcesTab />}
                        {!showFilePanel && currentMenu === 'kamelets' && <SourcesTab />}
                        {!showFilePanel && currentMenu === 'configuration' && <SourcesTab />}
                        {showFilePanel && <DeveloperManager/>}
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}