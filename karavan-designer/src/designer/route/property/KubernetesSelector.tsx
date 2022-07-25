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
import {
    Badge,
    Button, Flex, FlexItem,
    Form, FormGroup, Modal, PageSection,
    Tab, Tabs, TabTitleText, TextInput,
} from '@patternfly/react-core';
import '../../karavan.css';
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {KubernetesAPI} from "../../utils/KubernetesAPI";
import {CamelUi} from "../../utils/CamelUi";
import {CamelUtil} from "../../../../../../../../karavan-core/lib/api/CamelUtil";

interface Props {
    onSelect: (value: string) => void,
    onClose?: () => void,
    isOpen: boolean,
    dark: boolean,
}

interface State {
    tabIndex: string | number
    filter?: string
    configMaps:  string[]
    secrets:  string[]
    services:  string[]
}

export class KubernetesSelector extends React.Component<Props, State> {

    public state: State = {
        tabIndex: "configMap",
        configMaps: KubernetesAPI.configMaps,
        secrets: KubernetesAPI.secrets,
        services: KubernetesAPI.services
    };

    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        this.setState({tabIndex: eventKey})
    }

    checkFilter = (name: string): boolean => {
        if (this.state.filter !== undefined && name) {
            return name.toLowerCase().includes(this.state.filter.toLowerCase())
        } else {
            return true;
        }
    }

    searchInput = () => {
        return (
            <Form isHorizontal className="search" autoComplete="off">
                <FormGroup fieldId="search">
                    <TextInput className="text-field" type="text" id="search" name="search" iconVariant='search'
                               value={this.state.filter}
                               onChange={e => this.setState({filter: e})}/>
                </FormGroup>
            </Form>
        )
    }

    getConfigMapTable() {
        const configMaps = this.state.configMaps;
        return (
            <TableComposable variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        <Th key='data'>Data</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {configMaps
                        .filter(name => this.checkFilter(name))
                        .map((name, idx: number) => {
                            const configMapName = name.split("/")[0];
                            const data = name.split("/")[1];
                            return (
                                <Tr key={name}>
                                    <Td noPadding isActionCell>
                                        <Badge>CM</Badge>
                                    </Td>
                                    <Td noPadding>
                                        {configMapName}
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => this.props.onSelect?.call(this, "configmap:" + name)}>
                                            {data}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </TableComposable>
        )
    }

    getSecretsTable() {
        const secrets = this.state.secrets;
        return (
            <TableComposable variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        <Th key='data'>Data</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {secrets
                        .filter(name => this.checkFilter(name))
                        .map((name, idx: number) => {
                            const configMapName = name.split("/")[0];
                            const data = name.split("/")[1];
                            return (
                                <Tr key={name}>
                                    <Td noPadding isActionCell>
                                        <Badge>S</Badge>
                                    </Td>
                                    <Td noPadding>
                                        {configMapName}
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => this.props.onSelect?.call(this, "secret:" + name)}>
                                            {data}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </TableComposable>
        )
    }

    getServicesTable() {
        const services = this.state.services;
        return (
            <TableComposable variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        {/*<Th key='hostPort'>Host:Port</Th>*/}
                        <Th key='host'>Host</Th>
                        <Th key='port'>Port</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {services
                        .filter(name => this.checkFilter(name))
                        .map((name, idx: number) => {
                            const serviceName = name.split("|")[0];
                            const hostPort = name.split("|")[1];
                            const host = hostPort.split(":")[0];
                            const port = hostPort.split(":")[1];
                            return (
                                <Tr key={name}>
                                    <Td noPadding isActionCell>
                                        <Badge>S</Badge>
                                    </Td>
                                    <Td noPadding>
                                        {serviceName}
                                    </Td>
                                    {/*<Td noPadding>*/}
                                    {/*    <Button style={{padding: '6px'}} variant={"link"} onClick={*/}
                                    {/*        e => this.props.onSelect?.call(this, hostPort)}>*/}
                                    {/*        {hostPort}*/}
                                    {/*    </Button>*/}
                                    {/*</Td>*/}
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => this.props.onSelect?.call(this, host)}>
                                            {host}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => this.props.onSelect?.call(this, port)}>
                                            {port}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </TableComposable>
        )
    }

    render() {
        const tabIndex = this.state.tabIndex;
        return (
            <Modal
                aria-label="Select from Kubernetes"
                width={'50%'}
                className='dsl-modal'
                isOpen={this.props.isOpen}
                onClose={this.props.onClose}
                header={
                    <Flex direction={{default: "column"}}>
                        <FlexItem>
                            <h3>{"Select from Kubernetes"}</h3>
                            {this.searchInput()}
                        </FlexItem>
                        <FlexItem>
                            <Tabs data-tour="selector-tabs" style={{overflow: 'hidden'}} activeKey={this.state.tabIndex} onSelect={this.selectTab}>
                                <Tab eventKey={"configMap"} key={"configMap"} title={<TabTitleText>ConfigMaps</TabTitleText>} />
                                <Tab eventKey={"secret"} key={"secret"} title={<TabTitleText>Secrets</TabTitleText>} />
                                <Tab eventKey={"service"} key={"service"} title={<TabTitleText>Services</TabTitleText>} />
                            </Tabs>
                        </FlexItem>
                    </Flex>
                }
                actions={{}}>
                <PageSection variant={this.props.dark ? "darker" : "light"}>
                    {this.searchInput()}
                    {tabIndex === 'configMap' && this.getConfigMapTable()}
                    {tabIndex === 'secret' && this.getSecretsTable()}
                    {tabIndex === 'service' && this.getServicesTable()}
                </PageSection>
            </Modal>
        )
    }
}