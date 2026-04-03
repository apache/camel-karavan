import {DashboardDevelopmentCard} from "@features/dashboard/development/DashboardDevelopmentCard";
import * as React from "react";
import {useState} from "react";
import {useProjectsStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ComplexityProject} from "@features/projects/ComplexityModels";
import {KaravanApi} from "@api/KaravanApi";
import {ComplexityApi} from "@features/projects/ComplexityApi";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {useActivityStore} from "@stores/ActivityStore";
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {DashboardDevelopmentCardProjectRow} from "@features/dashboard/development/DashboardDevelopmentCardProjectRow";
import {Bullseye, Button, Checkbox, Content, ProgressStep, ProgressStepper, Spinner} from "@patternfly/react-core";
import {ProjectType} from "@models/ProjectModels";
import {useProjectInfoStore} from "../../../stores/ProjectInfoStore";

const DEFAULT_LENGTH = 7;

export function DashboardDevelopmentCardProjects() {

    const [projects, projectsCommited] = useProjectsStore((s) => [s.projects, s.projectsCommited], shallow)
    const [projectInfos, fetchProjectInfos] = useProjectInfoStore(state => [state.projectInfos, state.fetchProjectInfos]);
    const {projectsActivities, fetchProjectsActivities} = useActivityStore();
    const [complexities, setComplexities] = useState<ComplexityProject[]>([]);
    const [labels, setLabels] = useState<any>();
    const [showSystem, setShowSystem] = useState<boolean>(false);
    const [currentLength, setCurrentLength] = useState<number>(DEFAULT_LENGTH);

    useDataPolling('DashboardDevelopmentCardProjects', refreshActivity, 5000);

    function refreshActivity() {
        fetchProjectsActivities();
        KaravanApi.getProjectsLabels(data => {
            setLabels(data);
        });
        ComplexityApi.getComplexityProjects(complexities => {
            setComplexities(complexities);
        })
        fetchProjectInfos();
    }

    function setNewLength(dir: number){
        const next = currentLength + dir * DEFAULT_LENGTH/2;
        const length = next < DEFAULT_LENGTH ? DEFAULT_LENGTH : (next >= complexities.length) ? complexities.length : next;
        setCurrentLength(length);
    }

    function showMore() {
        const canMore = complexities?.length > currentLength;
        const canLess = (currentLength - DEFAULT_LENGTH) > 0;
        return (
            <Tr key={"show-more"} style={{verticalAlign: "middle"}}>
                <Td colSpan={1} >
                    <Checkbox id={"showAll"}
                              label={'Show system projects'}
                              isChecked={showSystem}
                              onChange={(_, checked) => setShowSystem(checked)}
                    />
                </Td>
                <Td modifier='fitContent' colSpan={5} style={{textAlign: "end", paddingTop: 8, paddingBottom: 8}} >
                    <div>
                        <Button isInline
                                variant={'link'}
                                style={{visibility: !canLess ? "hidden" : "visible"}}
                                onClick={_ => setNewLength(-1)}
                        >Show less</Button>
                        <Button isInline
                                style={{visibility: !canMore ? "hidden" : "visible"}}
                                variant={'link'}
                                onClick={_ => setNewLength(+1)}
                        >Show more</Button>
                    </div>
                </Td>
            </Tr>
        )
    }

    function getTableEmpty() {
        return (
                <Tr>
                    <Td colSpan={6} height={300}>
                        <Bullseye >
                            <Spinner size="xl"/>
                        </Bullseye>
                    </Td>
                </Tr>
        )
    }

    function getTableBody() {
        const list = showSystem ? complexities : complexities.filter(c => c.type === ProjectType.integration);
        return (list
                .sort((a, b) => a.lastUpdateDate > b.lastUpdateDate ? -1 : 1)
                .slice(0, currentLength)
                .map((complexity) => {
                    const project = projects.find(p => p.projectId === complexity.projectId);
                    const activity = projectsActivities?.[project.projectId];
                    const activeUsers: string [] = (activity && Array.isArray(activity)) ? activity : [];
                    const projectInfo = projectInfos.find(p => p.projectId === project.projectId);
                    const projectCommited = projectsCommited.find(pc => pc.projectId === project.projectId);
                    return (
                        <DashboardDevelopmentCardProjectRow
                            key={project.projectId}
                            project={project}
                            projectCommited={projectCommited}
                            activeUsers={activeUsers}
                            labels={Array.isArray(labels?.[project.projectId]) ? labels?.[project.projectId] : []}
                            complexity={complexity}
                            projectInfo={projectInfo}
                        />
                    )
                })
        )
    }

    return (
        <DashboardDevelopmentCard className={"project-table-wrapper"} body={
            <Table variant={'compact'} className={"projects-table"}>
                <Thead>
                    <Tr>
                        <Th key='project'>
                            <Content component={'h6'}>Recent Projects</Content>
                        </Th>
                        <Th key='timeline'>
                            <ProgressStepper isCenterAligned className={"projects-table-header-progress-stepper"}>
                                <ProgressStep id="commited" titleId="commited">
                                    <div style={{textWrap: 'nowrap'}}>Commited</div>
                                </ProgressStep>
                                <ProgressStep id="saved" titleId="saved">
                                    <div style={{textWrap: 'nowrap'}}>Saved</div>
                                </ProgressStep>
                            </ProgressStepper>
                        </Th>
                        <Th key='complexity' modifier={"fitContent"}>Complexity</Th>
                        <Th key='users' modifier={"fitContent"}>Active Users</Th>
                        <Th key='status' modifier={"fitContent"} textCenter>Status</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {complexities && complexities.length > 0 ? getTableBody() : getTableEmpty()}
                    {complexities && complexities.length > 0 && showMore()}
                </Tbody>
            </Table>
        }/>
    )
}
