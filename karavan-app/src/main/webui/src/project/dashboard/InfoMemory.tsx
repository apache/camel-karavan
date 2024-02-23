/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import {ContainerStatus} from "../../api/ProjectModels";
import {useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";


interface Props {
    containerStatus: ContainerStatus
}

export function InfoMemory (props: Props) {

    const [camelStatuses] = useProjectStore((state) => [state.camelStatuses], shallow);

    const camelStatus = camelStatuses.filter(s => s.containerName === props.containerStatus.containerName).at(0);
    const jvmValue = camelStatus?.statuses?.filter(x => x.name === 'jvm').at(0);
    const memoryValue = camelStatus?.statuses?.filter(x => x.name === 'memory').at(0);
    const jvm = jvmValue ? JSON.parse(jvmValue?.status || '') : {};
    const memory = memoryValue ? JSON.parse(memoryValue?.status || '') : {};

    function getJvmInfo() {
        return (
            <LabelGroup numLabels={2}>
                <Label icon={getIcon()} color={getColor()}>
                    {jvm?.jvm?.vmVendor} {jvm?.jvm?.vmVersion}
                </Label>
            </LabelGroup>
        )
    }

    function getHeapInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Init" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {memory?.memory?.heapMemoryInit}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {memory?.memory?.heapMemoryMax}
                    </Label>
                </Tooltip>
                <Tooltip content="Used" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {memory?.memory?.heapMemoryUsed}
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
                        {jvm?.jvm?.vmUptime}
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
                        {jvm?.jvm?.pid}
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
                        {memory?.memory?.nonHeapMemoryInit}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {memory?.memory?.nonHeapMemoryMax}
                    </Label>
                </Tooltip>
                <Tooltip content="Used" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {memory?.memory?.nonHeapMemoryUsed}
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
