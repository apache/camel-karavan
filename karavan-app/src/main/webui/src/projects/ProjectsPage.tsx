import React, {ReactElement, useEffect, useState} from 'react';
import {Bullseye, Content, EmptyState, EmptyStateVariant} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from '@patternfly/react-icons';
import {shallow} from "zustand/shallow";
import {useProjectsStore, useProjectStore} from "@/api/ProjectStore";
import {KaravanApi} from "@/api/KaravanApi";
import {Project, ProjectType} from "@/api/ProjectModels";
import {ProjectService} from "@/api/ProjectService";
import {CreateProjectModal} from "@/projects/CreateProjectModal";
import {DeleteProjectModal} from "@/projects/DeleteProjectModal";
import {ProjectsTableRow} from "./ProjectsTableRow";
import {ComplexityApi} from "./ComplexityApi";
import {ComplexityProject} from "./ComplexityModels";
import {RightPanel} from "@/components/RightPanel";
import {ProjectsToolbar} from "@/projects/ProjectsToolbar";

export function ProjectsPage() {

    const [projects, setProjects] = useProjectsStore((s) => [s.projects, s.setProjects], shallow)
    const [operation] = useProjectStore((s) => [s.operation], shallow)
    const [complexities, setComplexities] = useState<ComplexityProject[]>([]);
    const [activities, setActivities] = useState<any>();
    const [labels, setLabels] = useState<any>();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

    useEffect(() => {
        KaravanApi.getProjects((projects: Project[]) => {
            setProjects(projects);
        });
        const interval1 = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 2000)
        const interval2 = setInterval(() => {
            refreshActivity()
        }, 5000)
        return () => {
            clearInterval(interval1);
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

    function title(): ReactElement {
        return (<Content component="h2">Integrations</Content>)
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
            .filter(p => p.type === ProjectType.integration);
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table aria-label="Projects" variant='compact' isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th key='projectId'>Name</Th>
                                <Th key='name'>Description</Th>
                                <Th key='commit' textCenter>Update / Commit</Th>
                                <Th key='environment' modifier={"fitContent"} textCenter>Environment</Th>
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
        <RightPanel
            title={title()}
            tools={<ProjectsToolbar/>}
            mainPanel={
                <div className="right-panel-card">
                    {getProjectsTable()}
                    {["create", "copy"].includes(operation) && <CreateProjectModal/>}
                    {["delete"].includes(operation) && <DeleteProjectModal/>}
                </div>
            }
        />
    )
}