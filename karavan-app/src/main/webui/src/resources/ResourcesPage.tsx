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
import {Bullseye, Button, Content, EmptyState, EmptyStateVariant, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities,} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from '@patternfly/react-icons';
import {ResourcesTableRow} from "./ResourcesTableRow";
import {useProjectsStore} from "@/api/ProjectStore";
import {ProjectType} from "@/api/ProjectModels";
import {shallow} from "zustand/shallow";
import {RightPanel} from "@/components/RightPanel";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

export function ResourcesPage() {

    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [filter, setFilter] = useState<string>('');

    function searchInput() {
        return (
            <TextInputGroup className="search">
                <TextInputGroupMain
                    value={filter}
                    id='searchInput'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    icon={<SearchIcon />}
                    onChange={(_event, value) => {
                        setFilter(value);
                    }}
                    aria-label="text input example"
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" onClick={_ => {
                        setFilter('');
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    function title() {
        return (<Content component="h2">Resources</Content>)
    }

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No results found" variant={EmptyStateVariant.sm}>
                        </EmptyState>
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    function getProjectsTable() {
        const projs = projects
            .filter(p => p.type !== ProjectType.integration)
            .filter(p => p.name.toLowerCase().includes(filter));
        return (
            <Table aria-label="Templates" variant={"compact"} isStickyHeader>
                <Thead>
                    <Tr>
                        <Th key='projectId'>Name</Th>
                        <Th key='name'>Description</Th>
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
        <RightPanel
            title={title()}
            tools={searchInput()}
            mainPanel={
                <div className="right-panel-card">
                    {getProjectsTable()}
                </div>
            }
        />
    )
}