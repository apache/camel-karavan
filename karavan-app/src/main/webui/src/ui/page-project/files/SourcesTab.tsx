import React, {useEffect} from 'react';
import {ProjectFile} from "@models/ProjectModels";
import {FilesToolbar} from "../files/FilesToolbar";
import {FilesSubTab} from "../files/FilesSubTab";
import './SourcesTab.css'
import {useFilesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {CommitsTab} from "../commits/CommitsTab";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";

interface SourcesTabProps {
    sortFiles?: (files: ProjectFile[]) => ProjectFile[]
}

export function SourcesTab(props: SourcesTabProps) {

    const [selector, setSelector] = useFilesStore((s) => [s.selector, s.setSelector], shallow);

    useEffect(() => {
        return () => setSelector('files');
    }, []);

    return (
        <ErrorBoundaryWrapper onError={error => console.error(error)}>
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <FilesToolbar/>
                {selector === 'files' && <FilesSubTab sortFiles={props.sortFiles}/>}
                {selector === 'commits' && <CommitsTab/>}
            </div>
        </ErrorBoundaryWrapper>
    )
}