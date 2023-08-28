import React from 'react';
import {
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Label, LabelGroup,
    Tooltip
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";


interface Props {
    jvm: any,
    memory: any,
    showConsole: boolean
}

export function InfoMemory (props: Props) {

    function getJvmInfo() {
        return (
            <LabelGroup numLabels={2}>
                <Label icon={getIcon()} color={getColor()}>
                    {props.jvm?.jvm?.vmVendor} {props.jvm?.jvm?.vmVersion}
                </Label>
            </LabelGroup>
        )
    }

    function getHeapInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Init" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.memory?.memory?.heapMemoryInit}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.memory?.memory?.heapMemoryMax}
                    </Label>
                </Tooltip>
                <Tooltip content="Used" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.memory?.memory?.heapMemoryUsed}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getJvmUptime() {
        return (
            <LabelGroup numLabels={2}>
                <Tooltip content="Uptime" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.jvm?.jvm?.vmUptime}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getPid() {
        return (
            <LabelGroup numLabels={2}>
                <Tooltip content="PID" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.jvm?.jvm?.pid}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getNonHeapInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Init" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.memory?.memory?.nonHeapMemoryInit}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.memory?.memory?.nonHeapMemoryMax}
                    </Label>
                </Tooltip>
                <Tooltip content="Used" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.memory?.memory?.nonHeapMemoryUsed}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getIcon() {
        return (getRunning() ? <UpIcon/> : <DownIcon/>)
    }

    function getColor() {
        return getRunning() ? "green" : "grey";
    }

    function getRunning(): boolean {
        return isRunning(props.jvm);
    }


    function isRunning(c: any): boolean {
        return c?.jvm?.pid != undefined;
    }

    return (
        <DescriptionList isHorizontal>
            <DescriptionListGroup>
                <DescriptionListTerm>JVM</DescriptionListTerm>
                <DescriptionListDescription>
                    {getJvmInfo()}
                </DescriptionListDescription>
            </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>PID</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getPid()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Uptime</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getJvmUptime()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Heap</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getHeapInfo()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Non-Heap</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getNonHeapInfo()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
        </DescriptionList>
    );
}
