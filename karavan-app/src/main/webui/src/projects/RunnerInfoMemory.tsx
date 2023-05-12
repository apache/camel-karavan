import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Label, LabelGroup,
    Tooltip
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {PodStatus, Project} from "./ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "./ProjectEventBus";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";


interface Props {
    project: Project,
    config: any,
}

export const RunnerInfoMemory = (props: Props) => {

    const [memory, setMemory] = useState({});
    const [jvm, setJvm] = useState({});

    useEffect(() => {
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    function onRefreshStatus() {
        const projectId = props.project.projectId;
        KaravanApi.getRunnerConsoleStatus(projectId, "memory", res => {
            if (res.status === 200) {
                setMemory(res.data);
            } else {
                setMemory({});
            }
        })
        KaravanApi.getRunnerConsoleStatus(projectId, "jvm", res => {
            if (res.status === 200) {
                setJvm(res.data);
            } else {
                setJvm({});
            }
        })
    }

    function getJvmInfo() {
        return (
            <LabelGroup numLabels={2}>
                <Label icon={getIcon()} color={getColor()}>
                    {(jvm as any)?.jvm?.vmVendor} {(jvm as any)?.jvm?.vmVersion}
                </Label>
            </LabelGroup>
        )
    }

    function getHeapInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Init" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {(memory as any)?.memory?.heapMemoryInit}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {(memory as any)?.memory?.heapMemoryMax}
                    </Label>
                </Tooltip>
                <Tooltip content="Used" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {(memory as any)?.memory?.heapMemoryUsed}
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
                        {(jvm as any)?.jvm?.vmUptime}
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
                        {(jvm as any)?.jvm?.pid}
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
                        {(memory as any)?.memory?.nonHeapMemoryInit}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {(memory as any)?.memory?.nonHeapMemoryMax}
                    </Label>
                </Tooltip>
                <Tooltip content="Used" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {(memory as any)?.memory?.nonHeapMemoryUsed}
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
        return isRunning(jvm);
    }


    function isRunning(c: any): boolean {
        return c?.jvm?.pid != undefined;
    }

    return (
        <DescriptionList isHorizontal>
            <DescriptionListGroup>
                <DescriptionListTerm>JVM Memory</DescriptionListTerm>
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
