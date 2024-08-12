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
import {
    Bullseye,
    EmptyState, EmptyStateIcon, EmptyStateVariant,
    PageSection, Spinner,
    Text,
    TextContent,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarItem, EmptyStateHeader
} from '@patternfly/react-core';
import '../designer/karavan.css';
import './ContainerPage.css';
import {ContainerStatus} from "../api/ProjectModels";
import {
	TableVariant,
	Tbody,
	Td,
	Th,
	Thead,
	Tr
} from '@patternfly/react-table';
import {
	Table
} from '@patternfly/react-table/deprecated';
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {MainToolbar} from "../designer/MainToolbar";
import {useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerTableRow} from "./ContainerTableRow";
import {ProjectService} from "../api/ProjectService";

export function ContainersPage () {

    const [containers] = useStatusesStore((state) => [state.containers, state.setContainers], shallow);
    const [filter, setFilter] = useState<string>('');
    const [loading] = useState<boolean>(true);

    useEffect(() => {
        const interval = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 1000)
        return () => clearInterval(interval);
    }, []);

    function tools() {
        return (<Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               autoComplete="off" placeholder="Search by name"
                               value={filter}
                               onChange={(_, e) => setFilter(e)}/>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>);
    }

    function title() {
        return (<TextContent>
            <Text component="h2">Containers</Text>
        </TextContent>);
    }

    function getEmptyState() {
        return (
            <Tbody>
                <Tr>
                    <Td colSpan={8}>
                        <Bullseye>
                            {loading && <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..."/>}
                            {!loading &&
                                <EmptyState variant={EmptyStateVariant.sm}>
                                    <EmptyStateHeader titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2" />
                                </EmptyState>
                            }
                        </Bullseye>
                    </Td>
                </Tr>
            </Tbody>
        )
    }

    const conts = containers
        .filter(d => d.containerName.toLowerCase().includes(filter));
    return (
        <PageSection className="container-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={tools()}/>
            </PageSection>
            <PageSection isFilled className="container-page-section">
                <Table aria-label="Projects" variant={TableVariant.compact}>
                    <Thead>
                        <Tr>
                            <Th modifier="fitContent" textCenter={true} />
                            <Th modifier="fitContent" textCenter={true} key='env'>Env</Th>
                            <Th modifier="fitContent" textCenter={true} key='type'>Type</Th>
                            <Th  key='name'>Name</Th>
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
            </PageSection>
        </PageSection>
    )

}