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
import {Badge, Button, Flex, FlexItem, Label, Spinner, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useAppConfigStore, useDevModeStore, useLogStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";

interface Props {
    reloadOnly?: boolean
}

export function BuildToolbar (props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [status] = useDevModeStore((state) => [state.status], shallow)
    const [project] = useProjectStore((state) => [state.project], shallow)
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);

    const containerStatus = containers.filter(c => c.containerName === project.projectId).at(0);
    const isRunning = containerStatus?.state === 'running';
    const inTransit = containerStatus?.inTransit;
    const isLoading = status === 'wip';
    const color = containerStatus?.state === 'running' ? "green" : "grey";
    const icon = isRunning ? <UpIcon/> : <DownIcon/>;

    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        <FlexItem>
            <Button className="dev-action-button" style={{visibility:"hidden"}} size="sm" variant={"control"} icon={<DeleteIcon/>} onClick={() => {}}>
            </Button>
        </FlexItem>
        {containerStatus?.containerId && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button className="dev-action-button labeled-button" variant="link" isDisabled={!isRunning}
                            onClick={e =>
                                setShowLog( true, 'container', containerStatus.containerName)}>
                        {containerStatus.containerName}
                    </Button>
                </Tooltip>
                <Badge isRead>{containerStatus.type}</Badge>
            </Label>
        </FlexItem>}
    </Flex>)
}