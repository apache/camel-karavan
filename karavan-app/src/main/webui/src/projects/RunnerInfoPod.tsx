import React, {useEffect, useState} from 'react';
import {
    Badge,
    Button,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Flex,
    FlexItem,
    Label,
    LabelGroup,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {CamelStatus, DeploymentStatus, PipelineStatus, PodStatus, Project} from "./ProjectModels";
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "./ProjectEventBus";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";


interface Props {
    project: Project,
    config: any,
}

export const RunnerInfoPod = (props: Props) => {

    const [podStatus, setPodStatus] = useState(new PodStatus());

    useEffect(() => {
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    function onRefreshStatus() {
        const projectId = props.project.projectId;
        const name = projectId + "-runner";
        KaravanApi.getRunnerPodStatus(projectId, name, res => {
            if (res.status === 200) {
                setPodStatus(res.data);
            } else {
                ProjectEventBus.showLog('container', name, props.config.environment, false);
                setPodStatus(new PodStatus());
            }
        })
    }

    function getPodInfo() {
        const running = podStatus.phase === 'Running' && podStatus.ready;
        const env = props.config.environment;
        return (
            <Label icon={running ? <UpIcon/> : <DownIcon/>} color={running ? "green" : "grey"}>
                <Button variant="link"
                        onClick={e => ProjectEventBus.showLog('container', podStatus.name, env)}>
                    {podStatus.name}
                </Button>
                {/*<Tooltip content={"Delete Pod"}>*/}
                {/*    <Button icon={<DeleteIcon/>} variant="link" onClick={e => this.setState({*/}
                {/*        showDeleteConfirmation: true,*/}
                {/*        deleteEntity: "pod",*/}
                {/*        deleteEntityEnv: env,*/}
                {/*        deleteEntityName: podStatus.name*/}
                {/*    })}></Button>*/}
                {/*</Tooltip>*/}
            </Label>
        )
    }

    return (
        <DescriptionList isHorizontal>
            <DescriptionListGroup>
                <DescriptionListTerm>Pod</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfo()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>????</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfo()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>????</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfo()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>????</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfo()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>????</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfo()}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
}
