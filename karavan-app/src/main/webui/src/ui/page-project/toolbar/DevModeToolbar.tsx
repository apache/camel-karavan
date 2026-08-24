import React, {useEffect, useState} from 'react';
import {Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Tooltip, TooltipPosition} from '@patternfly/react-core';
import {BoltIcon, BugIcon, CodeIcon, EllipsisVIcon, ListIcon, StopIcon, TrashIcon} from "@patternfly/react-icons";
import {useAppConfigStore, useProjectStore} from "@stores/ProjectStore";
import {ProjectService} from "@services/ProjectService";
import {shallow} from "zustand/shallow";
import "./DevModeToolbar.css"
import {ProjectContainersContext} from "../ProjectContainersContextProvider";
import {Rocket} from "@carbon/icons-react";

export function DevModeToolbar() {

    const context = React.useContext(ProjectContainersContext);
    if (!context) throw new Error("ProjectContainersContext not found!");
    const {packagedContainerStatuses, devModeContainerStatus, devModeIsRunning, containerStatuses} = context;

    const config = useAppConfigStore((s) => s.config);
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
                    <DropdownItem value={0} key="verbose" icon={<ListIcon/>} onClick={(ev) => runDevMode(ev, true, false)}>
                        Run verbose
                    </DropdownItem>
                    <DropdownItem value={1} key="compile" icon={<CodeIcon/>} onClick={(ev) => runDevMode(ev, false, true)}>
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
                            variant={"link"}
                            icon={<Rocket className={"carbon"}/>}
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
                            variant={"plain"}
                            icon={<BoltIcon/>}
                            onClick={() => ProjectService.reloadDevModeCode(project)}>
                        {"Reload"}
                    </Button>
                </Tooltip>
            }
            {inDevMode && !isKubernetes &&
                <Tooltip content="Stop container" position={TooltipPosition.bottomEnd}>
                    <Button className="dev-action-button"
                            isDisabled={!commands.includes('stop') || inTransit}
                            variant={"plain"}
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
                            variant={"plain"}
                            icon={<TrashIcon/>}
                            onClick={() => {
                                setShowSpinner(true);
                                ProjectService.deleteDevModeContainer(project.projectId);
                            }}>
                    </Button>
                </Tooltip>
            }
        </div>);
}
