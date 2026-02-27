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
import {Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Tooltip, TooltipPosition} from '@patternfly/react-core';
import DevIcon from "@patternfly/react-icons/dist/esm/icons/dev-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useProjectStore} from "@stores/ProjectStore";
import {ProjectService} from "@services/ProjectService";
import {shallow} from "zustand/shallow";
import CompileIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import VerboseIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import "./DevModeToolbar.css"
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";
import {ProjectContainersContext} from "../ProjectContainersContextProvider";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

export function DevModeToolbar() {

    const context = React.useContext(ProjectContainersContext);
    if (!context) throw new Error("ProjectContainersContext not found!");
    const {packagedContainerStatuses, devModeContainerStatus, devModeIsRunning, containerStatuses} = context;

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [project, refreshTrace, tabIndex] = useProjectStore((s) => [s.project, s.refreshTrace, s.tabIndex], shallow)

    const [showSpinner, setShowSpinner] = useState(false);
    const [reloadAvailable, setReloadAvailable] = useState(false);

    const isKubernetes = config.infrastructure === 'kubernetes'

    const isProjectContainer = packagedContainerStatuses.length > 0;

    const commands = devModeContainerStatus?.commands || ['run'];
    const inTransit = devModeContainerStatus?.inTransit;
    const inDevMode = devModeContainerStatus?.type === 'devmode';
    const isExited = devModeContainerStatus?.state === 'exited';

    useEffect(() => {
        if (showSpinner && hasContainer()) {
            setShowSpinner(false);
        }
    }, [devModeContainerStatus, refreshTrace]);

    const [isToggleOpen, setIsToggleOpen] = React.useState(false);

    const hasContainer = () => {
        return devModeContainerStatus?.containerId !== undefined && devModeContainerStatus?.containerId !== null
    };

    const onToggleClick = () => {
        setIsToggleOpen(!isToggleOpen);
    };

    const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
        // eslint-disable-next-line no-console
        setIsToggleOpen(false);
    };

    function runDevMode(ev: any, verbose: boolean, compile: boolean = false) {
        ev.preventDefault();
        setShowSpinner(true);
        setReloadAvailable(!compile);
        ProjectService.startDevModeContainer(project.projectId, verbose, compile);
    }

    function getRunButton() {
        return (
            <Dropdown
                className="dev-action-button"
                onSelect={onSelect}
                popperProps={{position: 'right'}}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                        ref={toggleRef}
                        onClick={onToggleClick}
                        variant="plain"
                        isExpanded={isToggleOpen}
                        aria-label="Action list single group kebab"
                        icon={<EllipsisVIcon/>}
                    />
                )}
                isOpen={isToggleOpen}
                onOpenChange={(isOpen: boolean) => setIsToggleOpen(isOpen)}
            >
                <DropdownList>
                    <DropdownItem value={0} key="verbose" icon={<VerboseIcon/>} onClick={(ev) => runDevMode(ev, true, false)}>
                        Run verbose
                    </DropdownItem>
                    <DropdownItem value={1} key="compile" icon={<CompileIcon/>} onClick={(ev) => runDevMode(ev, false, true)}>
                        Run compile
                    </DropdownItem>
                </DropdownList>
            </Dropdown>
        )
    }

    return (
        <div style={{display: 'flex', flexDirection: 'row', gap: '8px'}}>

            {!devModeIsRunning && !hasContainer() && !isProjectContainer && tabIndex !== "build" &&
                <Tooltip content="Run in Developer mode" position={TooltipPosition.bottomEnd}>
                    <Button className="dev-action-button"
                            isDisabled={inTransit}
                            variant={"primary"}
                            icon={<DevIcon/>}
                            onClick={(ev) => runDevMode(ev, false, false)}>
                        Run
                    </Button>
                </Tooltip>
            }
            {!devModeIsRunning && !hasContainer() && !isProjectContainer && tabIndex !== "build" && getRunButton()}
            {devModeIsRunning && inDevMode && reloadAvailable &&
                <Tooltip content="Reload" position={TooltipPosition.bottom}>
                    <Button className="project-button dev-action-button"
                            isDisabled={inTransit}
                            variant={"secondary"}
                            icon={<ReloadIcon/>}
                            onClick={() => ProjectService.reloadDevModeCode(project)}>
                        {"Reload"}
                    </Button>
                </Tooltip>
            }
            {inDevMode && !isKubernetes &&
                <Tooltip content="Stop container" position={TooltipPosition.bottomEnd}>
                    <Button className="dev-action-button"
                            isDisabled={!commands.includes('stop') || inTransit}
                            variant={"control"}
                            icon={<StopIcon/>}
                            onClick={() => {
                                setShowSpinner(true);
                                ProjectService.stopDevModeContainer(project.projectId);
                            }}>
                    </Button>
                </Tooltip>
            }
            {inDevMode &&
                <Tooltip content="Delete container" position={TooltipPosition.bottomEnd}>
                    <Button className="dev-action-button"
                            variant={"control"}
                            icon={<DeleteIcon/>}
                            onClick={() => {
                                setShowSpinner(true);
                                ProjectService.deleteDevModeContainer(project.projectId);
                            }}>
                    </Button>
                </Tooltip>
            }
        </div>);
}
