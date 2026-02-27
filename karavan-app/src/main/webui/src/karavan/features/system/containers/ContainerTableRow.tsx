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
import {Badge, Button, CodeBlock, CodeBlockCode, Content, Flex, FlexItem, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Tooltip} from '@patternfly/react-core';
import '@features/project/designer/karavan.css';
import {Tbody, Td, Tr} from "@patternfly/react-table";
import {PauseIcon, PlayIcon, StopIcon, TimesIcon} from '@patternfly/react-icons';
import {ContainerStatus} from "@models/ProjectModels";
import {KaravanApi} from "@api/KaravanApi";
import {useAppConfigStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerButton} from "@shared/ui/ContainerButton";

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
    const color = isRunning ? "green" : "grey";
    const isKubernetes = config.infrastructure === 'kubernetes'
    const swarmMode = config.swarmMode
    const commandType = swarmMode ? 'service' : 'container'

    function getConfirmation() {
        return (<Modal
            variant={"small"}
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onEscapePress={e => setShowConfirmation(false)}>
            <ModalHeader>
                <Content component={'h2'}>Confirmation</Content>
            </ModalHeader>
            <ModalBody>
                <div>{`Confirm ${command} ${commandType} ${container.containerName}?`}</div>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant={command !== 'run' ? "danger" : 'primary'} isDanger onClick={e => {
                    if (command) {
                        KaravanApi.manageContainer(container.projectId, container.type, container.containerName, command, "never", res => {
                        });
                        setCommand(undefined);
                        setShowConfirmation(false);
                    }
                }}>Confirm
                </Button>
                <Button key="cancel" variant="link"
                        onClick={e => {
                            setCommand(undefined);
                            setShowConfirmation(false);
                        }}>Cancel</Button>
            </ModalFooter>
        </Modal>)
    }

    const isDevMode = container.type == 'devmode'
    const isBuild = container.type == 'build'

    return (
        <Tbody isExpanded={isExpanded}>
            {showConfirmation && getConfirmation()}
            <Tr key={container.containerName} style={{verticalAlign: "middle"}}>
                <Td expand={
                    container.containerName
                        ? {
                            rowIndex: props.index,
                            isExpanded: isExpanded,
                            onToggle: () => setIsExpanded(!isExpanded),
                            expandId: 'composable-expandable-example'
                        }
                        : undefined}
                    modifier={"fitContent"} className={'dev-action-button'}>
                </Td>
                <Td style={{verticalAlign: "middle"}} modifier={"fitContent"}>
                    <Badge className="badge">{container.type}</Badge>
                </Td>
                {isKubernetes &&
                    <Td style={{verticalAlign: "middle"}} modifier={"fitContent"}>
                        {!isDevMode && !isBuild && <Label color={color}>{container.projectId}</Label>}
                    </Td>
                }
                {swarmMode &&
                    <Td style={{verticalAlign: "middle"}} modifier={"fitContent"}>
                        {!isBuild && <Label color={color}>{container.projectId}</Label>}
                    </Td>
                }
                <Td>
                    <ContainerButton container={container}/>
                </Td>
                <Td modifier={'breakWord'}>
                    {container.image}
                </Td>
                <Td>
                    <div style={{display: "flex", flexDirection: "column"}}>
                        {ports !== undefined && ports?.length > 0 && ports.sort((a, b) => a.privatePort && b.privatePort && (a.privatePort > b.privatePort) ? 1 : -1)
                            .map((port, index) => {
                                const start = port.publicPort ? port.publicPort + "->" : "";
                                const end = port.privatePort + "/" + port.type;
                                return (
                                    <div key={index} style={{textWrap: 'nowrap'}}>
                                        {start + end}
                                    </div>
                                )
                            })}
                    </div>
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
                            {!swarmMode &&
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
                            }
                            {!swarmMode &&
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
                            }
                            <FlexItem>
                                <Tooltip content={"Delete container"} position={"bottom"}>
                                    <Button className="dev-action-button" variant={"plain"} icon={<TimesIcon/>}
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
            <Tr isExpanded={isExpanded} style={{verticalAlign: "middle"}}>
                <Td/>
                <Td colSpan={9} style={{padding: 8}}>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Content style={{fontWeight: 'bold'}}>ID</Content>
                        <Content>{container.containerId}</Content>
                    </div>
                </Td>
            </Tr>
            <Tr isExpanded={isExpanded} className='fields-data'>
                <Td/>
                <Td colSpan={9} modifier={"fitContent"} style={{padding: 0}}>
                    <CodeBlock style={{borderRadius: 0}}>
                        <CodeBlockCode id="code-content">{JSON.stringify(container, null, 2)}</CodeBlockCode>
                    </CodeBlock>
                </Td>
            </Tr>
        </Tbody>
    )
}