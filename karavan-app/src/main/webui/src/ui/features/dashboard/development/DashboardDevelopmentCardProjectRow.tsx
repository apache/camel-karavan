import React from 'react';
import {Button, Content} from '@patternfly/react-core';
import {BUILD_IN_PROJECTS, Project, ProjectCommited} from "@models/ProjectModels";
import {ComplexityProject} from "@features/projects/ComplexityModels";
import {ProjectInfo} from "@models/CatalogModels";
import {useNavigate} from "react-router-dom";
import {Td, Tr} from "@patternfly/react-table";
import {ROUTES} from "@app/navigation/Routes";
import {ProjectsTableRowTimeLine} from "@features/projects/ProjectsTableRowTimeLine";
import {ProjectStatusLabel} from "@features/projects/ProjectStatusLabel";
import {ProjectsTableRowComplexity} from "@features/projects/ProjectsTableRowComplexity";
import {ProjectsTableRowActivity} from "@features/projects/ProjectsTableRowActivity";

interface Props {
    project: Project,
    projectCommited: ProjectCommited,
    complexity: ComplexityProject
    activeUsers: string[]
    labels: string[]
    projectInfo: ProjectInfo
}

export function DashboardDevelopmentCardProjectRow(props: Props): React.ReactElement {

    const {project, complexity, activeUsers, labels, projectInfo, projectCommited} = props;
    const navigate = useNavigate();
    const isBuildIn = BUILD_IN_PROJECTS.includes(project.projectId);
    return (
        <Tr key={project.projectId} style={{verticalAlign: "middle"}} className={"project-card"}>
            <Td>
                <Button isInline variant={"link"} onClick={() => navigate(`${ROUTES.PROJECTS}/${project.projectId}`)}>
                    <Content component={'p'}>{project.name}</Content>
                    <div>{project.projectId}</div>
                </Button>
            </Td>
            <Td modifier={"nowrap"} textCenter>
               <ProjectsTableRowTimeLine project={project} projectCommited={projectCommited} />
            </Td>
            <Td noPadding textCenter>
                <ProjectsTableRowComplexity complexity={complexity}/>
            </Td>
            <Td noPadding>
                {!isBuildIn && <ProjectsTableRowActivity activeUsers={activeUsers}/>}
            </Td>
            <Td modifier='fitContent' style={{paddingInlineEnd: 0, paddingInlineStart: '6px'}}>
                {!isBuildIn && <ProjectStatusLabel projectId={project.projectId}/>}
            </Td>
        </Tr>
    )
}