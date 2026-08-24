/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {JSX, useEffect, useState} from 'react';
import './ProjectPage.css';
import {shallow} from "zustand/shallow";
import {useNavigate, useParams} from "react-router-dom";
import {ProjectMenus, useFilesStore, useFileStore, useProjectsStore, useProjectStore} from '@stores/ProjectStore';
import {BUILD_IN_PROJECTS, Project} from '@models/ProjectModels';
import {RightPanel} from "@shared/ui/RightPanel";
import {ROUTES} from "@compass/navigation/Routes";
import {ProjectPageNavigation} from "./ProjectPageNavigation";
import {ProjectContainersContextProvider} from "./ProjectContainersContextProvider";
import {Content} from "@patternfly/react-core";
import {ProjectToolbar} from "./toolbar/ProjectToolbar";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import ProjectPanel from "./ProjectPanel";
import {DeveloperManager} from "@developer/DeveloperManager";
import {ProjectPageRefresher} from "./ProjectPageRefresher";
import {ProjectDrawerPanel} from "./ProjectDrawerPanel";
import {SourcesDrawerPanel} from "./files/SourcesDrawerPanel";

export function ProjectPage(): JSX.Element {

    const files = useFilesStore((s) => s.files);
    const setFiles = useFilesStore((s) => s.setFiles);
    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [project, setProject, tabIndex, setTabIndex, refreshTrace] =
        useProjectStore((s) => [s.project, s.setProject, s.tabIndex, s.setTabIndex, s.refreshTrace], shallow);
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const [urlFileName, setUrlFileName] = useState<string>();

    const {projectId, fileName} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setUrlFileName(fileName)
        window.history.replaceState({}, "", `${ROUTES.PROJECTS}/${projectId}`);
        const p = projects?.filter(project => project.projectId === projectId).at(0);
        if (p) {
            setProject(p, "select");
            if (!BUILD_IN_PROJECTS.includes(p.projectId)) {
                setTabIndex(ProjectMenus[0]);
            }
        } else {
            navigate('/');
        }
        return () => {
            setProject(new Project(), "none");
            setFiles([])
            setTabIndex(ProjectMenus[0]);
        }
    }, []);

    useEffect(() => {
        if (urlFileName !== undefined) {
            const file = files?.filter(f => f.projectId === projectId && f.name === urlFileName)?.at(0);
            if (file) {
                setFile('select', file);
                setTabIndex(ProjectMenus[0]);
                setUrlFileName(undefined);
            }
        }
    }, [files]);

    function title() {
        return (<Content component="h2">Integration</Content>)
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={
                <ProjectContainersContextProvider>
                    <ProjectPageNavigation/>
                </ProjectContainersContextProvider>
            }
            tools={<ProjectToolbar/>}
            drawerPanel={tabIndex === 'source' ? <SourcesDrawerPanel/> : <ProjectDrawerPanel/>}
            mainPanel={
                <div className="right-panel-card project-page">
                    <ProjectPageRefresher/>
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        {showFilePanel && <DeveloperManager/>}
                        {!showFilePanel && <ProjectPanel/>}
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}