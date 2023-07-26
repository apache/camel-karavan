import React, {useState} from 'react';
import {Button, Flex, FlexItem, Label, Spinner, Switch, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useDevModeStore, useLogStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";


interface Props {
    reloadOnly?: boolean
}

export const DevModeToolbar = (props: Props) => {

    const [status] = useDevModeStore((state) => [state.status], shallow)
    const [project, containerStatus ] = useProjectStore((state) => [state.project, state.containerStatus], shallow)
    const [verbose, setVerbose] = useState(false);

    const commands = containerStatus.commands;
    const isRunning = containerStatus.state === 'running';
    const inTransit = containerStatus.inTransit;
    const isLoading= status === 'wip';
    const color = containerStatus.state === 'running' ? "green" : "grey";
    const icon = isRunning ? <UpIcon/> : <DownIcon/>;
    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        <FlexItem>
            {(inTransit || isLoading) && <Spinner isSVG size="lg" aria-label="spinner"/>}
        </FlexItem>
        {containerStatus.containerId && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button variant="link"
                            onClick={e =>
                                useLogStore.setState({showLog: true, type: 'container', podName: containerStatus.containerName})}>
                        {containerStatus.containerName}
                    </Button>
                </Tooltip>
            </Label>
        </FlexItem>}
        <FlexItem>
            <Tooltip content="Verbose" position={TooltipPosition.bottom}>
                <Switch aria-label="verbose"
                        id="verbose"
                        isChecked={verbose}
                        onChange={checked => setVerbose(checked)}
                />
            </Tooltip>
        </FlexItem>
        {!isRunning && <FlexItem>
            <Tooltip content="Run in developer mode" position={TooltipPosition.bottom}>
                <Button isSmall
                        isDisabled={(!(commands.length === 0) && !commands.includes('run')) || inTransit}
                        variant={"primary"}
                        icon={<RocketIcon/>}
                        onClick={() => ProjectService.startDevModeContainer(project, verbose)}>
                    {"Run"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {isRunning && <FlexItem>
            <Tooltip content="Reload" position={TooltipPosition.bottom}>
                <Button isSmall
                        isDisabled={inTransit}
                        variant={"primary"}
                        className="project-button"
                        icon={<ReloadIcon/>}
                        onClick={() => ProjectService.reloadDevModeCode(project)}>Reload
                </Button>
            </Tooltip>
        </FlexItem>}
        {<FlexItem>
            <Tooltip content="Stop container" position={TooltipPosition.bottom}>
                <Button isSmall
                        isDisabled={!commands.includes('stop') || inTransit}
                        variant={"control"}
                        icon={<StopIcon/>}
                        onClick={() => ProjectService.stopDevModeContainer(project)}>
                </Button>
            </Tooltip>
        </FlexItem>}
        {<FlexItem>
            <Tooltip content="Delete container" position={TooltipPosition.bottom}>
                <Button isSmall
                        isDisabled={!commands.includes('delete') || inTransit}
                        variant={"control"}
                        icon={<DeleteIcon/>}
                        onClick={() => ProjectService.deleteDevModeContainer(project)}>
                </Button>
            </Tooltip>
        </FlexItem>}
    </Flex>);
}
