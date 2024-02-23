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
import {ActionGroup, Badge, Button, CardHeader, CardTitle, Flex, Modal, Text,} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {CamelUi} from "../../designer/utils/CamelUi";
import {PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";


export function EipModal() {

    const [element, isModalOpen, setModalOpen] = useKnowledgebaseStore((s) =>
        [s.element, s.isModalOpen, s.setModalOpen], shallow)

    return (
        <Modal
            aria-label={"Kamelet"}
            width={'fit-content'}
            maxLength={200}
            title={element?.title}
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            actions={[
                <div className="modal-footer" key="buttons">
                    <ActionGroup className="deploy-buttons">
                        <Button key="cancel" variant="primary"
                                onClick={e => setModalOpen(false)}>Close</Button>
                    </ActionGroup>
                </div>
            ]}
        >
            <Flex direction={{default: 'column'}} key={element?.name} className="kamelet-modal-card">
                <CardHeader actions={{ actions: <><Badge className="badge"
                                                         isRead> {element?.labels}</Badge></>, hasNoOffset: false, className: undefined}} >
                    {element && CamelUi.getIconForDslName(element?.className)}

                </CardHeader>
                <Text className="description">{element?.description}</Text>
                {element?.properties.length !== 0 &&
                    <div>
                        <CardTitle>Properties</CardTitle>
                        <Table aria-label="Simple table" variant='compact'>
                            <Thead>
                                <Tr>
                                    <Th key='name' width={10}>Name</Th>
                                    <Th key='label'>Label</Th>
                                    <Th key='display' width={10}>Display Name</Th>
                                    <Th key='desc'>Description</Th>
                                    <Th key='type'>Type</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {element?.properties.map((p: PropertyMeta, idx: number) => (
                                    <Tr key={idx}>
                                        <Td modifier={"fitContent"}>
                                            {p.name}
                                        </Td>
                                        <Td modifier={"fitContent"}>
                                            <Badge className="badge" isRead>{p.label}</Badge>
                                        </Td>
                                        <Td modifier={"fitContent"}>
                                            {p.displayName}
                                        </Td>
                                        <Td key={`${idx}_desc`}><div>
                                            <div>{p.description}</div>
                                            {p.defaultValue && p.defaultValue.toString().length > 0 && <div>{"Default value: " + p.defaultValue}</div>}
                                        </div></Td>
                                        <Td key={`${idx}_type`}>{p.type}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </div>
                }
            </Flex>
        </Modal>
    )
}
