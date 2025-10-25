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
import {Badge, capitalize, Card, CardBody, CardFooter, CardHeader, Content, Form, Tooltip, TooltipPosition,} from '@patternfly/react-core';
import './DslSelector.css';
import '../property/property/ComponentPropertyField.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "@/designer/utils/DslMetaModel";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {useSelectorStore} from "@/designer/DesignerStore";
import {ComponentPropertyField} from "@/designer/property/property/ComponentPropertyField";
import {ExpressionEditor} from "@/designer/property/expression/ExpressionEditor";
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";

interface Props {
    dsl: DslMetaModel,
    index: number
    onDslCardClick: (evt: React.MouseEvent, dsl: DslMetaModel) => void
}

export function DslCard(props: Props) {

    const [showProperties, selectedDsl, setSelectedDsl] = useSelectorStore((s) => [s.showProperties, s.selectedDsl, s.setSelectedDsl])

    function dslCardClick(evt: React.MouseEvent, dsl: DslMetaModel) {
        evt.stopPropagation();
        if (!selectedDsl) {
            props.onDslCardClick(evt, dsl);
        }
    }

    const {dsl, index} = props;
    const navigation = dsl.navigation === 'eip' ? 'Processor' : capitalize(dsl.navigation);
    const labels = dsl.labels !== undefined ? dsl.labels.split(",").filter(label => label !== 'eip') : [];
    const isCustom = KameletApi.getCustomKameletNames().includes(dsl.name);
    const isProject = KameletApi.getProjectKameletNames().includes(dsl.name);
    const isRemote = dsl.remote;
    const classNameBadge = "navigation-label label-" + dsl.navigation + ((dsl.navigation === 'eip' || dsl?.supportLevel.toLowerCase() === 'stable') ? '' : '-preview');
    const componentProperties = showProperties && dsl?.uri
        ? ComponentApi.getComponentProperties(dsl.uri, 'consumer').filter(p => p.kind === 'path')
        : [];
    return (
        <Card key={dsl.dsl + index} className="dsl-card" onClick={event => dslCardClick(event, dsl)}>
            <CardHeader className="header-labels">
                <Badge className={classNameBadge}>{navigation}</Badge>
                {['kamelet', 'component'].includes(dsl.navigation.toLowerCase()) &&
                    <Badge isRead className="support-level labels">{dsl.supportLevel}</Badge>
                }
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconForDsl(dsl)}
                <Content component="p" className='dsl-card-title'>{dsl.title}</Content>
            </CardHeader>
            <CardBody className="dsl-card-body-description">
                {/*<Text>{dsl.description}</Content>*/}
                <Tooltip content={dsl.description} position={TooltipPosition.bottom} entryDelay={1000}>
                    <Content component="p" className="-pf-v6-u-color-200">{dsl.description}</Content>
                </Tooltip>
            </CardBody>
            {showProperties && selectedDsl &&
                <CardBody className="dsl-card-body-properties">
                    <Form autoComplete="off" className='properties'>
                        {componentProperties.map((kp: ComponentProperty) =>
                            <ComponentPropertyField
                                hideConfigSelector={true}
                                key={kp.name}
                                property={kp}
                                value={selectedDsl.properties?.[kp.name]}
                                expressionEditor={ExpressionEditor}
                                onParameterChange={(parameter, value, pathParameter, newRoute) => {
                                    setSelectedDsl({
                                        ...selectedDsl,
                                        properties: {
                                            ...(selectedDsl.properties ?? {}),
                                            [parameter]: value
                                        }
                                    });
                                }}
                            />
                        )}
                    </Form>
                </CardBody>
            }
            <CardFooter className="footer-labels">
                <div style={{display: "flex", flexDirection: "row", justifyContent: "start", flexWrap: "wrap"}}>
                    {labels.map((label, index) => <Badge key={label + "-" + index} isRead
                                                         className="labels">{label}</Badge>)}
                </div>
                {dsl.navigation === 'component' && <Badge isRead className="labels">{isRemote ? 'remote' : 'internal'}</Badge>}
                {isCustom && <Badge className="custom">custom</Badge>}
                {isProject && <Badge className="project">project</Badge>}
            </CardFooter>
        </Card>
    )
}