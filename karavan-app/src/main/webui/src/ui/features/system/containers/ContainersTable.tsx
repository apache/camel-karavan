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

import React, {useEffect, useState} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant, Spinner,} from '@patternfly/react-core';
import '@features/project/designer/karavan.css';
import './ContainerPage.css';
import {ContainerStatus} from "@models/ProjectModels";
import {InnerScrollContainer, OuterScrollContainer, Table, TableVariant, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {useAppConfigStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerTableRow} from "./ContainerTableRow";
import {ProjectService} from "@services/ProjectService";
import {useSystemStore} from "@stores/SystemStore";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

export function ContainersTable() {

    const [config] = useAppConfigStore((state) => [state.config], shallow);
    const {containers} = useContainerStatusesStore();
    const [filter, setFilter] = useSystemStore((s) => [s.filter, s.setFilter], shallow);
    const [loading] = useState<boolean>(true);
    const isKubernetes = config.infrastructure === 'kubernetes'
    const swarmMode = config.swarmMode

    useEffect(() => {
        const interval = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 1000)
        return () => clearInterval(interval);
    }, []);

    function getEmptyState() {
        return (
            <Tbody>
                <Tr>
                    <Td colSpan={8}>
                        <Bullseye>
                            {loading && <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..."/>}
                            {!loading &&
                                <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No results found" variant={EmptyStateVariant.sm}>
                                </EmptyState>
                            }
                        </Bullseye>
                    </Td>
                </Tr>
            </Tbody>
        )
    }

    const conts = containers.filter(d => d.containerName.toLowerCase().includes(filter));
    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="Projects" variant={TableVariant.compact} isStickyHeader>
                    <Thead>
                        <Tr>
                            <Th modifier="fitContent" textCenter={true} screenReaderText={'pass'}/>
                            <Th modifier="fitContent" textCenter={true} key='type'>Type</Th>
                            {isKubernetes &&
                                <Th key='deployment' modifier="fitContent">Deployment</Th>
                            }
                            {swarmMode &&
                                <Th key='service' modifier="fitContent">Service</Th>
                            }
                            <Th key='container'>Container</Th>
                            <Th textCenter={true} key='image'>Image</Th>
                            <Th modifier="fitContent" textCenter={true} key='ports'>Ports</Th>
                            <Th modifier="fitContent" textCenter={true} key='cpuInfo'>CPU</Th>
                            <Th modifier="fitContent" textCenter={true} key='memoryInfo'>Memory</Th>
                            <Th modifier="fitContent" textCenter={true} key='state'>State</Th>
                            <Th modifier="fitContent" textCenter={true} key='action'>Actions</Th>
                        </Tr>
                    </Thead>
                    {conts?.map((container: ContainerStatus, index: number) => (
                        <ContainerTableRow key={`${container.containerName}-${container.env}`} index={index} container={container}/>
                    ))}
                    {conts?.length === 0 && getEmptyState()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}