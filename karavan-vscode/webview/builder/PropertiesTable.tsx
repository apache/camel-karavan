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
    Button, Flex, FlexItem,
    Modal,
    PageSection,
    Panel,
    PanelMain,
    PanelMainBody,
    TextInput
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {ProjectProperty} from "karavan-core/lib/model/ProjectModel";

interface Props {
    properties: ProjectProperty[]
    onChange?: (properties: ProjectProperty[]) => void
}

interface State {
    properties: ProjectProperty[]
    showDeleteConfirmation: boolean
    deleteId?: string
}

export class PropertiesTable extends React.Component<Props, State> {

    public state: State = {
        properties: this.props.properties,
        showDeleteConfirmation: false,
    };

    sendUpdate = (props: ProjectProperty[]) => {
        this.props.onChange?.call(this, props);
    }

    changeProperty(p: ProjectProperty, field: "key" | "value", val?: string) {
        const key: string = field === 'key' && val !== undefined ? val : p.key;
        const value: any = field === 'value' ? val : p.value;
        const property: ProjectProperty = {id: p.id, key: key, value: value};
        const props = this.state.properties.map(prop => prop.id === property.id ? property : prop);
        this.setState({properties: props});
        this.sendUpdate(props);
    }

    startDelete(id: string) {
        this.setState({showDeleteConfirmation: true, deleteId: id});
    }

    confirmDelete() {
        const props = this.state.properties.filter(p => p.id !== this.state.deleteId);
        this.setState({properties: props, showDeleteConfirmation: false, deleteId: undefined});
        this.sendUpdate(props);
    }

    addProperty() {
        const props = [...this.state.properties];
        props.push(ProjectProperty.createNew("", ""))
        this.setState({properties: props, showDeleteConfirmation: false, deleteId: undefined});
        this.sendUpdate(props);
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.confirmDelete()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>Delete property?</div>
        </Modal>)
    }

    getTextInputField(property: ProjectProperty, field: "key" | "value", readOnly: boolean) {
        return (<TextInput isDisabled={readOnly} isRequired={true} className="text-field" type={"text"} id={"key"} name={"key"}
                           value={field === "key" ? property.key : property.value}
                           onChange={val => this.changeProperty(property, field, val)}/>)
    }

    render() {
        const properties = this.state.properties;
        return (
            <PageSection padding={{default: "noPadding"}}>
                {properties.length > 0 &&
                    <TableComposable aria-label="Property table" variant='compact' borders={false}
                                     className="project-properties">
                        <Thead>
                            <Tr>
                                <Th key='name'>Name</Th>
                                <Th key='value'>Value</Th>
                                <Td></Td>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {properties.map((property, idx: number) => {
                                const readOnly = property.key.startsWith("camel.jbang");
                                return (
                                    <Tr key={property.id}>
                                        <Td noPadding width={20} dataLabel="key">{this.getTextInputField(property, "key", readOnly)}</Td>
                                        <Td noPadding width={10} dataLabel="value">{this.getTextInputField(property, "value", readOnly)}</Td>
                                        <Td noPadding isActionCell dataLabel="delete">
                                            {!readOnly && <Button variant={"plain"} icon={<DeleteIcon/>} className={"delete-button"}
                                                                  onClick={event => this.startDelete(property.id)}/>}
                                        </Td>
                                    </Tr>
                                )})}
                        </Tbody>
                    </TableComposable>}
                <Panel>
                    <PanelMain>
                        <PanelMainBody>
                            <Flex direction={{default:"row"}} >
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <Button isInline variant={"primary"} icon={<PlusIcon/>}
                                            className={"add-button"}
                                            onClick={event => this.addProperty()}>Add property</Button>
                                </FlexItem>
                            </Flex>
                        </PanelMainBody>
                    </PanelMain>
                </Panel>
            </PageSection>
        )
    }
}