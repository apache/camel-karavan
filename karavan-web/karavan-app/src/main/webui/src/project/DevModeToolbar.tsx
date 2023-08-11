import React, {useState} from 'react';
import {Button, Flex, FlexItem, Label, Spinner, Switch, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useDevModeStore, useLogStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";

interface Props {
    reloadOnly?: boolean
}

export const DevModeToolbar = (props: Props) => {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [status] = useDevModeStore((state) => [state.status], shallow)
    const [project] = useProjectStore((state) => [state.project], shallow)
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [verbose, setVerbose] = useState(false);

    const containerStatus = containers.filter(c => c.containerName === project.projectId).at(0);
    const commands = containerStatus?.commands || ['run'];
    const isRunning = containerStatus?.state === 'running';
    const inTransit = containerStatus?.inTransit;
    const isLoading = status === 'wip';
    const color = containerStatus?.state === 'running' ? "green" : "grey";
    const icon = isRunning ? <UpIcon/> : <DownIcon/>;
    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        <FlexItem>
            {(inTransit || isLoading) && <Spinner size="lg" aria-label="spinner"/>}
        </FlexItem>
        {containerStatus?.containerId && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button className='labeled-button' variant="link" isDisabled={!isRunning}
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
                         onChange={(_, checked) => setVerbose(checked)}
                />
            </Tooltip>
        </FlexItem>
        {!isRunning && <FlexItem>
            <Tooltip content="Run in developer mode" position={TooltipPosition.bottom}>
                <Button size="sm"
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
                <Button size="sm"
                        isDisabled={inTransit}
                        variant={"primary"}
                        className="project-button"
                        icon={<ReloadIcon/>}
                        onClick={() => ProjectService.reloadDevModeCode(project)}>Reload
                </Button>
            </Tooltip>
        </FlexItem>}
        {config.infrastructure !== 'kubernetes' &&
            <FlexItem>
                <Tooltip content="Stop container" position={TooltipPosition.bottom}>
                    <Button size="sm"
                            isDisabled={!commands.includes('stop') || inTransit}
                            variant={"control"}
                            icon={<StopIcon/>}
                            onClick={() => ProjectService.stopDevModeContainer(project)}>
                    </Button>
                </Tooltip>
            </FlexItem>
        }
        <FlexItem>
            <Tooltip content="Delete container" position={TooltipPosition.bottom}>
                <Button size="sm"
                        isDisabled={!commands.includes('delete') || inTransit}
                        variant={"control"}
                        icon={<DeleteIcon/>}
                        onClick={() => ProjectService.deleteDevModeContainer(project)}>
                </Button>
            </Tooltip>
        </FlexItem>
    </Flex>);
}
