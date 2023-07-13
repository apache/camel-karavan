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
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {PodStatus} from "../../api/ProjectModels";
import {useLogStore} from "../../api/ProjectStore";


interface Props {
    podStatus: PodStatus,
}

export const InfoPod = (props: Props) => {

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
        return props.podStatus.ready;
    }

    const podStatus = props.podStatus;
    return (
        <DescriptionList isHorizontal>
            <DescriptionListGroup>
                <DescriptionListTerm>Pod</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(podStatus.name)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(podStatus.ready ? "Ready" : "Not Ready")}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>CPU</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(podStatus.cpuInfo)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Memory</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(podStatus.memoryInfo)}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                    {getPodInfoLabel(podStatus.created)}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
}
