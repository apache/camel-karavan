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
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {ContainerStatus} from "@models/ProjectModels";
import {Td, Tr} from "@patternfly/react-table";

interface Props {
    containerStatus: ContainerStatus,
    index: number,
}

export function ContainersTableRow(props: Props) {

    const {containerStatus, index} = props;

    function getPodInfoLabel(info: React.ReactNode) {
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

    return (
        <Tr key={index} style={{verticalAlign: "middle"}}>
            <Td>
                {getPodInfoLabel(
                    <>
                        {containerStatus.containerName}
                        <Badge isRead>{containerStatus.type}</Badge>
                    </>
                )}
            </Td>
            <Td>
                {getPodInfoLabel(containerStatus.state)}
            </Td>
            <Td>{(containerStatus.created)}</Td>
            <Td>{containerStatus.image}</Td>
            <Td>{(containerStatus.cpuInfo)}</Td>
            <Td>{(containerStatus.memoryInfo)}</Td>
        </Tr>
    )
}
