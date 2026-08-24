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

import React from 'react';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {useKubernetesStore} from "@stores/useKubernetesStore";
import {BuildIcon, CogIcon, ExclamationTriangleIcon, RunningIcon} from "@patternfly/react-icons";
import {Content, ToggleGroup, ToggleGroupItem} from "@patternfly/react-core";
import {ProjectContainersContext} from "@page-project/ProjectContainersContextProvider";
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {ContainerStatus} from "@models/ProjectModels";

export function PodEventsLogTable() {

    const podEvents = useKubernetesStore((s) => s.podEvents);
    const context = React.useContext(ProjectContainersContext);
    const selectedContainerName = useSelectedContainerStore((s) => s.selectedContainerName);
    const setSelectedContainerName = useSelectedContainerStore((s) => s.setSelectedContainerName);

    function getIcon(status: ContainerStatus) {
        if (status.type === "devmode") {
            const className = status.state === "running" ? 'project-container-devmode' : ''
            return <CogIcon className={className}/>
        } else if (status.type === "packaged") {
            const className = status.state === "running" ? 'project-container-package' : ''
            return <RunningIcon className={className}/>
        } else if (status.type === "build") {
            const className = status.state === "running" ? 'project-container-build' : ''
            return <BuildIcon className={className}/>
        }
    }
    return (
        <>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "16px"}}>
                <Content component='h6' style={{padding: '16px'}}>Pod Events</Content>
                <ToggleGroup aria-label="Default with single selectable">
                    {context?.containerStatuses.map(status => (
                        <ToggleGroupItem
                            key={status.containerName}
                            icon={getIcon(status)}
                            text={status.containerName}
                            buttonId={status.containerName}
                            isSelected={selectedContainerName === status.containerName}
                            onChange={_ => setSelectedContainerName(status.containerName)}
                        />
                    ))}
                </ToggleGroup>
            </div>
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table aria-label="Simple table" variant='compact' isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th screenReaderText="pass"/>
                                <Th>Name</Th>
                                <Th>Reason</Th>
                                <Th>Note</Th>
                                <Th>Count</Th>
                                <Th>Last Seen</Th>
                            </Tr>
                        </Thead>
                        <Tbody className='event-table'>
                            {podEvents.map((podEvent) => {
                                const type = podEvent.type === 'Warning'
                                    ? <ExclamationTriangleIcon color={"var(--pf-t--global--icon--color--status--warning--default)"}/>
                                    : undefined;
                                return (
                                    <Tr key={podEvent.id} style={{verticalAlign: "middle"}}>
                                        <Td>{type}</Td>
                                        <Td>{podEvent.id}</Td>
                                        <Td>{podEvent.reason}</Td>
                                        <Td>{podEvent.note}</Td>
                                        <Td style={{textAlign: "right"}}>{podEvent.count}</Td>
                                        <Td modifier={"nowrap"}>{podEvent.lastTimestamp}</Td>
                                    </Tr>
                                )
                            })}
                        </Tbody>
                    </Table>
                </InnerScrollContainer>
            </OuterScrollContainer>
        </>
    );
}
