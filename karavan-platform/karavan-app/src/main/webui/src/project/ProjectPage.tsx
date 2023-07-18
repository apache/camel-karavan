import React, {useEffect, useState} from 'react';
import {
    PageSection,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import FileSaver from "file-saver";
import {ProjectToolbar} from "./ProjectToolbar";
import {ProjectLogPanel} from "./log/ProjectLogPanel";
import {ProjectFile, ProjectFileTypes} from "../api/ProjectModels";
import {useFileStore, useProjectStore} from "../api/ProjectStore";
import {MainToolbar} from "../common/MainToolbar";
import {ProjectTitle} from "./ProjectTitle";
import {ProjectPanel} from "./ProjectPanel";
import {FileEditor} from "./file/FileEditor";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";

export const ProjectPage = () => {

    const {file, operation} = useFileStore();
    const [mode, setMode] = useState<"design" | "code">("design");
    const [key, setKey] = useState<string>('');
    const [project] = useProjectStore((state) => [state.project], shallow )

    useEffect(() => {
        // TODO: make status request only when started or just opened
        const interval = setInterval(() => {
            ProjectService.getDevModePodStatus(project);
        }, 1000);
        return () => {
            clearInterval(interval)
        };
    }, []);

    function post (file: ProjectFile)  {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                // setFiles((files => {
                //     const index = files.findIndex(f => f.name === newFile.name);
                //     if (index !== -1) files.splice(index, 1, newFile)
                //     else files.push(newFile);
                //     return files
                // }))
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            // setFile(file);
            post(file);
        }
    }

    function download () {
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }


    function tools () {
        return <ProjectToolbar
                               mode={mode}
                               setMode={mode => setMode(mode)}
        />
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates'].includes(project.projectId);
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
                <MainToolbar title={<ProjectTitle/>} tools={tools()}/>
            </PageSection>
            {showFilePanel && <FileEditor/>}
            {!showFilePanel && <ProjectPanel/>}
            <ProjectLogPanel/>
        </PageSection>
    )
}
