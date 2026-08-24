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
import {Badge, Label,} from '@patternfly/react-core';
import {CheckCircleIcon, ErrorCircleOIcon} from "@patternfly/react-icons";
import {ContainerStatus} from "@models/ProjectModels";
import {Td, Tr} from "@patternfly/react-table";
import {useAppConfig} from "@compass/useConfig";

interface Props {
    containerStatus: ContainerStatus,
    index: number,
}

export function ContainersTableRow(props: Props) {

    const {containerStatus, index} = props;
    const {isKubernetes} = useAppConfig()

    function getPodInfoLabel(info: React.ReactNode) {
        return (
            <Label icon={getIcon()} color={getColor()}>
                {info}
            </Label>
        )
    }

    function getIcon() {
        return (getRunning() ? <CheckCircleIcon/> : <ErrorCircleOIcon/>)
    }

    function getColor() {
        return getRunning() ? "green" : "grey";
    }

    function getRunning(): boolean {
        if (isKubernetes) {
            return ["Succeeded", "Running"].includes(containerStatus?.phase)
        } else {
            return containerStatus.state === 'running';
        }
    }

    return (
        <Tr key={index} style={{verticalAlign: "middle"}}>
            <Td>
                {getPodInfoLabel(
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "start", gap: 3}}>
                        {containerStatus.containerName}
                        <Badge isRead>{containerStatus.type}</Badge>
                    </div>
                )}
            </Td>
            <Td>
                {getPodInfoLabel(isKubernetes ? containerStatus.phase : containerStatus.state)}
            </Td>
            <Td modifier={"nowrap"}>{containerStatus.created}</Td>
            <Td>{containerStatus.image}</Td>
            <Td modifier={"nowrap"}>{containerStatus.cpuInfo}</Td>
            <Td modifier={"nowrap"}>{containerStatus.memoryInfo}</Td>
            {isKubernetes && <Td width={25}>{containerStatus.stateMessage}</Td>}
        </Tr>
    )
}
