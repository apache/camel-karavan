import React, {useEffect, useState} from 'react';
import {
    PageSection,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ProjectToolbar} from "./ProjectToolbar";
import {ProjectLogPanel} from "./log/ProjectLogPanel";
import {Project, ProjectFileTypes} from "../api/ProjectModels";
import {useFileStore, useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {ProjectTitle} from "./ProjectTitle";
import {ProjectPanel} from "./ProjectPanel";
import {FileEditor} from "./file/FileEditor";
import {shallow} from "zustand/shallow";
import {useParams} from "react-router-dom";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectDataPoller} from "./ProjectDataPoller";

export function ProjectPage () {

    const {file, operation} = useFileStore();
    const [mode, setMode] = useState<"design" | "code">("design");
    const [key, setKey] = useState<string>('');
    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [project, setProject] = useProjectStore((s) => [s.project, s.setProject], shallow )
    let { projectId } = useParams();
    const [tab, setTab] = useState<string | number>('files');

    useEffect(() => {
        const p = projects.filter(project => project.projectId === projectId).at(0);
        if (p) {
            setProject(p, "select");
        } else if (projectId){
            KaravanApi.getProject(projectId, project1 => setProject(project1, "select"));
        }
        return () => {
            setProject(new Project(), "none");
        }
    }, []);

    const showFilePanel = file !== undefined && operation === 'select';
    return (
        <PageSection className="designer-page project-page" padding={{default: 'noPadding'}}>
            <div className="tools-section">
                <MainToolbar title={<ProjectTitle/>} tools={<ProjectToolbar/>}/>
            </div>
            {showFilePanel && <FileEditor projectId={project.projectId}/>}
            {!showFilePanel && <ProjectPanel/>}
            <ProjectLogPanel/>
            <ProjectDataPoller/>
        </PageSection>
    )
}
