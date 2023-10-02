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
    Button,
    Modal,
    ActionGroup,
    Text,
    CardHeader,
    Badge, Flex, CardTitle,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Property} from "karavan-core/lib/model/KameletModels";
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {CamelUi} from "../../designer/utils/CamelUi";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";

export function KameletModal() {

    const [kamelet, isModalOpen, setModalOpen] = useKnowledgebaseStore((s) =>
        [s.kamelet, s.isModalOpen, s.setModalOpen], shallow)

    function getKameletProperties (properties: any): any[]  {
        return properties
            ? Array.from(new Map(Object.entries(properties)), ([name, value]) => (value))
            : [];
    }

    return (
        <Modal
            aria-label={"Kamelet"}
            width={'fit-content'}
            maxLength={200}
            title={kamelet?.spec.definition.title}
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
            <Flex direction={{default: 'column'}} key={kamelet?.metadata.name}
                  className="kamelet-modal-card">
                <CardHeader actions={{ actions: <><Badge className="badge"
                                                         isRead> {kamelet?.metadata.labels["camel.apache.org/kamelet.type"].toLowerCase()}</Badge></>, hasNoOffset: false, className: undefined}} >
                    {kamelet && CamelUi.getIconFromSource(kamelet?.icon())}

                </CardHeader>
                <Text className="description">{kamelet?.spec.definition.description}</Text>
                {kamelet?.spec.definition.properties && kamelet?.spec.definition.properties.length !== 0 &&
                    <div>
                        <CardTitle>Properties</CardTitle>
                        <Table aria-label="Simple table" variant='compact'>
                            <Thead>
                                <Tr>
                                    <Th key='title'>Title</Th>
                                    <Th key='type'>Type</Th>
                                    <Th key='desc'>Description</Th>
                                    <Th key='format'>Format</Th>
                                    <Th key='example'>Example</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {getKameletProperties(kamelet?.spec.definition.properties).map((p: Property, idx: number) => (
                                    <Tr key={idx}>
                                        <Td key={`${idx}_title`}>{p.title}</Td>
                                        <Td key={`${idx}_type`}>{p.type}</Td>
                                        <Td key={`${idx}_desc`}>{p.description}</Td>
                                        <Td key={`${idx}_format`}>{p.format}</Td>
                                        <Td key={`${idx}_example`}>{p.example}</Td>
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
