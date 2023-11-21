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
    Button,
    Modal,
    ActionGroup,
    Text,
    CardHeader,
    Badge, Flex, CardTitle, Tabs, Tab, TabTitleText,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {CamelUi} from "../../designer/utils/CamelUi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {ComponentHeader, ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";

export function ComponentModal() {

    const [component, isModalOpen, setModalOpen] = useKnowledgebaseStore((s) =>
        [s.component, s.isModalOpen, s.setModalOpen], shallow)

    const [tab, setTab] = useState<string | number>('properties');

    const props = new Map<string, ComponentProperty>();
    if (component) {
        ComponentApi.getComponentProperties(component?.component.name, "consumer").forEach(cp => props.set(cp.name, cp));
        ComponentApi.getComponentProperties(component?.component.name, "producer").forEach(cp => props.set(cp.name, cp));
    }

    const headers = new Map<string, ComponentHeader>();
    if (component) {
        ComponentApi.getComponentHeaders(component?.component.name, "consumer").forEach(cp => headers.set(cp.name, cp));
        ComponentApi.getComponentHeaders(component?.component.name, "producer").forEach(cp => headers.set(cp.name, cp));
    }


    function getPropertiesTable() {
        return (
            <Table aria-label="Properties table" variant='compact'>
                <Thead>
                    <Tr>
                        <Th key='name'>Display Name / Name</Th>
                        <Th key='desc'>Description</Th>
                        <Th key='type'>Type</Th>
                        <Th key='label'>Label</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {Array.from(props.values()).map((p: ComponentProperty, idx: number) => (
                        <Tr key={idx}>
                            <Td key={`${idx}_name`}>
                                <div>
                                    <b>{p.displayName}</b>
                                    <div>{p.name}</div>
                                </div>
                            </Td>
                            <Td key={`${idx}_desc`}>
                                <div>
                                    <div>{p.description}</div>
                                    {p.defaultValue && p.defaultValue.toString().length > 0 &&
                                        <div>{"Default value: " + p.defaultValue}</div>}
                                </div>
                            </Td>
                            <Td key={`${idx}_type`}>{p.type}</Td>
                            <Td key={`${idx}_label`}>{p.label}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        )
    }

    function getHeadersTable() {
        return (
            <Table aria-label="Headers table" variant='compact'>
                <Thead>
                    <Tr>
                        <Th key='name'>Name</Th>
                        <Th key='desc' modifier={"breakWord"}>Description</Th>
                        <Th key='type'>Group</Th>
                        <Th key='label'>Java Type</Th>
                        <Th key='label'>Default Value</Th>
                        <Th key='label'>Autowired</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {Array.from(headers.values()).map((p: ComponentHeader, idx: number) => (
                        <Tr key={idx}>
                            <Td key={`${idx}_name`}>
                                <div>
                                    <b>{p.displayName}</b>
                                    <div>{p.name}</div>
                                </div>
                            </Td>
                            <Td key={`${idx}_type`}>{p.description}</Td>
                            <Td key={`${idx}_label`}>{p.group}</Td>
                            <Td key={`${idx}_label`}>{p.javaType}</Td>
                            <Td key={`${idx}_label`}>{p.defaultValue}</Td>
                            <Td key={`${idx}_label`}>{p.autowired}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        )
    }

    const showProps = props.size !== 0;
    const showHeaders = headers.size !== 0;

    return (
        <Modal
            aria-label={"Kamelet"}
            width={'80%'}
            maxLength={200}
            title={component?.component.title}
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            actions={[
                <div className="modal-footer">
                    <ActionGroup className="deploy-buttons">
                        <Button key="cancel" variant="primary"
                                onClick={e => setModalOpen(false)}>Close</Button>
                    </ActionGroup>
                </div>
            ]}
        >
            <Flex direction={{default: 'column'}} key={component?.component.name}
                  className="kamelet-modal-card">
                <CardHeader actions={{
                    actions: <><Badge className="badge"
                                      isRead> {component?.component.label}</Badge></>,
                    hasNoOffset: false,
                    className: undefined
                }}>
                    {component && CamelUi.getIconForComponent(component.component.title, component.component.label)}

                </CardHeader>
                <Text className="description">{component?.component.description}</Text>
                <Tabs
                    activeKey={tab}
                    onSelect={(event, eventKey) => setTab(eventKey)}
                    aria-label="Tabs in the default example"
                    role="region"
                >
                    <Tab eventKey={'properties'} title={<TabTitleText>Properties</TabTitleText>}/>
                    <Tab eventKey={'headers'} title={<TabTitleText>Headers</TabTitleText>}/>
                </Tabs>
                {tab === 'properties' && showProps && getPropertiesTable()}
                {tab === 'headers' && showHeaders && getHeadersTable()}
            </Flex>
        </Modal>
    )
}
