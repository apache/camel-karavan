import React from 'react';
import {Button, Flex, FlexItem, Label, Spinner, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useDevModeStore, useLogStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import RunIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import {ProjectService} from "../api/ProjectService";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {EventBus} from "../designer/utils/EventBus";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";

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
                                setShowLog(true, 'container', containerStatus.containerName)}>
                        {containerStatus.containerName}
                    </Button>
                </Tooltip>
            </Label>
        </FlexItem>}
        {!isRunning && <FlexItem>
            <Tooltip content="Run container" position={TooltipPosition.bottom}>
                <Button size="sm"
                        isDisabled={(!(commands.length === 0) && !commands.includes('run')) || inTransit}
                        variant={"primary"}
                        icon={<RunIcon/>}
                        onClick={() => {
                            KaravanApi.manageContainer('dev', 'project', project.projectId, 'run', res => {
                                setShowLog(false, 'container', undefined)
                            });
                        }}>
                    {"Run"}
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
                            onClick={() => {
                                KaravanApi.manageContainer('dev', 'project', project.projectId, 'stop', res => {
                                    setShowLog(false, 'container', undefined)
                                });
                            }}>
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
                        onClick={() => {
                            KaravanApi.manageContainer('dev', 'project', project.projectId, 'delete', res => {
                                setShowLog(false, 'container', undefined)
                            });
                        }}>
                </Button>
            </Tooltip>
        </FlexItem>
    </Flex>);
}