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
    FormGroup, FormHelperText, HelperText, HelperTextItem,
    Label,
    LabelGroup,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";

export function KameletTypesOutCard() {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)

    const dependencies: string[] = [...(integration.spec.dependencies || [])];


    function setDependencies(deps: string[]) {
        const i = CamelUtil.cloneIntegration(integration);
        i.spec.dependencies = deps;
        setIntegration(i, true);
    }

    function addDepencency() {
        dependencies.push("dependency")
        setDependencies(dependencies);
    }

    function deleteDependency(val: string) {
        setDependencies(dependencies.filter(e => e !== val));
    }

    function renameDependency(index: number, newVal: string) {
        dependencies[index] = newVal;
        setDependencies(dependencies);
    }

    return (
        <Card isClickable isCompact isFlat ouiaId="PropertyCard" className="property-card">
            <CardTitle>
                Dependencies
            </CardTitle>
            <CardBody>
                <FormHelperText>
                    <HelperText>
                        <HelperTextItem>Dependencies required, ex: camel:component or mvn:groupId:artifactId:version</HelperTextItem>
                    </HelperText>
                </FormHelperText>
            </CardBody>
            <CardBody>
                <FormGroup fieldId={'dependencies'}>
                    <LabelGroup
                        // categoryName={"Dependencies"}
                        numLabels={dependencies.length}
                        isEditable
                        addLabelControl={
                            <Button variant="link" icon={<AddIcon/>} onClick={event => addDepencency()}>
                                Add
                            </Button>
                        }
                    >
                        {dependencies.map((val: string, index: number) => (
                            <Label
                                key={val}
                                id={val}
                                color="grey"
                                isEditable
                                onClose={() => deleteDependency(val)}
                                onEditCancel={(_event, prevText) => {}}
                                onEditComplete={(event, newText) => {
                                    if (event.type === 'mousedown') {
                                        renameDependency(index, val)
                                    } else if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Tab') {
                                        renameDependency(index, newText)
                                    } else if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Enter') {
                                        renameDependency(index, newText)
                                    } else {
                                        renameDependency(index, val)
                                    }
                                }}
                            >
                                {val}
                            </Label>
                        ))}
                    </LabelGroup>
                </FormGroup>
            </CardBody>
        </Card>
    )
}
