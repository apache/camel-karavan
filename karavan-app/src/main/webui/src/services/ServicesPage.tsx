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
import {Bullseye, Button, Content, EmptyState, EmptyStateVariant, Spinner, Toolbar, ToolbarContent, ToolbarItem,} from '@patternfly/react-core';
import '../designer/karavan.css';
import {SearchIcon, SyncAltIcon} from '@patternfly/react-icons';
import {InnerScrollContainer, OuterScrollContainer, Table, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {ServicesTableRow} from "./ServicesTableRow";
import {useStatusesStore} from "@/api/ProjectStore";
import {DOCKER_COMPOSE, ProjectType} from "@/api/ProjectModels";
import {KaravanApi} from "@/api/KaravanApi";
import {DockerCompose, DockerComposeService, ServicesYaml} from "@/api/ServiceModels";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@/api/ProjectService";
import {RightPanel} from "@/components/RightPanel";

export function ServicesPage() {

    const [services, setServices] = useState<DockerCompose>();
    const [containers] = useStatusesStore((state) => [state.containers, state.setContainers], shallow);
    const [loading] = useState<boolean>(false);

    useEffect(() => {
        getServices();
        const interval = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 1000)
        return () => clearInterval(interval);
    }, []);

    function getServices() {
        KaravanApi.getFiles(ProjectType.services.toString(), files => {
            const file = files.filter(f => f.name === DOCKER_COMPOSE).at(0);
            if (file) {
                const services: DockerCompose = ServicesYaml.yamlToServices(file.code);
                setServices(services);
            }
        })
    }

    function getTools() {
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Button variant="link" icon={<SyncAltIcon/>} onClick={e => getServices()}/>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }

    function title() {
        return <Content>
            <Content component="h2">Dev Services</Content>
        </Content>
    }

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        {loading &&
                            <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..."/>}
                        {!loading &&
                            <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No results found" variant={EmptyStateVariant.sm}>
                            </EmptyState>
                        }
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    function getContainer(name: string) {
        return containers.filter(c => c.containerName === name).at(0);
    }

    function getServicesTable() {
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table aria-label="Services" variant={"compact"} isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th/>
                                <Th key='name'>Name</Th>
                                <Th key='container_name'>Container Name</Th>
                                <Th key='image'>Image</Th>
                                <Th key='ports'>Ports</Th>
                                <Th key='state'>State</Th>
                                <Th key='action'></Th>
                            </Tr>
                        </Thead>
                        {services?.services.map((service: DockerComposeService, index: number) => (
                            <ServicesTableRow key={service.container_name} index={index} service={service} container={getContainer(service.container_name)}/>
                        ))}
                        {services?.services.length === 0 && getEmptyState()}
                    </Table>
                </InnerScrollContainer>
            </OuterScrollContainer>
        )
    }

    return (
        <RightPanel
            title={title()}
            tools={getTools()}
            mainPanel={
                <div className="right-panel-card">
                    {getServicesTable()}
                </div>
            }
        />
    )
}