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

export function InfoContext (props: Props) {
    const [camelStatuses] = useProjectStore((state) => [state.camelStatuses], shallow);

    const camelStatus = camelStatuses.filter(s => s.containerName === props.containerStatus.containerName).at(0);
    const contextValue = camelStatus?.statuses?.filter(x => x.name === 'context').at(0);
    const context = contextValue ? JSON.parse(contextValue?.status || '') : {};

    function getContextInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Name" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.name}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getVersionInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Version" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.version}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getContextState() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="State" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.state}
                    </Label>
                </Tooltip>
                <Tooltip content="Phase" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.phase}
                    </Label>
                </Tooltip>
                <Tooltip content="Uptime" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.uptime}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getExchanges() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Total" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.exchangesTotal}
                    </Label>
                </Tooltip>
                <Tooltip content="Failed" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.exchangesFailed}
                    </Label>
                </Tooltip>
                <Tooltip content="Inflight" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.exchangesInflight}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getProcessingTime() {
        return (
            <LabelGroup numLabels={4}>
                <Tooltip content="Min" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.minProcessingTime}
                    </Label>
                </Tooltip>
                <Tooltip content="Mean" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.meanProcessingTime}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.maxProcessingTime}
                    </Label>
                </Tooltip>
                <Tooltip content="Last" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {context?.context?.statistics?.lastProcessingTime}
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
        return context ? isRunning(context) : false;
    }


    function isRunning(c: any): boolean {
        return c?.context?.state === 'Started';
    }

    return (
        <DescriptionList isHorizontal>
                <DescriptionListGroup>
                    <DescriptionListTerm>Camel</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getContextInfo()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getVersionInfo()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>State</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getContextState()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Exchanges:</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getExchanges()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Processing Time</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getProcessingTime()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
        </DescriptionList>
    );
}
