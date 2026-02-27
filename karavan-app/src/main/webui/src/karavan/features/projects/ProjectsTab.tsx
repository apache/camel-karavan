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
import React, {useEffect, useState} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant, ProgressStep, ProgressStepper} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from '@patternfly/react-icons';
import {shallow} from "zustand/shallow";
import {useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {KaravanApi} from "@api/KaravanApi";
import {CreateProjectModal} from "@features/projects/CreateProjectModal";
import {DeleteProjectModal} from "@features/projects/DeleteProjectModal";
import {useSearchStore} from "@stores/SearchStore";
import {ComplexityProject} from "@features/projects/ComplexityModels";
import {ComplexityApi} from "@features/projects/ComplexityApi";
import ProjectsTableRow from "@features/projects/ProjectsTableRow";
import {ProjectsToolbar} from "@features/projects/ProjectsToolbar";
import {ProjectType} from "@models/ProjectModels";
import {useDataPolling} from "@shared/polling/useDataPolling";

export function ProjectsTab() {

    const [projects, projectsCommited] = useProjectsStore((s) => [s.projects, s.projectsCommited], shallow)
    const [operation] = useProjectStore((s) => [s.operation], shallow)
    const [search, searchResults] = useSearchStore((s) => [s.search, s.searchResults], shallow)
    const [complexities, setComplexities] = useState<ComplexityProject[]>([]);
    const [labels, setLabels] = useState<any>();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

    useEffect(() => refreshActivity(), []);
    useDataPolling('ProjectsTab', refreshActivity, 10000);

    function refreshActivity() {
        KaravanApi.getProjectsLabels(data => {
            setLabels(data);
        });
        ComplexityApi.getComplexityProjects(complexities => {
            setComplexities(complexities);
        })
    }

    const toggleLabel = (label: string) => {
        setSelectedLabels((prevSelectedLabels) => {
            if (prevSelectedLabels.includes(label)) {
                // Remove the label if it already exists in the array
                return prevSelectedLabels.filter((item) => item !== label);
            } else {
                // Add the label if it doesn't exist in the array
                return [...prevSelectedLabels, label];
            }
        });
    };

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        <EmptyState variant={EmptyStateVariant.sm} titleText="No results found" icon={SearchIcon} headingLevel="h2"/>
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    function getProjectsTable() {
        let projs = projects
            .filter(p => p.type === ProjectType.integration)
            .filter(p => searchResults.map(s => s.projectId).includes(p.projectId) || search === '');
        if (selectedLabels.length > 0) {
            projs = projs.filter(p => {
                const labs: string[] = labels[p.projectId] !== undefined && Array.isArray(labels[p.projectId]) ? labels[p.projectId] : [];
                return labs.some(l => selectedLabels.includes(l));
            });
        }
        return (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <ProjectsToolbar/>
                <OuterScrollContainer>
                    <InnerScrollContainer>
                        <Table aria-label="Projects" variant='compact' isStickyHeader>
                            <Thead>
                                <Tr>
                                    <Th key='status' screenReaderText='pass' modifier='fitContent'/>
                                    <Th key='projectId'>Name</Th>
                                    <Th key='name'>Description</Th>
                                    <Th key='timeline' modifier={"fitContent"}>
                                        <ProgressStepper isCenterAligned className={"projects-table-header-progress-stepper"}>
                                            <ProgressStep id="commited" titleId="commited">
                                                <div style={{textWrap: 'nowrap'}}>Commited</div>
                                            </ProgressStep>
                                            <ProgressStep id="saved" titleId="saved">
                                                <div style={{textWrap: 'nowrap'}}>Saved</div>
                                            </ProgressStep>
                                        </ProgressStepper>
                                    </Th>
                                    <Th key='complexity' modifier={"fitContent"} textCenter>Complexity</Th>
                                    <Th key='action' modifier={"fitContent"} aria-label='topology-modal'></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {projs.map(project => {
                                    const complexity = complexities.filter(c => c.projectId === project.projectId).at(0) || new ComplexityProject({projectId: project.projectId});
                                    const projectCommited = projectsCommited.find(pc => pc.projectId === project.projectId);
                                    return (
                                        <ProjectsTableRow
                                            key={project.projectId}
                                            project={project}
                                            projectCommited={projectCommited}
                                            complexity={complexity}
                                            labels={Array.isArray(labels?.[project.projectId]) ? labels?.[project.projectId] : []}
                                            selectedLabels={selectedLabels}
                                            onLabelClick={toggleLabel}
                                        />
                                    )
                                })}
                                {projs.length === 0 && getEmptyState()}
                            </Tbody>
                        </Table>
                    </InnerScrollContainer>
                </OuterScrollContainer>
            </div>
        )
    }

    return (
        <div className="right-panel-card">
            {getProjectsTable()}
            {["create", "copy"].includes(operation) && <CreateProjectModal/>}
            {["delete"].includes(operation) && <DeleteProjectModal/>}
        </div>
    )
}