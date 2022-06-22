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
    CardActions,
    Badge, Flex, CardTitle,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {CamelUi} from "../designer/utils/CamelUi";
import {ElementMeta, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    element?: ElementMeta,
    isOpen: boolean;
}

interface State {
    isOpen: boolean;
    element?: ElementMeta,
}

export class EipModal extends  React.Component<Props, State> {

    public state: State = {
        isOpen: this.props.isOpen,
        element: this.props.element,
    };

    setModalOpen = (open: boolean) => {
        this.setState({isOpen: false});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.isOpen !== this.props.isOpen) {
            this.setState({isOpen: this.props.isOpen});
        }
    }

    render() {
        const component = this.state.element;
        return (
            <Modal
                aria-label={"Kamelet"}
                width={'fit-content'}
                maxLength={200}
                title={component?.title}
                isOpen={this.state.isOpen}
                onClose={() => this.setModalOpen(false)}
                actions={[
                    <div className="modal-footer">
                        <ActionGroup className="deploy-buttons">
                            <Button key="cancel" variant="primary"
                                    onClick={e => this.setModalOpen(false)}>Close</Button>
                        </ActionGroup>
                    </div>
                ]}
            >
                <Flex direction={{default: 'column'}} key={component?.name}
                      className="kamelet-modal-card">
                    <CardHeader>
                        {component && CamelUi.getIconForDslName(component?.className)}
                        <CardActions>
                            <Badge className="badge"
                                   isRead> {component?.labels}</Badge>
                        </CardActions>
                    </CardHeader>
                    <Text className="description">{component?.description}</Text>
                    {component?.properties.length !== 0 &&
                    <div>
                        <CardTitle>Properties</CardTitle>
                        <TableComposable aria-label="Simple table" variant='compact'>
                            <Thead>
                                <Tr>
                                    <Th key='name'>Display Name / Name</Th>
                                    <Th key='desc'>Description</Th>
                                    <Th key='type'>Type</Th>
                                    <Th key='label'>Label</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {component?.properties.map((p: PropertyMeta, idx: number) => (
                                    <Tr key={idx}>
                                        <Td key={`${idx}_name`}>
                                            <div>
                                                <b>{p.displayName}</b>
                                                <div>{p.name}</div>
                                            </div>
                                        </Td>
                                        <Td key={`${idx}_desc`}><div>
                                            <div>{p.description}</div>
                                            {p.defaultValue && p.defaultValue.toString().length > 0 && <div>{"Default value: " + p.defaultValue}</div>}
                                        </div></Td>
                                        <Td key={`${idx}_type`}>{p.type}</Td>
                                        <Td key={`${idx}_label`}>{p.label}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </TableComposable>
                    </div>
                    }
                </Flex>
            </Modal>
        )
    }
}
