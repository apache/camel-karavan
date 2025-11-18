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
import {capitalize, Nav, NavItem, NavList,} from '@patternfly/react-core';
import './ProjectPage.css';
import {shallow} from "zustand/shallow";
import {useNavigate, useParams} from "react-router-dom";
import {useFilesStore, useFileStore, useProjectsStore, useProjectStore} from '@/api/ProjectStore';
import {BUILD_IN_PROJECTS, Project} from '@/api/ProjectModels';
import {RightPanel} from "@/components/RightPanel";
import {ROUTES} from "@/main/Routes";
import {ProjectPanel} from "@/integration/ProjectPanel";
import {useProjectFunctions} from './ProjectContext';

interface ProjectPageProps {
    toolbar: JSX.Element;
    developerManager: JSX.Element;
}

export function ProjectPage(props: ProjectPageProps): JSX.Element {

    const {toolbar, developerManager} = props;
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [project, setProject, tabIndex, setTabIndex, refreshTrace] =
        useProjectStore((s) => [s.project, s.setProject, s.tabIndex, s.setTabIndex, s.refreshTrace], shallow);
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const [urlFileName, setUrlFileName] = useState<string>();
    const { refreshData } = useProjectFunctions();

    let {projectId, fileName} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setUrlFileName(fileName)
        window.history.replaceState({}, "", `${ROUTES.INTEGRATIONS}/${projectId}`);
        const p = projects.filter(project => project.projectId === projectId).at(0);
        if (p) {
            setProject(p, "select");
            if (!BUILD_IN_PROJECTS.includes(p.projectId)){
                setTabIndex('topology');
            }
        } else {
            navigate('/');
        }
        return () => {
            setProject(new Project(), "none");
            setTabIndex('topology');
        }
    }, []);

    useEffect(() => {
        if (urlFileName !== undefined) {
            const file = files
                .filter(f => f.projectId === projectId && f.name === urlFileName)?.at(0);
            if (file) {
                setFile('select', file);
                setTabIndex(0);
                setUrlFileName(undefined);
            }
        }
    }, [files]);

    useEffect(() => {
        const interval = setInterval(() => refreshData(), 700)
        return () => clearInterval(interval);
    }, [tabIndex, refreshTrace, project]);


    function isBuildIn(): boolean {
        return BUILD_IN_PROJECTS.includes(project.projectId);
    }


    function hasReadme(): boolean {
        return files.map(f => f.name).findIndex(f => f.toLowerCase() === 'readme.md') !== -1;
    }

    const onNavSelect = (_: any, selectedItem: {
                             groupId: number | string;
                             itemId: number | string;
                             to: string;
                         }
    ) => {
        setTabIndex(selectedItem.itemId);
        setFile('none', undefined);
    };

    const list = !isBuildIn()
        ? (hasReadme() ? ['topology', 'files', 'package', 'readme'] : ['topology', 'files', 'package'])
        : ['files'];
    const PageNav = (
        <Nav onSelect={onNavSelect} aria-label="Nav" variant="horizontal">
            <NavList>
                {list.map((item, i) =>
                    <NavItem key={item} preventDefault itemId={item} isActive={tabIndex === item} to="#">
                        {capitalize(item)}
                    </NavItem>
                )}
            </NavList>
        </Nav>
    );

    function getProjectNavigation() {
        return (
            <div style={{display: 'flex', flexDirection: 'row', gap: '4px'}}>
                {PageNav}
            </div>
        )
    }

    return (
        <RightPanel
            title={<></>}
            toolsStart={getProjectNavigation()}
            tools={toolbar}
            mainPanel={
                <div className="right-panel-card">
                    {showFilePanel && developerManager}
                    {!showFilePanel && <ProjectPanel/>}
                </div>
            }
        />
    )
}
