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

import React, {useEffect} from 'react';
import {
    Flex,
    FlexItem,
    PageSection, Tab, Tabs,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ProjectToolbar} from "./ProjectToolbar";
import {ProjectLogPanel} from "./log/ProjectLogPanel";
import {Project, ProjectType} from "../api/ProjectModels";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {ProjectTitle} from "./ProjectTitle";
import {ProjectPanel} from "./ProjectPanel";
import {FileEditor} from "./FileEditor";
import {shallow} from "zustand/shallow";
import {useParams} from "react-router-dom";
import {KaravanApi} from "../api/KaravanApi";
import {ImageDownloadToolbar} from "./ImageDownloadToolbar";
import {ProjectService} from "../api/ProjectService";

export function ProjectPage() {

    const {file, operation} = useFileStore();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [project, setProject, tabIndex, setTabIndex, refreshTrace] =
        useProjectStore((s) => [s.project, s.setProject, s.tabIndex, s.setTabIndex, s.refreshTrace], shallow);

    let {projectId} = useParams();

    useEffect(() => {
        const p = projects.filter(project => project.projectId === projectId).at(0);
        if (p) {
            setProject(p, "select");
        } else if (projectId) {
            KaravanApi.getProject(projectId, project1 => setProject(project1, "select"));
        }
        return () => {
            setProject(new Project(), "none");
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (tabIndex === 'build' || tabIndex === 'container') {
                ProjectService.refreshAllContainerStatuses();
                ProjectService.refreshAllDeploymentStatuses();
                ProjectService.refreshImages(project.projectId);
            }
        }, 2000)
        return () => clearInterval(interval);
    }, [tabIndex]);

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    function showTabs(): boolean {
        return !isBuildIn() && !showFilePanel;
    }

    function hasReadme(): boolean {
        return files.map(f => f.name).findIndex(f => f.toLowerCase() === 'readme.md') !== -1;
    }

    const ephemeral = project.type === ProjectType.ephemeral
    const showFilePanel = file !== undefined && operation === 'select';
    return (
        <PageSection className="project-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={<ProjectTitle/>} tools={<ProjectToolbar/>} toolsStart={<ImageDownloadToolbar/>}/>
            </PageSection>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    <FlexItem className="project-tabs">
                        {showTabs() && <Tabs activeKey={tabIndex} onSelect={(event, tabIndex) => setTabIndex(tabIndex)}>
                            {!ephemeral && <Tab eventKey="topology" title="Topology"/>}
                            <Tab eventKey="files" title="Files"/>
                            {!ephemeral && <Tab eventKey="dashboard" title="Dashboard"/>}
                            {!ephemeral && <Tab eventKey="trace" title="Trace"/>}
                            {!ephemeral && <Tab eventKey="build" title="Build"/>}
                            <Tab eventKey="container" title="Container"/>
                            {hasReadme() && <Tab eventKey="readme" title="Readme"/>}
                        </Tabs>}
                    </FlexItem>
                </Flex>
            </PageSection>
            {showFilePanel && <FileEditor projectId={project.projectId}/>}
            {!showFilePanel && <ProjectPanel/>}
            <ProjectLogPanel/>
        </PageSection>
    )
}
