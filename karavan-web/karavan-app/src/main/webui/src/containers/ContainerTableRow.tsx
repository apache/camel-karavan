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

import React, {useState} from 'react';
import {
    Button,
    Tooltip,
    Flex, FlexItem, Label, Badge, Spinner, Modal
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ExpandableRowContent, Tbody, Td, Tr} from "@patternfly/react-table";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import {ContainerStatus} from "../api/ProjectModels";
import PauseIcon from "@patternfly/react-icons/dist/esm/icons/pause-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {KaravanApi} from "../api/KaravanApi";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";

interface Props {
    index: number
    container: ContainerStatus
}

export function ContainerTableRow(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [command, setCommand] = useState<'run' | 'pause' | 'stop' | 'delete'>();

    const container = props.container;
    const commands = container.commands;
    const ports = container.ports;
    const isRunning = container.state === 'running';
    const inTransit = container.inTransit;
    const color = container.state === 'running' ? "green" : "grey";

    function getConfirmation() {
        return (<Modal
            className="modal-confirm"
            title="Confirmation"
            variant={"small"}
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (command) {
                        KaravanApi.manageContainer(container.projectId, container.type, container.containerName, command, false,res => {
                        });
                        setCommand(undefined);
                        setShowConfirmation(false);
                    }
                }}>Confirm
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => {
                            setCommand(undefined);
                            setShowConfirmation(false);
                        }}>Cancel</Button>
            ]}
            onEscapePress={e => setShowConfirmation(false)}>
            <div>{"Confirm " + command + " container " + container.containerName + " ?"}</div>
        </Modal>)
    }

    return (
        <Tbody isExpanded={isExpanded}>
            {showConfirmation && getConfirmation()}
            <Tr key={container.containerName}>
                <Td expand={
                    container.containerName
                        ? {
                            rowIndex: props.index,
                            isExpanded: isExpanded,
                            onToggle: () => setIsExpanded(!isExpanded),
                            expandId: 'composable-expandable-example'
                        }
                        : undefined}
                    modifier={"fitContent"}>
                </Td>
                <Td>
                    {container.env}
                </Td>
                <Td style={{verticalAlign: "middle"}} modifier={"fitContent"}>
                    <Badge className="badge">{container.type}</Badge>
                </Td>
                <Td>
                    <Label color={color}>{container.containerName}</Label>
                </Td>
                <Td>
                    {isRunning && container.cpuInfo && <Label color={color}>{container.cpuInfo}</Label>}
                </Td>
                <Td>
                    {isRunning && container.memoryInfo && <Label color={color}>{container.memoryInfo}</Label>}
                </Td>
                <Td>
                    {!inTransit && <Label color={color}>{container.state}</Label>}
                    {inTransit && <Spinner size="lg" aria-label="spinner"/>}
                </Td>
                <Td>
                    {container.type !== 'internal' && container.env === config.environment &&
                        <Flex direction={{default: "row"}} flexWrap={{default: "nowrap"}}
                              spaceItems={{default: 'spaceItemsNone'}}>
                            <FlexItem>
                                <Tooltip content={"Start container"} position={"bottom"}>
                                    <Button className="dev-action-button" variant={"plain"} icon={<PlayIcon/>}
                                            isDisabled={!commands.includes('run') || inTransit}
                                            onClick={e => {
                                                setCommand('run');
                                                setShowConfirmation(true);
                                            }}></Button>
                                </Tooltip>
                            </FlexItem>
                            <FlexItem>
                                <Tooltip content={"Pause container"} position={"bottom"}>
                                    <Button className="dev-action-button" variant={"plain"} icon={<PauseIcon/>}
                                            isDisabled={!commands.includes('pause') || inTransit}
                                            onClick={e => {
                                                setCommand('pause');
                                                setShowConfirmation(true);
                                            }}></Button>
                                </Tooltip>
                            </FlexItem>
                            <FlexItem>
                                <Tooltip content={"Stop container"} position={"bottom"}>
                                    <Button className="dev-action-button" variant={"plain"} icon={<StopIcon/>}
                                            isDisabled={!commands.includes('stop') || inTransit}
                                            onClick={e => {
                                                setCommand('stop');
                                                setShowConfirmation(true);
                                            }}></Button>
                                </Tooltip>
                            </FlexItem>
                            <FlexItem>
                                <Tooltip content={"Delete container"} position={"bottom"}>
                                    <Button className="dev-action-button" variant={"plain"} icon={<DeleteIcon/>}
                                            isDisabled={!commands.includes('delete') || inTransit}
                                            onClick={e => {
                                                setCommand('delete');
                                                setShowConfirmation(true);
                                            }}></Button>
                                </Tooltip>
                            </FlexItem>
                        </Flex>}
                </Td>
            </Tr>
            {<Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={1}>ID</Td>
                <Td colSpan={4}>
                    <ExpandableRowContent>
                        {container.containerId}
                    </ExpandableRowContent>
                </Td>
            </Tr>}
            {<Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={1}>Image</Td>
                <Td colSpan={4}>
                    <ExpandableRowContent>
                        {container.image}
                    </ExpandableRowContent>
                </Td>
            </Tr>}
            {ports !== undefined && ports.length > 0 && <Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={1}>Ports</Td>
                <Td colSpan={5}>
                    <ExpandableRowContent>
                        <Flex direction={{default: "row"}} cellPadding={"0px"}>
                            {ports.sort((a, b) => a.privatePort && b.privatePort && (a.privatePort > b.privatePort) ? 1 : -1)
                                .map((port, index) => {
                                const start = port.publicPort ? port.publicPort + "->" : "";
                                const end = port.privatePort + "/" + port.type;
                                return (
                                    <FlexItem key={index}>
                                        {start + end}
                                    </FlexItem>
                                )
                            })}
                        </Flex>
                    </ExpandableRowContent>
                </Td>
            </Tr>}
        </Tbody>
    )
}