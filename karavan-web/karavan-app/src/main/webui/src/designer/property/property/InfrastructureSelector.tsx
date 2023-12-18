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
    Badge,
    Button, capitalize, Flex, FlexItem,
    Form, FormGroup, Modal, PageSection,
    Tab, Tabs, TabTitleText, TextInput,
} from '@patternfly/react-core';
import '../../karavan.css';
import {Table /* data-codemods */, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";

interface Props {
    onSelect: (value: string) => void,
    onClose?: () => void,
    isOpen: boolean,
    dark: boolean,
}

export function InfrastructureSelector(props: Props) {

    const tabs = InfrastructureAPI.infrastructure === 'kubernetes' ? ['configMap', 'secret', 'services'] : ['services'];
    const [tabIndex, setTabIndex] = useState<string | number>(tabs[0]);
    const [filter, setFilter] = useState<string>();

    function checkFilter  (name: string): boolean {
        if (filter !== undefined && name) {
            return name.toLowerCase().includes(filter.toLowerCase())
        } else {
            return true;
        }
    }

    function searchInput () {
        return (
            <Form isHorizontal className="search" autoComplete="off">
                <FormGroup fieldId="search">
                    <TextInput className="text-field" type="text" id="search" name="search"
                               value={filter}
                               onChange={(_, value) => setFilter(value)}/>
                </FormGroup>
            </Form>
        )
    }

    function getConfigMapTable() {
        const configMaps = InfrastructureAPI.configMaps;
        return (
            <Table variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        <Th key='data'>Data</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {configMaps
                        .filter(name => checkFilter(name))
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
                                            e => props.onSelect?.("configmap:" + name)}>
                                            {data}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </Table>
        )
    }

    function getSecretsTable() {
        const secrets = InfrastructureAPI.secrets;
        return (
            <Table variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        <Th key='data'>Data</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {secrets
                        .filter(name => checkFilter(name))
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
                                            e => props.onSelect?.("secret:" + name)}>
                                            {data}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </Table>
        )
    }

    function getServicesTable() {
        const services = InfrastructureAPI.services;
        return (
            <Table variant='compact' borders={false}>
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
                        .filter(name => checkFilter(name))
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
                                    {/*<Td noPadding>*/}
                                    {/*    {serviceName}*/}
                                    {/*</Td>*/}
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => props.onSelect?.(hostPort)}>
                                            {serviceName}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => props.onSelect?.(host)}>
                                            {host}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => props.onSelect?.(port)}>
                                            {port}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </Table>
        )
    }


    return (
        <Modal
            aria-label="Select from Infrastructure"
            width={'50%'}
            className='dsl-modal'
            isOpen={props.isOpen}
            onClose={props.onClose}
            header={
                <Flex direction={{default: "column"}}>
                    <FlexItem>
                        <h3>{"Select from " + capitalize(InfrastructureAPI.infrastructure)}</h3>
                        {searchInput()}
                    </FlexItem>
                    <FlexItem>
                        <Tabs style={{overflow: 'hidden'}} activeKey={tabIndex} onSelect={(_, eventKey) => setTabIndex(eventKey)}>
                            {tabs.map(tab => <Tab eventKey={tab} key={tab} title={<TabTitleText>{capitalize(tab)}</TabTitleText>} />)}
                        </Tabs>
                    </FlexItem>
                </Flex>
            }
            actions={{}}>
            <PageSection variant={props.dark ? "darker" : "light"}>
                {searchInput()}
                {tabIndex === 'configMap' && getConfigMapTable()}
                {tabIndex === 'secret' && getSecretsTable()}
                {tabIndex === 'services' && getServicesTable()}
            </PageSection>
        </Modal>
    )
}