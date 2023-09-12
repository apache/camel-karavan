import React from 'react';
import {
    Button,
    Badge,
    Tooltip,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import { Td, Tr} from "@patternfly/react-table";
import {Project} from '../api/ProjectModels';
import {
    useLogStore,
} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";

interface Props {
    project: Project
}

export function TemplatesTableRow (props: Props) {

    const [setShowLog] = useLogStore((state) => [state.setShowLog], shallow);
    const navigate = useNavigate();


    const project = props.project;
    const isBuildIn = ['kamelets', 'templates'].includes(project.projectId);
    const badge = isBuildIn ? project.projectId.toUpperCase().charAt(0) : project.runtime.substring(0, 1).toUpperCase();
    const commit = project.lastCommit ? project.lastCommit?.substr(0, 7) : "...";
    return (
        <Tr key={project.projectId}>
            <Td>
                <Button style={{padding: '6px'}} variant={"link"} onClick={e => {
                    // setProject(project, "select");
                    setShowLog(false, 'none');
                    // ProjectEventBus.selectProject(project);
                    navigate("/projects/"+ project.projectId);
                }}>
                    {project.projectId}
                </Button>
            </Td>
            <Td>{project.name}</Td>
            <Td>{project.description}</Td>
            <Td>
                <Tooltip content={project.lastCommit} position={"bottom"}>
                    <Badge className="badge">{commit}</Badge>
                </Tooltip>
            </Td>
        </Tr>
    )
}