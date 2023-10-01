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
    CardTitle, Flex, FlexItem,
    Form,
    FormGroup,
    Grid,
    GridItem,
    TextInput,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {useIntegrationStore} from "../KaravanStore";
import {shallow} from "zustand/shallow";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {KameletDefinitionPropertyCard} from "./KameletDefinitionPropertyCard";

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

    function getElement(key: string, label: string, span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
        return (
            <GridItem span={span}>
                <FormGroup label={label} fieldId={key} isRequired>
                    <TextInput className="text-field" type="text" id={key} name={key}
                               onChange={(_, value) => setValue(key, value)}
                               value={getValue(key)}/>
                </FormGroup>
            </GridItem>
        )
    }

    const properties = integration.spec.definition?.properties ? Object.keys(integration.spec.definition?.properties) : [];
    return (
        <>
            <Card isCompact ouiaId="DefinitionsCard">
                <CardTitle>Definitions</CardTitle>
                <CardBody>
                    <Form>
                        <Grid hasGutter>
                            {getElement('title', 'Title', 4)}
                            {getElement('description', 'Description', 6)}
                            {getElement('type', 'Type', 2)}
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
                            <Button variant={"link"} icon={<AddIcon/>}>Add property</Button>
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
        </>

    )
}
