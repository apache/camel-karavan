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
    PageSection,
    TextContent,
    Text,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon, EmptyStateHeader
} from '@patternfly/react-core';
import './ProjectsPage.css';
import {
    Tbody,
    Td,
    Th,
    Thead,
    Tr
} from '@patternfly/react-table';
import {
    Table
} from '@patternfly/react-table/deprecated';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {ProjectsTableRow} from "./ProjectsTableRow";
import {DeleteProjectModal} from "./DeleteProjectModal";
import {CreateProjectModal} from "./CreateProjectModal";
import {useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {Project, ProjectType} from "../api/ProjectModels";
import {shallow} from "zustand/shallow";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectsToolbar} from "./ProjectsToolbar";
import {ProjectService} from "../api/ProjectService";

interface Props {
    tools?: React.ReactNode
}

export function ProjectsPage (props: Props) {

    const [projects, setProjects, filter, setFilter]
        = useProjectsStore((s) => [s.projects, s.setProjects, s.filter, s.setFilter], shallow)
    const [operation] = useProjectStore((s) => [s.operation], shallow)

    useEffect(() => {
        KaravanApi.getProjects((projects: Project[]) => {
            setProjects(projects);
            setFilter('');
        });
        const interval = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 2000)
        return () => clearInterval(interval);
    }, []);

    function title() {
        return <TextContent>
            <Text component="h2">Projects</Text>
        </TextContent>
    }

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        <EmptyState variant={EmptyStateVariant.sm}>
                            <EmptyStateHeader titleText="No results found"
                                              icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2"/>
                        </EmptyState>
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    function getProjectsTable() {
        const projs = projects
            .filter(p => p.type === ProjectType.normal)
            .filter(p => p.name.toLowerCase().includes(filter));
        return (
            <Table aria-label="Projects" variant={"compact"}>
                <Thead>
                    <Tr>
                        <Th key='projectId'>Project ID</Th>
                        <Th key='name'>Name</Th>
                        <Th key='commit' modifier={"fitContent"}>Commit</Th>
                        <Th key='deployment' modifier={"fitContent"}>Environment</Th>
                        <Th key='action'></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {projs.map(project => (
                        <ProjectsTableRow
                            key={project.projectId}
                            project={project}/>
                    ))}
                    {projs.length === 0 && getEmptyState()}
                </Tbody>
            </Table>
        )
    }

    return (
        <PageSection className="projects-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={props.tools ? props.tools : <ProjectsToolbar/>}/>
            </PageSection>
            <PageSection isFilled className="project-section">
                {getProjectsTable()}
            </PageSection>
            {["create", "copy"].includes(operation) && <CreateProjectModal/>}
            {["delete"].includes(operation) && <DeleteProjectModal/>}
        </PageSection>

    )
}