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
    Title, Spinner
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {TableComposable, Td, Th, Thead, Tr} from "@patternfly/react-table";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {ServicesTableRow} from "./ServicesTableRow";
import {DeleteServiceModal} from "./DeleteServiceModal";
import {CreateServiceModal} from "./CreateServiceModal";
import {useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {MainToolbar} from "../designer/MainToolbar";
import {Project, ProjectType} from "../api/ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import {DevService, Services, ServicesYaml} from "../api/ServiceModels";
import {shallow} from "zustand/shallow";
import {ProjectLogPanel} from "../project/log/ProjectLogPanel";


export const ServicesPage = () => {

    const [services, setServices] = useState<Services>();
    const [containers] = useStatusesStore((state) => [state.containers, state.setContainers], shallow);
    const [operation] = useState<'create' | 'delete' | 'none'>('none');
    const [loading] = useState<boolean>(false);

    useEffect(() => {
        getServices();
    }, []);

    function getServices() {
        KaravanApi.getFiles(ProjectType.services, files => {
            const file = files.at(0);
            if (file) {
                const services: Services = ServicesYaml.yamlToServices(file.code);
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
                    <Button icon={<PlusIcon/>}
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
                            <Spinner className="progress-stepper" isSVG diameter="80px" aria-label="Loading..."/>}
                        {!loading &&
                            <EmptyState variant={EmptyStateVariant.small}>
                                <EmptyStateIcon icon={SearchIcon}/>
                                <Title headingLevel="h2" size="lg">
                                    No results found
                                </Title>
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
            <TableComposable aria-label="Services" variant={"compact"}>
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
                {services?.services.map((service: DevService, index: number) => (
                    <ServicesTableRow key={service.container_name} index={index} service={service} container={getContainer(service.container_name)}/>
                ))}
                {services?.services.length === 0 && getEmptyState()}
            </TableComposable>
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