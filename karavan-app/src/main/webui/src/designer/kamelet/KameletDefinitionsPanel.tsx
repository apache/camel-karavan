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
    Card,
    CardBody,
    CardTitle,
    Flex,
    FlexItem,
    Form,
    Grid,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {KameletDefinitionPropertyCard} from "./KameletDefinitionPropertyCard";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {DefinitionProperty} from "karavan-core/lib/model/IntegrationDefinition";
import { KameletDependenciesCard } from "./KameletDependenciesCard";
import { KameletInput } from './KameletInput';

export function KameletDefinitionsPanel() {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)

    function setValue(key: string, value: string) {
        if (key && value && value.length > 0) {
            (integration.spec.definition as any)[key] = value;
            setIntegration(integration, true);
        }
    }

    function getValue(key: string): string {
        const annotations = integration.spec.definition;
        if (annotations) {
            return (annotations as any)[key];
        } else {
            return '';
        }
    }

    function getElementTextInput(key: string, label: string, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (<KameletInput elementKey={key} label={label} span={span} value={getValue(key)} setValue={(value: string) => setValue(key, value)} type='text' isRequired={true}/>);

    }

    function getElementTextArea(key: string, label: string, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (<KameletInput elementKey={key} label={label} span={span} value={getValue(key)} setValue={(value: string) => setValue(key, value)} type='textArea' isRequired={true}/>);

    }

    const properties = integration.spec.definition?.properties ? Object.keys(integration.spec.definition?.properties) : [];

    function addNewProperty() {
        const i = CamelUtil.cloneIntegration(integration);
        if (i.spec.definition && integration.spec.definition?.properties) {
            const propertyName = generatePropertyName();
            i.spec.definition.properties = Object.assign({[propertyName]: new DefinitionProperty()}, integration.spec.definition.properties);
            setIntegration(i, true);
        }
    }

    function generatePropertyName(count: number = 0): string {
        const prefix = 'property';
        const propName = 'property' + count;
        if (integration.spec.definition?.properties) {
            const keys = Object.keys(integration.spec.definition?.properties);
            if (keys.includes(propName)) {
                return generatePropertyName(count + 1);
            } else {
                return propName;
            }
        }
        return prefix;
    }

    return (
        <>
            <Card isCompact ouiaId="DefinitionsCard">
                <CardTitle>Definitions</CardTitle>
                <CardBody>
                    <Form>
                        <Grid hasGutter>
                            {getElementTextInput('title', 'Title', 3)}
                            {getElementTextArea('description', 'Description', 9)}
                            {/*{getElementTextInput('type', 'Type', 2)}*/}
                        </Grid>
                    </Form>
                </CardBody>
            </Card>
            <div style={{height: "20px"}}/>
            <Card isCompact ouiaId="PropertiesCard">
                <CardTitle>
                    <Flex>
                        <FlexItem>Properties</FlexItem>
                        <FlexItem align={{default: "alignRight"}}>
                            <Button variant={"link"} icon={<AddIcon/>} onClick={event => addNewProperty()}>
                                Add property
                            </Button>
                        </FlexItem>
                    </Flex>
                </CardTitle>
                <CardBody>
                    <Form>
                        {properties.map((key: string, index: number) => {
                            const property = (integration.spec.definition?.properties as any)[key];
                            return <KameletDefinitionPropertyCard key={key}
                                                                  index={index}
                                                                  propKey={key}
                                                                  property={property}/>
                        })}
                    </Form>
                </CardBody>
            </Card>
            <div style={{height: "20px"}}/>
            <KameletDependenciesCard/>
        </>

    )
}
