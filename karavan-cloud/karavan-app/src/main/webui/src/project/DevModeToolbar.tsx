import React, {useState} from 'react';
import {
    Button, FlexItem, Switch,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {useProjectStore, useRunnerStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";


interface Props {
    reloadOnly?: boolean
}

export const DevModeToolbar = (props: Props) => {

    const [status] = useRunnerStore((state) => [state.status], shallow)
    const [project] = useProjectStore((state) => [state.project], shallow)
    const [verbose, setVerbose] = useState(false);

    const isRunning = status === "running";
    const isStartingPod = status === "starting";
    const isReloadingPod = status === "reloading";
    const isDeletingPod = status === "deleting";
    return (<>
        {(isRunning || isDeletingPod) && !isReloadingPod && props.reloadOnly !== true && <FlexItem>
            <Tooltip content="Stop devmode" position={TooltipPosition.bottom}>
                <Button isLoading={isDeletingPod ? true : undefined}
                        isSmall
                        variant={"secondary"}
                        className="project-button"
                        icon={!isRunning ? <DeleteIcon/> : <div></div>}
                        onClick={() => ProjectService.deleteRunner(project)}>
                    {isDeletingPod ? "..." : "Stop"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {!isRunning && !isReloadingPod && !isDeletingPod && props.reloadOnly !== true && <FlexItem>
            <Tooltip content="Verbose" position={TooltipPosition.bottom}>
                <Switch aria-label="verbose"
                        id="verbose"
                        isChecked={verbose}
                        onChange={checked => setVerbose(checked)}
                />
            </Tooltip>
        </FlexItem>}
        {!isRunning && !isReloadingPod && props.reloadOnly !== true && <FlexItem>
            <Tooltip content="Run in developer mode" position={TooltipPosition.bottom}>
                <Button isLoading={isStartingPod ? true : undefined}
                        isSmall
                        variant={"primary"}
                        className="project-button"
                        icon={!isStartingPod ? <RocketIcon/> : <div></div>}
                        onClick={() => ProjectService.startRunner(project, verbose)}>
                    {isStartingPod ? "..." : "Run"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {(isRunning || isReloadingPod) && <FlexItem>
            <Tooltip content="Reload" position={TooltipPosition.bottom}>
                <Button isLoading={isReloadingPod ? true : undefined}
                        isSmall
                        variant={"primary"}
                        className="project-button"
                        icon={!isReloadingPod ? <ReloadIcon/> : <div></div>}
                        onClick={() => ProjectService.reloadRunner(project)}>
                    {isReloadingPod ? "..." : "Reload"}
                </Button>
            </Tooltip>
        </FlexItem>}
    </>);
}
