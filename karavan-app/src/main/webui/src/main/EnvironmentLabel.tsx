import React, {useEffect} from 'react';
import {Label, Tooltip,} from '@patternfly/react-core';
import './PageNavigation.css';
import {useAppConfigStore} from "@/api/ProjectStore";
import {KubernetesIcon} from "@/designer/icons/ComponentIcons";
import DockerIcon from "@patternfly/react-icons/dist/esm/icons/docker-icon";

export function EnvironmentLabel() {

    const config = useAppConfigStore((s) => s.config)
    const [info] = useAppConfigStore((s) => [s.dockerInfo])

    const iconInfra = config.infrastructure === 'kubernetes' ? KubernetesIcon("infra-icon-k8s") : <DockerIcon className='infra-icon-docker'/>;

    useEffect(() => {

    }, []);

    return (info.NodeId?.trim().length > 0
            ? <Tooltip
                position={"right-start"}
                content={
                    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
                        <div>{`NodeId: ${info.NodeId}`}</div>
                        <div>{`Nodes: ${info.Nodes}`}</div>
                        <div>{`Managers: ${info.Managers}`}</div>
                        <div>{`Error: ${info.Error}`}</div>
                    </div>
                }>
                <Label color='green' icon={iconInfra}>{config.environment}</Label>
            </Tooltip>
            : <Label color='grey' icon={iconInfra}>{config.environment}</Label>
    )
}