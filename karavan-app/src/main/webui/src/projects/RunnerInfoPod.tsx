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
                setPodStatus(new PodStatus({name: name}));
            }
        })
    }

    function getPodInfo() {
        const env = props.config.environment;
        return (
            <Label icon={getIcon()} color={getColor()}>
                <Tooltip content={`Phase: ${JSON.stringify(podStatus)}`}>
                    <Button variant="link"
                            onClick={e => ProjectEventBus.showLog('container', podStatus.name, env)}>
                        {podStatus.name}
                    </Button>
                </Tooltip>
            </Label>
        )
    }

    function getPodStatus() {
        const status = !podStatus.terminating ? podStatus.phase : "Terminating"
        return (
            <Label icon={getIcon()} color={getColor()}>
                {status !== "" ? status : "N/A"}
            </Label>
        )
    }

    function getPodRequests() {
        const text = podStatus.requestCpu !== '' ? podStatus.requestCpu + " : " + podStatus.requestMemory : "N/A";
        return (
            <Label icon={getIcon()} color={getColor()}>
                {text}
            </Label>
        )
    }

    function getPodCreation() {
        const text = podStatus.creationTimestamp !== '' ? podStatus.creationTimestamp : "N/A";
        return (
            <Label icon={getIcon()} color={getColor()}>
                {text}
            </Label>
        )
    }

    function getPodLimits() {
        const text = podStatus.limitCpu !== '' ? podStatus.limitCpu + " : " + podStatus.limitMemory : "N/A";
        return (
            <Label icon={getIcon()} color={getColor()}>
                {text}
            </Label>
        )
    }

    function getIcon() {
        return (getRunning() ? <UpIcon/> : <DownIcon/>)
    }

    function getColor() {
        return getRunning() ? "green" : "grey";
    }

    function getRunning(): boolean {
        return podStatus.phase === 'Running' && !podStatus.terminating;
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
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodStatus()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Requests</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodRequests()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Limits</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodLimits()}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodCreation()}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
}
