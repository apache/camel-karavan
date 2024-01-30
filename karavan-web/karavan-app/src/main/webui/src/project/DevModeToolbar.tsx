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

import React, {useEffect, useState} from 'react';
import {Badge, Button, Flex, FlexItem, Label, Spinner, Switch, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useDevModeStore, useLogStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import StopIcon from "@patternfly/react-icons/dist/esm/icons/stop-icon";
import {ContainerStatus} from "../api/ProjectModels";
import "./devmode.css"

interface Props {
    reloadOnly?: boolean
}

export function DevModeToolbar(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [status] = useDevModeStore((state) => [state.status], shallow)
    const [project, refreshTrace] = useProjectStore((state) => [state.project, state.refreshTrace], shallow)
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [verbose, setVerbose] = useState(false);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [poll, setPoll] = useState(false);
    const [currentContainerStatus, setCurrentContainerStatus] = useState<ContainerStatus>();

    const containerStatus = containers.filter(c => c.containerName === project.projectId).at(0);
    const commands = containerStatus?.commands || ['run'];
    const isRunning = containerStatus?.state === 'running';
    const inTransit = containerStatus?.inTransit;
    const isLoading = status === 'wip';
    const color = containerStatus?.state === 'running' ? "green" : "grey";
    const icon = isRunning ? <UpIcon/> : <DownIcon/>;
    const inDevMode = containerStatus?.type === 'devmode';

    useEffect(() => {
        const interval = setInterval(() => {
            refreshContainer();
        }, 1300)
        return () => clearInterval(interval);
    }, [poll, currentContainerStatus, containers]);

    function refreshContainer(){
        if (poll) {
            ProjectService.refreshAllContainerStatuses();
            ProjectService.refreshCamelStatus(project.projectId, config.environment);
            ProjectService.refreshImages(project.projectId);
            if (refreshTrace) {
                ProjectService.refreshCamelTraces(project.projectId, config.environment);
            }
            if (currentContainerStatus && !containerStatus) {
                setPoll(false);
            }
            setCurrentContainerStatus(containerStatus);
        }
    }

    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        <FlexItem className="dev-action-button-place refresher">
            {poll && <Spinner className="spinner" size="lg" aria-label="Refresh"/>}
            <Tooltip content={poll ? "Stop refresh" : "Refresh auto"} position={TooltipPosition.bottom}>
                <Button className="dev-action-button button"
                        icon={poll ? <StopIcon/> : <RefreshIcon/>}
                        variant={"link"}
                        onClick={e => setPoll(!poll)}/>
            </Tooltip>
        </FlexItem>
        {/*Replace with something else because Spinner is used fo refresh*/}
        {/*{(inTransit || isLoading) &&*/}
        {/*    <FlexItem>*/}
        {/*        <Spinner size="lg" aria-label="spinner"/>*/}
        {/*    </FlexItem>*/}
        {/*}*/}
        {containerStatus?.containerId && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button className='labeled-button' variant="link" isDisabled={!isRunning}
                            onClick={e =>
                                setShowLog(true, 'container', containerStatus.containerName)}>
                        {containerStatus.containerName}
                    </Button>
                </Tooltip>
                <Badge isRead>{containerStatus.type}</Badge>
            </Label>
        </FlexItem>}
        {!isRunning && <FlexItem className="dev-action-button-place">
            <Tooltip content="Verbose" position={TooltipPosition.bottom}>
                <Switch aria-label="verbose"
                        id="verbose"
                        isChecked={verbose}
                        onChange={(_, checked) => setVerbose(checked)}
                />
            </Tooltip>
        </FlexItem>}
        {!isRunning && <FlexItem className="dev-action-button-place">
            <Tooltip content="Run in developer mode" position={TooltipPosition.bottomEnd}>
                <Button className="dev-action-button" size="sm"
                        isDisabled={(!(commands.length === 0) && !commands.includes('run')) || inTransit}
                        variant={"primary"}
                        icon={<RocketIcon/>}
                        onClick={() => {
                            ProjectService.startDevModeContainer(project, verbose);
                            setPoll(true);
                        }}>
                    {"Run"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {isRunning && inDevMode && <FlexItem className="dev-action-button-place">
            <Tooltip content="Reload" position={TooltipPosition.bottomEnd}>
                <Button className="project-button dev-action-button" size="sm"
                        isDisabled={inTransit}
                        variant={"primary"}
                        icon={<ReloadIcon/>}
                        onClick={() => ProjectService.reloadDevModeCode(project)}>Reload
                </Button>
            </Tooltip>
        </FlexItem>}
        {inDevMode && <FlexItem className="dev-action-button-place">
            <Tooltip content="Delete container" position={TooltipPosition.bottomEnd}>
                <Button className="dev-action-button" size="sm"
                        isDisabled={!commands.includes('delete') || inTransit}
                        variant={"control"}
                        icon={<DeleteIcon/>}
                        onClick={() => {
                            setPoll(true);
                            ProjectService.deleteDevModeContainer(project);
                        }}>
                </Button>
            </Tooltip>
        </FlexItem>}
    </Flex>);
}
