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
import {Project} from "../api/ProjectModels";
import {useFileStore, useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {ProjectTitle} from "./ProjectTitle";
import {ProjectPanel} from "./ProjectPanel";
import {FileEditor} from "./file/FileEditor";
import {shallow} from "zustand/shallow";
import {useParams} from "react-router-dom";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectDataPoller} from "./ProjectDataPoller";
import {ImageDownloadToolbar} from "./ImageDownloadToolbar";

export function ProjectPage() {

    const {file, operation} = useFileStore();
    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [project, setProject, tab, setTab] = useProjectStore((s) => [s.project, s.setProject, s.tabIndex, s.setTabIndex], shallow);

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

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    function showTabs(): boolean {
        return !isBuildIn() && !showFilePanel;
    }

    const buildIn = isBuildIn();

    const showFilePanel = file !== undefined && operation === 'select';
    return (
        <PageSection className="project-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={<ProjectTitle/>} tools={<ProjectToolbar/>} toolsStart={<ImageDownloadToolbar/>}/>
            </PageSection>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    <FlexItem className="project-tabs">
                        {showTabs() && <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                            <Tab eventKey="files" title="Files"/>
                            <Tab eventKey="topology" title="Topology"/>
                            <Tab eventKey="dashboard" title="Dashboard"/>
                            <Tab eventKey="trace" title="Trace"/>
                            <Tab eventKey="build" title="Build"/>
                            <Tab eventKey="container" title="Container"/>
                        </Tabs>}
                    </FlexItem>
                </Flex>
            </PageSection>
            {showFilePanel && <FileEditor projectId={project.projectId}/>}
            {!showFilePanel && <ProjectPanel/>}
            <ProjectLogPanel/>
            <ProjectDataPoller/>
        </PageSection>
    )
}
