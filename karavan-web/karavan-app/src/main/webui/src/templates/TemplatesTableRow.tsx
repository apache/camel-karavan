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
    useAppConfigStore,
    useLogStore,
    useProjectStore, useStatusesStore,
} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {CamelIcon, QuarkusIcon, SpringIcon} from "../designer/utils/KaravanIcons";
import {useNavigate} from "react-router-dom";

interface Props {
    project: Project
}

export function TemplatesTableRow (props: Props) {

    const [deployments, containers] = useStatusesStore((state) => [state.deployments, state.containers], shallow)
    const {config} = useAppConfigStore();
    const [setProject] = useProjectStore((state) => [state.setProject, state.setOperation], shallow);
    const [setShowLog] = useLogStore((state) => [state.setShowLog], shallow);
    const navigate = useNavigate();

    function getEnvironments(): string [] {
        return config.environments && Array.isArray(config.environments) ? Array.from(config.environments) : [];
    }

    function getStatusByEnvironments(name: string): [string, any] [] {
        return getEnvironments().map(e => {
            const env: string = e as string;
            const status = config.infrastructure === 'kubernetes'
                ? deployments.find(d => d.name === name && d.env === env)
                : containers.find(d => d.containerName === name && d.env === env);
            return [env, status];
        });
    }

    function getIcon(runtime: string) {
        if (runtime === 'quarkus') return QuarkusIcon();
        else if (runtime === 'spring-boot') return SpringIcon();
        else if (runtime === 'camel-main') return CamelIcon();
    }

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