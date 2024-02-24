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
    capitalize,
    Card,
    CardBody,
    CardTitle,
    Form,
    FormGroup, Grid, GridItem,
    InputGroup,
    InputGroupItem,
    InputGroupText,
    TextInput, ToggleGroup, ToggleGroupItem,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";

const PREFIX = 'camel.apache.org/';

export function KameletAnnotationsPanel() {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)

    function setValue(key: string, value: string) {
        if (key && value && value.length > 0) {
            (integration.metadata.annotations as any)[PREFIX + key] = value;
            setIntegration(integration, true);
        }
    }

    function getValue(key: string): string {
        const annotations = integration.metadata.annotations;
        if (annotations) {
            return (annotations as any)[PREFIX + key];
        } else {
            return '';
        }
    }

    function getElement(key: string, label: string, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (
            <GridItem span={span}>
                <FormGroup label={label} fieldId={key} isRequired>
                    <InputGroup>
                        <InputGroupItem isFill>
                            <TextInput className="text-field" type="text" id={key} name={key}
                                       onChange={(_, value) => setValue(key, value)}
                                       value={getValue(key)}/>
                        </InputGroupItem>
                    </InputGroup>
                </FormGroup>
            </GridItem>
        )
    }

    function getElementToggleGroup(key: string, label: string, values: string[], span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (
            <GridItem span={span}>
                <FormGroup label={label} fieldId={key} isRequired>
                    <ToggleGroup aria-label={key} id={key} name={key}>
                        {values.map(value =>
                            <ToggleGroupItem
                                key={value}
                                text={capitalize(value)}
                                buttonId="toggle-group-single-1"
                                isSelected={getValue(key) === value}
                                onChange={(_, selected) => setValue(key, value) }
                            />
                        )}
                    </ToggleGroup>
                </FormGroup>
            </GridItem>
        )
    }

    function getElementIcon(key: string, label: string, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (
            <GridItem span={span}>
                <FormGroup label={label} fieldId={key} isRequired>
                    <InputGroup>
                        <InputGroupText id="username">
                            <svg className="icon">
                                <image href={getValue(key)} className="icon"/>
                            </svg>
                        </InputGroupText>
                        <InputGroupItem isFill>
                            <TextInput className="text-field" type="text" id={key} name={key}
                                       onChange={(_, value) => setValue(key, value)}
                                       value={getValue(key)}/>
                        </InputGroupItem>
                    </InputGroup>
                </FormGroup>
            </GridItem>
        )
    }

    return (
        <Card isCompact ouiaId="AnnotationsCard">
            <CardTitle>Annotations</CardTitle>
            <CardBody>
                <Form>
                    <Grid hasGutter md={6}>
                        {getElementToggleGroup('kamelet.support.level', 'Support Level', ['Preview', 'Stable'], 2)}
                        {getElementIcon('kamelet.icon', 'Icon', 10)}
                        {getElement('catalog.version', 'Version', 3)}
                        {getElement('provider', 'Provider', 3)}
                        {getElement('kamelet.group', 'Group', 3)}
                        {getElement('kamelet.namespace', 'Namespace', 3)}
                    </Grid>
                </Form>
            </CardBody>
        </Card>
    )
}
