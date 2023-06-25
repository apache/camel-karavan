import React from 'react';
import {
    Button,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Label,
    Tooltip
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {PodStatus} from "../ProjectModels";
import {ProjectEventBus} from "../ProjectEventBus";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";


export function isRunning(status: PodStatus): boolean {
    return status.phase === 'Running' && !status.terminating;
}

interface Props {
    podStatus: PodStatus,
    config: any,
}

export const RunnerInfoPod = (props: Props) => {

    function getPodInfo() {
        const env = props.config.environment;
        const podStatus = props.podStatus;
        return (
            <Label icon={getIcon()} color={getColor()}>
                <Tooltip content={"Show log"}>
                    <Button variant="link"
                            onClick={e => ProjectEventBus.showLog('container', podStatus.name, env)}>
                        {podStatus.name}
                    </Button>
                </Tooltip>
            </Label>
        )
    }

    function getPodStatus() {
        const podStatus = props.podStatus;
        const status = !podStatus.terminating ? podStatus.phase : "Terminating"
        return (
            <Label icon={getIcon()} color={getColor()}>
                {status !== "" ? status : "N/A"}
            </Label>
        )
    }

    function getPodRequests() {
        const podStatus = props.podStatus;
        const text = podStatus.requestCpu !== '' ? podStatus.requestCpu + " : " + podStatus.requestMemory : "N/A";
        return (
            <Label icon={getIcon()} color={getColor()}>
                {text}
            </Label>
        )
    }

    function getPodCreation() {
        const podStatus = props.podStatus;
        const text = podStatus.creationTimestamp !== '' ? podStatus.creationTimestamp : "N/A";
        return (
            <Label icon={getIcon()} color={getColor()}>
                {text}
            </Label>
        )
    }

    function getPodLimits() {
        const podStatus = props.podStatus;
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
        return isRunning(props.podStatus);
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
