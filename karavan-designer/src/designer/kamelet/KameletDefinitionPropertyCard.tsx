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
    Card,
    CardBody,
    CardTitle, Flex, FlexItem,
    FormGroup, FormSelect, FormSelectOption,
    Grid,
    GridItem, Label, Modal, Switch,
    TextInput,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {useIntegrationStore} from "../KaravanStore";
import {shallow} from "zustand/shallow";
import {DefinitionProperty} from "karavan-core/lib/model/IntegrationDefinition";

interface Props {
    index: number
    propKey: string
    property: DefinitionProperty
}

export function KameletDefinitionPropertyCard(props: Props) {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);

    const key = props.propKey;
    const required = integration.spec.definition?.required || [];

    function setPropertyValue(field: string, value: string) {
        if (integration.spec.definition?.properties) {
            (integration.spec.definition?.properties as any)[key][field] = value;
            setIntegration(integration, true);
        }
    }

    function getPropertyValue(field: string) {
        const properties: any = integration.spec.definition?.properties;
        if (properties) {
            return properties[key][field];
        }
        return undefined;
    }


    function getPropertyField(field: string, label: string, isRequired: boolean, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (
            <GridItem span={span}>
                <FormGroup label={label} fieldId={key + field} isRequired={isRequired}>
                    <TextInput className="text-field" type="text" id={key + field} name={key + field}
                               onChange={(_, value) => setPropertyValue(field, value)}
                               value={getPropertyValue(field)}/>
                </FormGroup>
            </GridItem>
        )
    }

    function getPropertyTypeField(field: string, label: string, isRequired: boolean, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (
            <GridItem span={span}>
                <FormGroup label={label} fieldId={key + field} isRequired={isRequired}>
                    <FormSelect
                        value={getPropertyValue(field)}
                        onChange={(_, value) => setPropertyValue(field, value)}
                        aria-label="FormSelect Input"
                        ouiaId="BasicFormSelect"
                    >
                        {['string', 'number', 'boolean'].map((option, index) => (
                            <FormSelectOption key={option} isDisabled={false} id={key + field} name={key + field} value={option} label={option} />
                        ))}
                    </FormSelect>
                </FormGroup>
            </GridItem>
        )
    }

    function renameProperty(newKey: string) {
        const oldKey = key;
        newKey = newKey.replace(/[\W_]+/g,'');
        if (oldKey !== newKey) {
            if (integration.spec.definition?.properties) {
                const o = (integration.spec.definition?.properties as any)
                const newObject: any = {};
                Object.keys(o).forEach(k => {
                    if (k !== oldKey) {
                        newObject[k] = o[k];
                    } else {
                        newObject[newKey] = o[k];
                    }
                })
                integration.spec.definition.properties = newObject;
                setIntegration(integration, true);
            }
        }
    }

    function deleteProperty() {
        if (integration.spec.definition?.properties) {
            delete integration.spec.definition.properties[key];
            setIntegration(integration, true);
        }
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => deleteProperty()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>
                Delete {key} property?
            </div>
        </Modal>)
    }

    function setRequired(checked: boolean) {
        console.log(required, key)
        const newRequired = [...required];
        if (checked && !newRequired.includes(key)) {
            newRequired.push(key);
        } else if (!checked && newRequired.includes(key)) {
            const index = newRequired.findIndex(r => r === key);
            newRequired.splice(index, 1);
        }
        // console.log(newRequired)
        if (integration.spec.definition?.required) {
            integration.spec.definition.required.length = 0;
            integration.spec.definition.required.push(...newRequired)
        }
        setIntegration(integration, true);
    }

    function getTitle() {
        return (
            <Flex>
                <FlexItem>
                    <Label
                        color="blue"
                        onClose={() => {
                            setShowDeleteConfirmation(true);
                        }}
                        closeBtnAriaLabel="Delete Property"
                        onEditCancel={(_, previousText) => {
                        }}
                        onEditComplete={(event, newText) => {
                            if (event.type === 'mousedown') {
                                renameProperty(newText)
                            } else if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Tab') {
                                renameProperty(newText)
                            } else if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Enter') {
                                renameProperty(newText)
                            } else {
                                renameProperty(key)
                            }
                        }}
                        isEditable
                        editableProps={{
                            'aria-label': `Editable property with text ${key}`,
                            id: 'editable-property'
                        }}
                    >
                        {key}
                    </Label>
                </FlexItem>
                <FlexItem align={{default: "alignRight"}}>
                    <Switch
                        label={"Required"}
                        isChecked={required.includes(key)}
                        onChange={(_, checked) => setRequired(checked)}
                        isReversed
                    />
                </FlexItem>
            </Flex>
        )
    }


    return (
        <Card isClickable isCompact isFlat ouiaId="PropertyCard" className="property-card">
            <CardTitle>
                {getTitle()}
            </CardTitle>
            <CardBody>
                <Grid hasGutter>
                    {getPropertyField("title", "Title", true, 3)}
                    {getPropertyField("description", "Description", true, 6)}
                    {getPropertyTypeField("type", "Type", true, 3)}
                    {getPropertyField("format", "Format", false, 3)}
                    {getPropertyField("example", "Example", false, 6)}
                    {getPropertyField("default", "Default", false, 3)}
                    {/*{getPropertyField("x-descriptors", "Descriptors", false, 12)}*/}
                </Grid>
            </CardBody>
            {getDeleteConfirmation()}
        </Card>
    )
}
