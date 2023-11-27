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
    TextInput, ToggleGroup, ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    ToolbarItem, EmptyStateHeader
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ContainerStatus, ProjectType} from "../api/ProjectModels";
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
import {useAppConfigStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerTableRow} from "./ContainerTableRow";
import {ProjectService} from "../api/ProjectService";
import {KaravanApi} from "../api/KaravanApi";
import {DockerCompose, ServicesYaml} from "../api/ServiceModels";

export function ContainersPage () {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [containers] = useStatusesStore((state) => [state.containers, state.setContainers], shallow);
    const [filter, setFilter] = useState<string>('');
    const [loading] = useState<boolean>(true);
    const [selectedEnv, setSelectedEnv] = useState<string[]>([config.environment]);

    useEffect(() => {
        const interval = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 1000)
        return () => clearInterval(interval);
    }, []);

    function selectEnvironment(name: string, selected: boolean) {
        if (selected && !selectedEnv.includes(name)) {
            setSelectedEnv((state: string[]) => {
                state.push(name);
                return state;
            })
        } else if (!selected && selectedEnv.includes(name)) {
            setSelectedEnv((state: string[]) => {
                return state.filter(e => e !== name)
            })
        }
    }

    function tools() {
        return (<Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <ToggleGroup aria-label="Default with single selectable">
                        {config.environments.map(env => (
                            <ToggleGroupItem key={env} text={env} buttonId={env} isSelected={selectedEnv.includes(env)}
                                             onChange={(_, selected) => selectEnvironment(env, selected)}/>
                        ))}
                    </ToggleGroup>
                </ToolbarItem>
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

    function getSelectedEnvironments(): string [] {
        return config.environments.filter(e => selectedEnv.includes(e));
    }

    function getContainerByEnvironments(name: string): [string, ContainerStatus | undefined] [] {
        return selectedEnv.map(e => {
            const env: string = e as string;
            const container = containers.find(d => d.containerName === name && d.env === env);
            return [env, container];
        });
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

    const conts = containers.filter(d => d.containerName.toLowerCase().includes(filter));
    return (
        <PageSection className="kamelet-section" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={tools()}/>
            </PageSection>
            <PageSection isFilled className="kamelets-page">
                <Table aria-label="Projects" variant={TableVariant.compact}>
                    <Thead>
                        <Tr>
                            <Th />
                            <Th key='type'>Type</Th>
                            <Th key='name'>Name</Th>
                            <Th key='image'>Image</Th>
                            <Th key='cpuInfo'>CPU</Th>
                            <Th key='memoryInfo'>Memory</Th>
                            <Th key='state'>State</Th>
                            <Th  key='action'></Th>
                        </Tr>
                    </Thead>
                    {conts?.map((container: ContainerStatus, index: number) => (
                        <ContainerTableRow key={container.containerName} index={index} container={container}/>
                    ))}
                    {conts?.length === 0 && getEmptyState()}
                </Table>
            </PageSection>
        </PageSection>
    )

}