import React, {useEffect, useState} from 'react';
import {capitalize, Content, Tab, Tabs, TabTitleText,} from '@patternfly/react-core';
import {RightPanel} from "@shared/ui/RightPanel";
import {useFilesStore, useFileStore, useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {DeveloperManager} from "@developer/DeveloperManager";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {SourcesTab} from "@page-project/files/SourcesTab";
import {useParams} from "react-router-dom";
import {SettingsMenu, SettingsMenus, useSettingsStore} from "@stores/SettingsStore";
import {ROUTES} from "@compass/navigation/Routes";
import {ProjectFile} from "@models/ProjectModels";
import {ProjectToolbar} from "@page-project/toolbar/ProjectToolbar";
import {TabProps} from "@patternfly/react-core/src/components/Tabs/Tab";
import {SourcesDrawerPanel} from "@page-project/files/SourcesDrawerPanel";

export function SettingsPage() {

    const [projects] = useProjectsStore((s) => [s.projects], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow);
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const [fetchFiles, fetchCommitedFiles, setFiles] = useFilesStore((s) => [s.fetchFiles, s.fetchCommitedFiles, s.setFiles], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const {setCurrentMenu, currentMenu} = useSettingsStore();
    const [key, setKey] = useState<string>();

    const {projectId, fileName} = useParams();

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
            selectProject(undefined);
            setFiles([])
        };
    }, []);

    function title() {
        return (<Content component="h2">Settings</Content>)
    }

    const onNavSelect = (event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: TabProps['eventKey']) => {
        setCurrentMenu(eventKey as SettingsMenu);
        selectProject(eventKey as string, undefined);
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
            <Tabs onSelect={onNavSelect} isNav activeKey={currentMenu}>
                {SettingsMenus.map((item, i) => {
                    return (
                        <Tab
                            key={item}
                            eventKey={item}
                            title={<TabTitleText>{capitalize(item?.toString())}</TabTitleText>}
                        />
                    )
                })}
            </Tabs>
        )
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={currentMenu === 'configuration' && <ProjectToolbar/>}
            drawerPanel={<SourcesDrawerPanel/>}
            mainPanel={
                <div key={key} className="right-panel-card">
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        {!showFilePanel && currentMenu === 'templates' && <SourcesTab/>}
                        {!showFilePanel && currentMenu === 'kamelets' && <SourcesTab/>}
                        {!showFilePanel && currentMenu === 'configuration' && <SourcesTab/>}
                        {showFilePanel && <DeveloperManager/>}
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}