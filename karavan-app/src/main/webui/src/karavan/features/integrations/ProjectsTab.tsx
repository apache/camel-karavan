import React, {useEffect, useState} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from '@patternfly/react-icons';
import {shallow} from "zustand/shallow";
import {useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {KaravanApi} from "@api/KaravanApi";
import {ProjectType} from "@models/ProjectModels";
import {CreateProjectModal} from "@features/integrations/CreateProjectModal";
import {DeleteProjectModal} from "@features/integrations/DeleteProjectModal";
import {useSearchStore} from "@stores/SearchStore";
import {ComplexityProject} from "@features/integrations/ComplexityModels";
import {ComplexityApi} from "@features/integrations/ComplexityApi";
import {ProjectsTableRow} from "@features/integrations/ProjectsTableRow";

export function ProjectsTab() {

    const [projects] = useProjectsStore((s) => [s.projects], shallow)
    const [operation] = useProjectStore((s) => [s.operation], shallow)
    const [search, searchResults] = useSearchStore((s) => [s.search, s.searchResults], shallow)
    const [complexities, setComplexities] = useState<ComplexityProject[]>([]);
    const [activities, setActivities] = useState<any>();
    const [labels, setLabels] = useState<any>();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

    useEffect(() => {
        const interval2 = setInterval(() => {
            refreshActivity()
        }, 5000)
        return () => {
            clearInterval(interval2);
        }
    }, []);

    useEffect(() => {
        ComplexityApi.getComplexityProjects(complexities => {
            setComplexities(complexities);
        })
        refreshActivity()
    }, [projects]);

    function refreshActivity() {
        KaravanApi.getProjectActivity(data => {
            setActivities(data);
        });
        KaravanApi.getProjectsLabels(data => {
            setLabels(data);
        });
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
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table aria-label="Projects" variant='compact' isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th key='status' screenReaderText='pass' modifier='fitContent'/>
                                <Th key='projectId'>Name</Th>
                                <Th key='name'>Description</Th>
                                <Th key='commit' textCenter>Update / Commit</Th>
                                <Th key='complexity' modifier={"fitContent"} textCenter>Complexity</Th>
                                <Th key='acivity' modifier={"fitContent"} textCenter>Active Users</Th>
                                <Th key='action' modifier={"fitContent"} aria-label='topology-modal'></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {projs.map(project => {
                                const complexity = complexities.filter(c => c.projectId === project.projectId).at(0) || new ComplexityProject({projectId: project.projectId});
                                const activity = activities?.[project.projectId];
                                const activeUsers: string [] = (activity && Array.isArray(activity)) ? activity : [];
                                return (
                                    <ProjectsTableRow
                                        key={project.projectId}
                                        project={project}
                                        complexity={complexity}
                                        activeUsers={activeUsers}
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