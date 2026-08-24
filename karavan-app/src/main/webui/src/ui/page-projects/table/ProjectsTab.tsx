import React, {useEffect, useState} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant, ProgressStep, ProgressStepper} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from '@patternfly/react-icons';
import {shallow} from "zustand/shallow";
import {useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {useSearchStore} from "@stores/SearchStore";
import {ComplexityProject} from "@models/ComplexityModels";
import {useActivityStore} from "@stores/ActivityStore";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {ComplexityApi} from "@api/ComplexityApi";
import {ProjectType} from "@models/ProjectModels";
import {ProjectsToolbar} from "../ProjectsToolbar";
import ProjectsTableRow from "../table/ProjectsTableRow";
import {CreateProjectModal} from "@page-project/files/CreateProjectModal";
import {DeleteProjectModal} from "../DeleteProjectModal";

export function ProjectsTab() {

    const [projects, projectsCommited, labels, selectedLabels] =
        useProjectsStore((s) => [s.projects, s.projectsCommited, s.projectLabels, s.selectedLabels], shallow)
    const [operation] = useProjectStore((s) => [s.operation], shallow)
    const [search, searchResults] = useSearchStore((s) => [s.search, s.searchResults], shallow)
    const [complexities, setComplexities] = useState<ComplexityProject[]>([]);
    const {projectsActivities, fetchProjectsActivities} = useActivityStore();

    useEffect(() => refreshActivity(), []);
    useDataPolling('ProjectsTab', refreshActivity, 7000);

    function refreshActivity() {
        fetchProjectsActivities();
        ComplexityApi.getComplexityProjects(complexities => {
            setComplexities(complexities);
        })
    }

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
                <ProjectsToolbar type={"full"}/>
                <OuterScrollContainer>
                    <InnerScrollContainer>
                        <Table aria-label="Projects" variant='compact' isStickyHeader>
                            <Thead>
                                <Tr>
                                    <Th key='icon' screenReaderText='pass' modifier='fitContent'/>
                                    <Th key='projectId'>Name</Th>
                                    <Th key='name'>Description</Th>
                                    <Th key='size' modifier='fitContent' textCenter>Size</Th>
                                    <Th key='routes' modifier='fitContent' textCenter>Routes</Th>
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
                                    <Th key='acivity' modifier={"fitContent"} textCenter>Active Users</Th>
                                    <Th key='status' modifier={"fitContent"} textCenter>Status</Th>
                                    <Th key='action' modifier={"fitContent"} aria-label='topology-modal'></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {projs.map(project => {
                                    const complexity = complexities.filter(c => c.projectId === project.projectId).at(0) || new ComplexityProject({projectId: project.projectId});
                                    const activity = projectsActivities?.[project.projectId];
                                    const activeUsers: string [] = (activity && Array.isArray(activity)) ? activity : [];
                                    const projectCommited = projectsCommited.find(pc => pc.projectId === project.projectId);
                                    return (
                                        <ProjectsTableRow
                                            key={project.projectId}
                                            project={project}
                                            projectCommited={projectCommited}
                                            complexity={complexity}
                                            activeUsers={activeUsers}
                                            labels={Array.isArray(labels?.[project.projectId]) ? labels?.[project.projectId] : []}
                                            selectedLabels={selectedLabels}
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