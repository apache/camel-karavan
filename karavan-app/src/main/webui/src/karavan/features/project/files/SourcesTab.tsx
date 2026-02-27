import React from 'react';
import {ProjectFile} from "@models/ProjectModels";
import {FilesToolbar} from "@features/project/files/FilesToolbar";
import {FilesSubTab} from "@features/project/files/FilesSubTab";
import './SourcesTab.css'
import {useFilesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {Drawer, DrawerContent, DrawerContentBody} from "@patternfly/react-core";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {SourcesDrawerPanel} from "@features/project/files/SourcesDrawerPanel";

interface SourcesTabProps {
    sortFiles?: (files: ProjectFile[]) => ProjectFile[]
}

export function SourcesTab(props: SourcesTabProps) {

    const [showSideBar] = useFilesStore((s) => [s.showSideBar], shallow);

    return (
        <Drawer isExpanded={showSideBar !== null} position="end" onExpand={_ => {
        }}>
            <DrawerContent panelContent={<SourcesDrawerPanel/>}>
                <DrawerContentBody>
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            <FilesToolbar/>
                            <FilesSubTab sortFiles={props.sortFiles}/>
                        </div>
                    </ErrorBoundaryWrapper>
                </DrawerContentBody>
            </DrawerContent>
        </Drawer>
    )
}