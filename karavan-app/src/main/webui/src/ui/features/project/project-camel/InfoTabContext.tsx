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
import {Content, Label, LabelGroup, Tooltip} from '@patternfly/react-core';
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {shallow} from "zustand/shallow";
import {useProjectStore} from "@stores/ProjectStore";
import {ContainerStatus} from "@models/ProjectModels";
import TimeAgo from "javascript-time-ago";

interface Props {
    containerStatus: ContainerStatus
}

export function InfoTabContext(props: Props) {
    const [camelStatuses] = useProjectStore((state) => [state.camelStatuses], shallow);

    const camelStatus = camelStatuses.filter(s => s.containerName === props.containerStatus.containerName).at(0);
    const contextValue = camelStatus?.statuses?.filter(x => x.name === 'context').at(0);
    const context = contextValue ? JSON.parse(contextValue?.status || '') : {};
    const timeAgo = new TimeAgo('en-US')
    const form = new Intl.NumberFormat('en-US');

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
        const uptime = context?.context?.uptime;
        const startedAt = Date.now() - uptime;
        const ago = context?.context?.uptime ? timeAgo.format(startedAt, 'mini-now') : undefined;
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
                        {ago}
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
                        {form.format(context?.context?.statistics?.exchangesTotal || 0)}
                    </Label>
                </Tooltip>
                <Tooltip content="Failed" position={"bottom"}>
                    <Label icon={getIcon()} color={'red'}>
                        {form.format(context?.context?.statistics?.exchangesFailed || 0)}
                    </Label>
                </Tooltip>
                <Tooltip content="Inflight" position={"bottom"}>
                    <Label icon={getIcon()} color={"blue"}>
                        {form.format(context?.context?.statistics?.exchangesInflight || 0)}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getProcessingTime() {
        return (
            <LabelGroup numLabels={4}>
                <Tooltip content="Min" position={"bottom"}>
                    <Label icon={getIcon()} color={"green"}>
                        {form.format(context?.context?.statistics?.minProcessingTime || 0)}
                    </Label>
                </Tooltip>
                <Tooltip content="Mean" position={"bottom"}>
                    <Label icon={getIcon()} color={"blue"}>
                        {form.format(context?.context?.statistics?.meanProcessingTime || 0)}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={"red"}>
                        {form.format(context?.context?.statistics?.maxProcessingTime || 0)}
                    </Label>
                </Tooltip>
                <Tooltip content="Last" position={"bottom"}>
                    <Label icon={getIcon()} color={"blue"}>
                        {form.format(context?.context?.statistics?.lastProcessingTime || 0)}
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
        <div className="runtime-tab">
            <div className="runtime-element">
                <Content>Context</Content>
                {getContextInfo()}
                {getVersionInfo()}
            </div>
            <div className="runtime-element">
                <Content>State</Content>
                {getContextState()}
            </div>
            <div className="runtime-element">
                <Content>Exchanges:</Content>
                {getExchanges()}
            </div>
            <div className="runtime-element">
                <Content>External:</Content>
                {getExchanges()}
            </div>
            <div className="runtime-element">
                <Content>Processing Time</Content>
                {getProcessingTime()}
            </div>
        </div>
    );
}
