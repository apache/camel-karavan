import React from 'react';
import {
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Label,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {ContainerStatus} from "../../api/ProjectModels";


interface Props {
    containerStatus: ContainerStatus,
}

export function InfoContainer (props: Props) {

    function getPodInfoLabel(info: string) {
        return (
            <Label icon={getIcon()} color={getColor()}>
                {info}
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
        return props.containerStatus.state === 'running';
    }

    const containerStatus = props.containerStatus;
    return (
        <DescriptionList isHorizontal>
            <DescriptionListGroup>
                <DescriptionListTerm>Pod</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(containerStatus.containerName)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(containerStatus.state)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>CPU</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(containerStatus.cpuInfo)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Memory</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(containerStatus.memoryInfo)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(containerStatus.created)}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
}
