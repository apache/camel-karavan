import React, {useEffect, useState} from 'react';
import {
    PageSection,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ProjectToolbar} from "./ProjectToolbar";
import {ProjectLogPanel} from "./log/ProjectLogPanel";
import {ProjectFileTypes} from "../api/ProjectModels";
import {useFileStore, useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {ProjectTitle} from "./ProjectTitle";
import {ProjectPanel} from "./ProjectPanel";
import {FileEditor} from "./file/FileEditor";
import {shallow} from "zustand/shallow";
import {useParams} from "react-router-dom";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectDataPoller} from "./ProjectDataPoller";

export const ProjectPage = () => {

    const {file, operation} = useFileStore();
    const [mode, setMode] = useState<"design" | "code">("design");
    const [key, setKey] = useState<string>('');
    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [project, setProject] = useProjectStore((state) => [state.project, state.setProject], shallow )
    let { projectId } = useParams();

    useEffect(() => {
        const p = projects.filter(project => project.projectId === projectId).at(0);
        if (p) {
            setProject(p, "select");
        } else if (projectId){
            KaravanApi.getProject(projectId, project1 => setProject(project1, "select"));
        }
    }, []);

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    const types = isBuildIn()
        ? (isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
        : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);
    const showFilePanel = file !== undefined && operation === 'select';
    return (
        <PageSection key={key} className="kamelet-section project-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={<ProjectTitle/>} tools={<ProjectToolbar/>}/>
            </PageSection>
            {showFilePanel && <FileEditor/>}
            {!showFilePanel && <ProjectPanel/>}
            <ProjectLogPanel/>
            <ProjectDataPoller/>
        </PageSection>
    )
}
