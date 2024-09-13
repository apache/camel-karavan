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
import {
    Badge,
    Button,
    Flex,
    FlexItem,
    Label,
    Spinner,
    Switch,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {ContainerStatus} from "../api/ProjectModels";
import "./DevModeToolbar.css"
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";

interface Props {
    reloadOnly?: boolean
}

export function DevModeToolbar(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow);
    const [project, refreshTrace] = useProjectStore((state) => [state.project, state.refreshTrace], shallow)
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [verbose, setVerbose] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [currentContainerStatus] = useState<ContainerStatus>();

    const isKubernetes = config.infrastructure === 'kubernetes'
    const containerStatuses = containers.filter(c => c.projectId === project.projectId) || [];

    const containersProject = containerStatuses.filter(c => c.type === 'project') || [];
    const allRunning = containersProject.length > 0
        && (containersProject.filter(c => c.state === 'running').length === containersProject.length);

    const containerDevMode = containerStatuses.filter(c => c.type === 'devmode').at(0);
    const commands = containerDevMode?.commands || ['run'];
    const isRunning = containerDevMode?.state === 'running';
    const showLogDevMode = containerDevMode && ['running', 'paused', 'exited'].includes(containerDevMode?.state);
    const inTransit = containerDevMode?.inTransit;
    const color = (isRunning || allRunning) ? "green" : "grey";
    const icon = (isRunning || allRunning) ? <UpIcon/> : <DownIcon/>;
    const inDevMode = containerDevMode?.type === 'devmode';

    useEffect(() => {
        if (showSpinner && currentContainerStatus === undefined && containerDevMode === undefined) {
            setShowSpinner(false);
        }
    }, [currentContainerStatus, refreshTrace]);

    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        {showSpinner && inDevMode && <FlexItem className="dev-action-button-place refresher">
            <Spinner className="spinner" aria-label="Refresh"/>
        </FlexItem>}
        {containersProject.length > 0 && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button className='labeled-button'
                            variant="link"
                            isDisabled={!allRunning}
                            onClick={e => {}}>
                        {project.projectId}
                    </Button>
                </Tooltip>
                {containersProject.length > 1 && <Badge isRead={!allRunning}>{containersProject.length}</Badge>}
                <Badge isRead>{'project'}</Badge>
            </Label>
        </FlexItem>}
        {containerDevMode?.containerId && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button className='labeled-button'
                            variant="link"
                            isDisabled={!showLogDevMode}
                            onClick={e =>
                                setShowLog(true, 'container', containerDevMode.containerName)}>
                        {containerDevMode.containerName}
                    </Button>
                </Tooltip>
                <Badge isRead>{containerDevMode.type}</Badge>
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
                            setShowSpinner(true);
                            ProjectService.startDevModeContainer(project, verbose);
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
        {inDevMode && !isKubernetes && <FlexItem className="dev-action-button-place">
            <Tooltip content="Stop container" position={TooltipPosition.bottomEnd}>
                <Button className="dev-action-button" size="sm"
                        isDisabled={!commands.includes('stop') || inTransit}
                        variant={"control"}
                        icon={<StopIcon/>}
                        onClick={() => {
                            setShowSpinner(true);
                            ProjectService.stopDevModeContainer(project);
                        }}>
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
                            setShowSpinner(true);
                            ProjectService.deleteDevModeContainer(project);
                        }}>
                </Button>
            </Tooltip>
        </FlexItem>}
    </Flex>);
}
