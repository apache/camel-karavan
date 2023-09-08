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
            <Button style={{visibility:"hidden"}} size="sm" variant={"control"} icon={<DeleteIcon/>} onClick={() => {}}>
            </Button>
        </FlexItem>
        {containerStatus?.containerId && <FlexItem>
            <Label icon={icon} color={color}>
                <Tooltip content={"Show log"} position={TooltipPosition.bottom}>
                    <Button className='labeled-button' variant="link" isDisabled={!isRunning}
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