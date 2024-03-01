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
    CardTitle,
    Flex,
    FlexItem,
    FormGroup,
    FormSelect,
    FormSelectOption,
    Grid,
    GridItem,
    Label,
    LabelGroup,
    Modal,
    Switch,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {DefinitionProperty} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { KameletInput } from './KameletInput';

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

    function setPropertyValue(field: string, value: any) {
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
       return (<KameletInput elementKey={key + field} label={label} span={span} value={getPropertyValue(field)} setValue={(value: string) => setPropertyValue(field, value)} type='text' isRequired={isRequired}/>);
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
                        {['string', 'number', 'integer', 'boolean'].map((option, index) => (
                            <FormSelectOption key={option} isDisabled={false} id={key + field} name={key + field}
                                              value={option} label={option}/>
                        ))}
                    </FormSelect>
                </FormGroup>
            </GridItem>
        )
    }

    function sortEnum(source: string, dest: string) {
        const i = CamelUtil.cloneIntegration(integration);
        if (i.spec.definition && integration.spec.definition?.properties[key]) {
            const enums: string [] = i.spec.definition.properties[key].enum;
            console.log(enums)
            if (enums && Array.isArray(enums)) {
                console.log("isArray")
                const from = enums.findIndex(e => source);
                const to = enums.findIndex(e => dest);
                if (from > -1 && to > -1) {
                    console.log("exchange");
                    [enums[from], enums[to]] = [enums[to], enums[from]];
                    i.spec.definition.properties[key].enum = enums;
                    console.log("i.spec.definition.properties[key].enum", i.spec.definition.properties[key].enum);
                    setIntegration(i, true);
                }
            }
        }
    }

    function addEnum() {
        const i = CamelUtil.cloneIntegration(integration);
        if (i.spec.definition && integration.spec.definition?.properties[key]) {
            let enums: string [] = i.spec.definition.properties[key].enum;
            if (enums && Array.isArray(enums)) {
                enums.push("enum")
            } else {
                enums = ['enum'];
            }
            i.spec.definition.properties[key].enum = enums;
            setIntegration(i, true);
        }
    }

    function deleteEnum(val: string) {
        const enumVal = getPropertyValue('enum');
        const i = CamelUtil.cloneIntegration(integration);
        if (enumVal && Array.isArray(enumVal) && i.spec.definition) {
            const enums: string[] = [...enumVal];
            setPropertyValue('enum', enums.filter(e => e !== val));
        }
    }

    function renameEnum(index: number, newVal: string) {
        const enumVal = getPropertyValue('enum');
        const i = CamelUtil.cloneIntegration(integration);
        if (enumVal && Array.isArray(enumVal) && i.spec.definition) {
            const enums: string[] = [...enumVal];
            enums[index] = newVal;
            setPropertyValue('enum', enums);
        }
    }

    function getPropertyEnumField(field: string, label: string, isRequired: boolean, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        const enumVal = getPropertyValue(field);
        return (
            <GridItem span={span}>
                <FormGroup fieldId={key + field} isRequired={isRequired}>
                    <LabelGroup
                        categoryName={label}
                        numLabels={enumVal?.length || 0}
                        isEditable
                        addLabelControl={
                            <Button variant="link" icon={<AddIcon/>} onClick={event => addEnum()}>
                                Add
                            </Button>
                        }
                    >
                        {enumVal && enumVal.map((val: string, index: number) => (
                            <Label
                                key={val}
                                id={val}
                                color="grey"
                                isEditable
                                onClose={() => deleteEnum(val)}
                                onEditCancel={(_event, prevText) => {}}
                                onEditComplete={(event, newText) => {
                                    if (event.type === 'mousedown') {
                                        renameEnum(index, val)
                                    } else if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Tab') {
                                        renameEnum(index, newText)
                                    } else if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Enter') {
                                        renameEnum(index, newText)
                                    } else {
                                        renameEnum(index, val)
                                    }
                                }}
                            >
                                {val}
                            </Label>
                        ))}
                    </LabelGroup>
                </FormGroup>
            </GridItem>
        )
    }

    function renameProperty(newKey: string) {
        const oldKey = key;
        newKey = newKey.replace(/[\W_]+/g, '');
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
        const newRequired = [...required];
        if (checked && !newRequired.includes(key)) {
            newRequired.push(key);
        } else if (!checked && newRequired.includes(key)) {
            const index = newRequired.findIndex(r => r === key);
            newRequired.splice(index, 1);
        }
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
                    {getPropertyValue('type') === 'string' && getPropertyEnumField("enum", "Enum", true, 12)}
                    {/*{getPropertyField("x-descriptors", "Descriptors", false, 12)}*/}
                </Grid>
            </CardBody>
            {getDeleteConfirmation()}
        </Card>
    )
}
