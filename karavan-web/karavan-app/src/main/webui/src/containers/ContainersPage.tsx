import React, {useEffect, useState} from 'react';
import {
    Badge, Bullseye,
    Button, EmptyState, EmptyStateIcon, EmptyStateVariant,
    Flex,
    FlexItem, HelperText, HelperTextItem, Label, LabelGroup,
    PageSection, Spinner,
    Text,
    TextContent,
    TextInput, Title, ToggleGroup, ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    ToolbarItem, Tooltip
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {CamelStatus, ContainerStatus, DeploymentStatus, Project, ServiceStatus} from "../api/ProjectModels";
import {TableComposable, TableVariant, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {camelIcon, CamelUi} from "../designer/utils/CamelUi";
import {KaravanApi} from "../api/KaravanApi";
import Icon from "../Logo";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {MainToolbar} from "../designer/MainToolbar";
import {useAppConfigStore, useProjectsStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {Service} from "../api/ServiceModels";
import {ServicesTableRow} from "../services/ServicesTableRow";
import {ContainerTableRow} from "./ContainerTableRow";

export const ContainersPage = () => {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [containers, setContainers] = useStatusesStore((state) => [state.containers, state.setContainers], shallow);
    const [filter, setFilter] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedEnv, setSelectedEnv] = useState<string[]>([config.environment]);

    useEffect(() => {
        const interval = setInterval(() => {
            onGetProjects()
        }, 2000);
        return () => {
            clearInterval(interval)
        };
    }, []);

    function onGetProjects() {
        KaravanApi.getConfiguration((config: any) => {
            KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
                setContainers(statuses);
                setLoading(false);
            });
        });
    }

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
                    <Button variant="link" icon={<RefreshIcon/>} onClick={e => onGetProjects()}/>
                </ToolbarItem>
                <ToolbarItem>
                    <ToggleGroup aria-label="Default with single selectable">
                        {config.environments.map(env => (
                            <ToggleGroupItem key={env} text={env} buttonId={env} isSelected={selectedEnv.includes(env)} onChange={selected => selectEnvironment(env, selected)}/>
                        ))}
                    </ToggleGroup>
                </ToolbarItem>
                <ToolbarItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               autoComplete="off" placeholder="Search by name"
                               value={filter}
                               onChange={e => setFilter(e)}/>
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
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        {loading && <Spinner className="progress-stepper" isSVG diameter="80px" aria-label="Loading..."/>}
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

    const conts = containers.filter(d => d.containerName.toLowerCase().includes(filter));
    return (
        <PageSection className="kamelet-section dashboard-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={tools()}/>
            </PageSection>
            <PageSection isFilled className="kamelets-page">
                <TableComposable aria-label="Projects" variant={TableVariant.compact}>
                    <Thead>
                        <Tr>
                            <Th />
                            <Th key='type'>Type</Th>
                            <Th key='name'>Name</Th>
                            <Th key='image'>Image</Th>
                            <Th key='cpuInfo'>CPU</Th>
                            <Th key='memoryInfo'>Memory</Th>
                            <Th key='action'></Th>
                        </Tr>
                    </Thead>
                    {conts?.map((container: ContainerStatus, index: number) => (
                        <ContainerTableRow key={container.containerName} index={index} container={container}/>
                    ))}
                    {conts?.length === 0 && getEmptyState()}
                </TableComposable>
            </PageSection>
        </PageSection>
    )

}