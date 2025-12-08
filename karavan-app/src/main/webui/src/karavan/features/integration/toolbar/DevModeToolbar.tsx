import React, {useEffect, useState} from 'react';
import {Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Spinner, Tooltip, TooltipPosition} from '@patternfly/react-core';
import DevIcon from "@patternfly/react-icons/dist/esm/icons/dev-icon";
import DebugIcon from "@patternfly/react-icons/dist/esm/icons/bug-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {ProjectService} from "@services/ProjectService";
import {shallow} from "zustand/shallow";
import RunningIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import CompileIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import VerboseIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import "./DevModeToolbar.css"
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";
import {ProjectContainersContext} from "../ProjectContainersContextProvider";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

export function DevModeToolbar() {

    const context = React.useContext(ProjectContainersContext);
    if (!context) throw new Error("ProjectContainersContext not found!");
    const {packagedContainerStatuses, devModeContainerStatus, devModeIsRunning, packagedIsRunning} = context;

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [project, refreshTrace, tabIndex] = useProjectStore((s) => [s.project, s.refreshTrace, s.tabIndex], shallow)
    const [file] = useFileStore((s) => [s.file], shallow)

    const [showSpinner, setShowSpinner] = useState(false);
    const [reloadAvailable, setReloadAvailable] = useState(false);

    const isKubernetes = config.infrastructure === 'kubernetes'

    const isProjectContainer = packagedContainerStatuses.length > 0;

    const commands = devModeContainerStatus?.commands || ['run'];
    const inTransit = devModeContainerStatus?.inTransit;
    const isUp = (devModeIsRunning || packagedIsRunning);
    const logButtonClassName = isUp ? "log-button-up" : "";
    const logIconClassName = isUp ? "log-button-icon-up" : "";
    const logButtonVariant = isUp ? "secondary" : "tertiary";
    const icon = isUp
        ? <RunningIcon className={logIconClassName}/>
        : <DownIcon/>;
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
            {showSpinner && inDevMode &&
                <div className="dev-action-button-place refresher">
                    <Spinner className="spinner" aria-label="Refresh"/>
                </div>
            }
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
