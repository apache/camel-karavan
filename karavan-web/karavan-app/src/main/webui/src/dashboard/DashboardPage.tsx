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
    Badge, Bullseye,
    Button, EmptyState, EmptyStateIcon, EmptyStateVariant,
    Flex,
    FlexItem, HelperText, HelperTextItem, Label, LabelGroup,
    PageSection, Spinner,
    Text,
    TextContent,
    TextInput, ToggleGroup, ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    ToolbarItem, Tooltip, EmptyStateHeader
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {
    CamelStatus,
    CamelStatusValue,
    ContainerStatus,
    DeploymentStatus,
    Project,
    ServiceStatus
} from "../api/ProjectModels";
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
import {camelIcon, CamelUi} from "../designer/utils/CamelUi";
import Icon from "../Logo";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {MainToolbar} from "../designer/MainToolbar";
import {useAppConfigStore, useProjectsStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";

export function DashboardPage () {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [projects, setProjects] = useProjectsStore((state) => [state.projects, state.setProjects], shallow)
    const [deployments, services, containers, camels, setDeployments, setServices, setContainers, setCamels]
        = useStatusesStore((state) => [state.deployments, state.services, state.containers, state.camels,
        state.setDeployments, state.setServices, state.setContainers, state.setCamels], shallow);
    const [filter, setFilter] = useState<string>('');
    const [selectedEnv, setSelectedEnv] = useState<string[]>([config.environment]);

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
                {/*<ToolbarItem>*/}
                {/*    <Button variant="link" icon={<RefreshIcon/>} onClick={e => onGetProjects()}/>*/}
                {/*</ToolbarItem>*/}
                <ToolbarItem>
                    <ToggleGroup aria-label="Default with single selectable">
                        {config.environments.map(env => (
                            <ToggleGroupItem key={env} text={env} buttonId={env} isSelected={selectedEnv.includes(env)}
                                             onChange={(_, selected)  => selectEnvironment(env, selected)}/>
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
            <Text component="h2">Dashboard</Text>
        </TextContent>);
    }

    function getSelectedEnvironments(): string [] {
        return config.environments.filter(e => selectedEnv.includes(e));
    }

    function getDeploymentEnvironments(name: string): [string, boolean] [] {
        return selectedEnv.map(e => {
            const env: string = e as string;
            const dep = deployments.find(d => d.projectId === name && d.env === env);
            const deployed: boolean = dep !== undefined && dep.replicas > 0 && dep.replicas === dep.readyReplicas;
            return [env, deployed];
        });
    }

    function getDeploymentByEnvironments(name: string): [string, DeploymentStatus | undefined] [] {
        return selectedEnv.map(e => {
            const env: string = e as string;
            const dep = deployments.find(d => d.projectId === name && d.env === env);
            return [env, dep];
        });
    }

    function getServiceByEnvironments(name: string): [string, ServiceStatus | undefined] [] {
        return selectedEnv.map(e => {
            const env: string = e as string;
            const service = services.find(d => d.name === name && d.env === env);
            return [env, service];
        });
    }

    function getContainerByEnvironments(name: string): [string, ContainerStatus | undefined] [] {
        return selectedEnv.map(e => {
            const env: string = e as string;
            const container = containers.find(d => d.containerName === name && d.env === env);
            return [env, container];
        });
    }

    function getCamelStatusByEnvironments(containerName: string): [string, CamelStatusValue | undefined] [] {
        console.log(camels)
        console.log(selectedEnv)
        const result =  selectedEnv.map(e => {
            const env: string = e as string;
            const status = camels?.find(d => d.containerName === containerName && d.env === env);
            const statusValue = status ? status.statuses[0] : undefined;
            return {env, statusValue};
        });
        console.log(result)
        return [];
    }

    function getProject(name: string): Project | undefined {
        return projects.filter(p => p.projectId === name)?.at(0);
    }

    function isKaravan(name: string): boolean {
        return projects.findIndex(p => p.projectId === name) > -1;
    }

    function getReplicasPanel(deploymentStatus?: DeploymentStatus) {
        if (deploymentStatus) {
            const readyReplicas = deploymentStatus.readyReplicas ? deploymentStatus.readyReplicas : 0;
            const ok = (deploymentStatus && readyReplicas > 0
                && (deploymentStatus.unavailableReplicas === 0 || deploymentStatus.unavailableReplicas === undefined || deploymentStatus.unavailableReplicas === null)
                && deploymentStatus?.replicas === readyReplicas);
            return (
                <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                    <FlexItem>
                        <LabelGroup numLabels={3}>
                            <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                                <Label className="table-label" icon={ok ? <UpIcon/> : <DownIcon/>}
                                       color={ok ? "green" : "grey"}>{"Replicas: " + readyReplicas + " / " + deploymentStatus.replicas}</Label>
                            </Tooltip>
                            {deploymentStatus.unavailableReplicas > 0 &&
                                <Tooltip content={"Unavailable replicas"} position={"right"}>
                                    <Label icon={<DownIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                                </Tooltip>
                            }
                        </LabelGroup>
                    </FlexItem>
                </Flex>
            )
        } else {
            return (
                <Tooltip content={"No information"} position={"right"}>
                    <Label color={"grey"}>???</Label>
                </Tooltip>
            );
        }
    }

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        <EmptyState variant={EmptyStateVariant.sm}>
                            <EmptyStateHeader titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2" />
                        </EmptyState>
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    function getKubernetesTable() {
        const deps = Array.from(new Set(deployments
            .filter(d => d?.projectId?.toLowerCase().includes(filter))
            .map(d => d.projectId)));
        return (
            <Table aria-label="Projects" variant={TableVariant.compact}>
                <Thead>
                    <Tr>
                        <Th key='type'>Type</Th>
                        <Th key='name'>Deployment</Th>
                        <Th key='description'>Project/Description</Th>
                        <Th key='environment'>Environment</Th>
                        <Th key='namespace'>Namespace</Th>
                        <Th key='replicas'>Replicas</Th>
                        <Th key='services'>Services</Th>
                        <Th key='camel'>Camel Health</Th>
                        {/*<Th key='action'></Th>*/}
                    </Tr>
                </Thead>
                <Tbody>
                    {deps.map(deployment => (
                        <Tr key={deployment}>
                            <Td style={{verticalAlign: "middle"}}>
                                {isKaravan(deployment) ? Icon("icon") : CamelUi.getIconFromSource(camelIcon)}
                            </Td>
                            <Td style={{verticalAlign: "middle"}}>
                                <Button style={{padding: '6px'}} variant={"link"}>{deployment}</Button>
                            </Td>
                            <Td style={{verticalAlign: "middle"}}>
                                <HelperText>
                                    <HelperTextItem>{getProject(deployment)?.name || ""}</HelperTextItem>
                                    <HelperTextItem>{getProject(deployment)?.description || "Camel project"}</HelperTextItem>
                                </HelperText>
                            </Td>
                            <Td>
                                <Flex direction={{default: "column"}}>
                                    {getDeploymentEnvironments(deployment).map(value => (
                                        <FlexItem className="badge-flex-item" key={value[0]}><Badge className="badge"
                                                                                                    isRead={!value[1]}>{value[0]}</Badge></FlexItem>
                                    ))}
                                </Flex>
                            </Td>
                            <Td>
                                <Flex direction={{default: "column"}}>
                                    {getServiceByEnvironments(deployment).map(value => (
                                        <FlexItem className="badge-flex-item" key={value[0]}>
                                            <Label variant={"outline"}>
                                                {value[1] ? (value[1]?.port + " -> " + value[1]?.targetPort) : "???"}
                                            </Label>
                                        </FlexItem>
                                    ))}
                                </Flex>
                            </Td>
                            <Td modifier={"fitContent"}>
                                <Flex direction={{default: "column"}}>
                                    {getCamelStatusByEnvironments(deployment).map(value => {
                                        // const color = value[1] ? (value[1].consumerStatus === "UP" ? "green" : "red") : "grey";
                                        // let icon = undefined;
                                        // if (value[1]?.consumerStatus === "UP") icon = <UpIcon/>
                                        // if (value[1]?.consumerStatus === "DOWN") icon = <DownIcon/>
                                        // const text = value[1] && value[1]?.contextVersion ? value[1]?.contextVersion : "???";
                                        return <FlexItem key={value[0]}>
                                            {/*<LabelGroup numLabels={4} className="camel-label-group">*/}
                                            {/*    <Label color={color} className="table-label" icon={icon}>{text}</Label>*/}
                                            {/*</LabelGroup>*/}
                                        </FlexItem>
                                    })}
                                </Flex>
                            </Td>
                        </Tr>
                    ))}
                    {deps.length === 0 && getEmptyState()}
                </Tbody>
            </Table>
        )
    }

    function getDockerTable() {
        const conts = containers
            .filter(c => ['devmode', 'project'].includes(c.type))
            .filter(d => d.containerName.toLowerCase().includes(filter));
        return (
            <Table aria-label="Projects" variant={TableVariant.compact}>
                <Thead>
                    <Tr>
                        <Th key='container' width={20}>Container</Th>
                        <Th key='description' width={30} isStickyColumn >Project Description</Th>
                        {/*{config.environments.map((e, i) =>*/}
                        {['dev', 'test', 'prod'].map((e, i) =>
                            <Th key={e} textCenter hasLeftBorder width={10} >{e}</Th>
                        )}
                    </Tr>
                </Thead>
                <Tbody>
                    {conts.map(container => (
                        <Tr key={container.containerName}>
                            <Td style={{verticalAlign: "middle"}}>
                                <Label color={container.state === 'running' ? "green" : 'grey'}>
                                    {container.containerName}
                                    <Badge isRead>{container.type}</Badge>
                                </Label>
                            </Td>
                            <Td isStickyColumn style={{verticalAlign: "middle"}}>
                                <HelperText>
                                    <HelperTextItem>{getProject(container.containerName)?.description || "Camel project"}</HelperTextItem>
                                </HelperText>
                            </Td>
                            {/*<Td>*/}
                            {/*    <Flex direction={{default: "column"}}>*/}
                            {/*        {container.ports.map(port => (*/}
                            {/*            <FlexItem className="badge-flex-item" key={port}>*/}
                            {/*                <Badge className="badge" isRead={true}>{port}</Badge>*/}
                            {/*            </FlexItem>*/}
                            {/*        ))}*/}
                            {/*    </Flex>*/}
                            {/*</Td>*/}
                            <Td hasLeftBorder>
                                <Flex direction={{default: "column"}} style={{verticalAlign: "middle"}}>
                                    {getContainerByEnvironments(container.containerName).map(value => (
                                        <FlexItem className="badge-flex-item" key={value[0]}>
                                            <Label color={"green"}>
                                                {value[1] ? value[1]?.env : ""}
                                                <Label color={"green"}>
                                                    {value[1] ? value[1]?.env : ""}
                                                </Label>
                                            </Label>
                                        </FlexItem>
                                    ))}
                                </Flex>
                            </Td>
                            {/*<Td modifier={"fitContent"}>*/}
                            {/*    <Flex direction={{default: "column"}}>*/}
                            {/*        {getCamelStatusByEnvironments(container.containerName).map(value => {*/}
                            {/*            // const color = value[1] ? (value[1].consumerStatus === "UP" ? "green" : "red") : "grey";*/}
                            {/*            // let icon = undefined;*/}
                            {/*            // if (value[1]?.consumerStatus === "UP") icon = <UpIcon/>*/}
                            {/*            // if (value[1]?.consumerStatus === "DOWN") icon = <DownIcon/>*/}
                            {/*            // const text = value[1] && value[1]?.contextVersion ? value[1]?.contextVersion : "???";*/}
                            {/*            return <FlexItem key={value[0]}>*/}
                            {/*                /!*<LabelGroup numLabels={4} className="camel-label-group">*!/*/}
                            {/*                /!*    <Label color={color} className="table-label" icon={icon}>{text}</Label>*!/*/}
                            {/*                /!*</LabelGroup>*!/*/}
                            {/*            </FlexItem>*/}
                            {/*        })}*/}
                            {/*    </Flex>*/}
                            {/*</Td>*/}
                        </Tr>
                    ))}
                    {conts.length === 0 && getEmptyState()}
                </Tbody>
            </Table>
        )
    }

    const isKubernetes = config.infrastructure === 'kubernetes';
    return (
        <PageSection className="kamelet-section dashboard-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={tools()}/>
            </PageSection>
            <PageSection isFilled className="kamelets-page">
                {isKubernetes ? getKubernetesTable() : getDockerTable()}
            </PageSection>
        </PageSection>
    )

}