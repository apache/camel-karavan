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
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    PageSection,
    TextContent,
    Text,
    Button,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Spinner, EmptyStateHeader
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {
	Td,
	Th,
	Thead,
	Tr
} from '@patternfly/react-table';
import {
	Table
} from '@patternfly/react-table/deprecated';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {ServicesTableRow} from "./ServicesTableRow";
import {DeleteServiceModal} from "./DeleteServiceModal";
import {CreateServiceModal} from "./CreateServiceModal";
import {useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {Project, ProjectType} from "../api/ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import {DockerComposeService, DockerCompose, ServicesYaml} from "../api/ServiceModels";
import {shallow} from "zustand/shallow";
import {ProjectLogPanel} from "../project/log/ProjectLogPanel";
import {ProjectService} from "../api/ProjectService";


export function ServicesPage () {

    const [services, setServices] = useState<DockerCompose>();
    const [containers] = useStatusesStore((state) => [state.containers, state.setContainers], shallow);
    const [operation] = useState<'create' | 'delete' | 'none'>('none');
    const [loading] = useState<boolean>(false);

    useEffect(() => {
        getServices();
        const interval = setInterval(() => {
            ProjectService.refreshAllContainerStatuses();
        }, 1000)
        return () => clearInterval(interval);
    }, []);

    function getServices() {
        KaravanApi.getFiles(ProjectType.services, files => {
            const file = files.at(0);
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
                    <Button variant="link" icon={<RefreshIcon/>} onClick={e => getServices()}/>
                </ToolbarItem>
                <ToolbarItem>
                    <Button className="dev-action-button" icon={<PlusIcon/>}
                            onClick={e =>
                                useProjectStore.setState({operation: "create", project: new Project()})}
                    >Create</Button>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }

    function title() {
        return <TextContent>
            <Text component="h2">Dev Services</Text>
        </TextContent>
    }

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        {loading &&
                            <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..."/>}
                        {!loading &&
                            <EmptyState variant={EmptyStateVariant.sm}>
                                <EmptyStateHeader titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2" />
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
            <Table aria-label="Services" variant={"compact"}>
                <Thead>
                    <Tr>
                        <Th />
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
        )
    }

    return (
        <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={getTools()}/>
            </PageSection>
            <PageSection isFilled className="kamelets-page">
                {getServicesTable()}
            </PageSection>
            {["create"].includes(operation) && <CreateServiceModal/>}
            {["delete"].includes(operation) && <DeleteServiceModal/>}
            <ProjectLogPanel/>
        </PageSection>
    )
}