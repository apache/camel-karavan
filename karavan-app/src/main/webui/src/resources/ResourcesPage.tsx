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

import React, {useState} from 'react';
import {
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    TextInput,
    PageSection,
    TextContent,
    Text,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    EmptyStateHeader
} from '@patternfly/react-core';
import '../designer/karavan.css';
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
import {ResourcesTableRow} from "./ResourcesTableRow";
import {useProjectsStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {ProjectType} from "../api/ProjectModels";
import {shallow} from "zustand/shallow";

export function ResourcesPage () {

    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [filter, setFilter] = useState<string>('');

    function getTools() {
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               autoComplete="off" placeholder="Search by name"
                               value={filter}
                               onChange={(_, e) => setFilter(e)}/>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }

    function title() {
        return <TextContent>
            <Text component="h2">Resources</Text>
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
            .filter(p => p.type !== ProjectType.normal)
            .filter(p => p.name.toLowerCase().includes(filter));
        return (
            <Table aria-label="Templates" variant={"compact"}>
                <Thead>
                    <Tr>
                        <Th key='projectId'>Project ID</Th>
                        <Th key='name'>Name</Th>
                        <Th key='commit'>Commit</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {projs.map(project => (
                        <ResourcesTableRow
                            key={project.projectId}
                            project={project}/>
                    ))}
                    {projs.length === 0 && getEmptyState()}
                </Tbody>
            </Table>
        )
    }

    return (
        <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={getTools()}/>
            </PageSection>
            <PageSection isFilled className="scrolled-page">
                {getProjectsTable()}
            </PageSection>
        </PageSection>

    )
}