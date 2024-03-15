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
    Badge,
    Card, CardBody, CardFooter,
    CardHeader,
    Text,
} from '@patternfly/react-core';
import './DslSelector.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";
import {KameletApi} from "karavan-core/lib/api/KameletApi";

interface Props {
    dsl: DslMetaModel,
    index: number
    onDslSelect: (evt: React.MouseEvent, dsl: DslMetaModel) => void
}

export function DslCard (props: Props) {

    function selectDsl(evt: React.MouseEvent, dsl: DslMetaModel) {
        props.onDslSelect(evt, dsl);
    }

    const {dsl, index} = props;
    const labels = dsl.labels !== undefined ? dsl.labels.split(",").filter(label => label !== 'eip') : [];
    const isCustom = KameletApi.getCustomKameletNames().includes(dsl.name);
    return (
        <Card key={dsl.dsl + index} isCompact isPlain isFlat isRounded className="dsl-card"
              onClick={event => selectDsl(event, dsl)}>
            <CardHeader className="header-labels">
                <Badge isRead className="support-level labels">{dsl.supportLevel}</Badge>
                {['kamelet', 'component'].includes(dsl.navigation.toLowerCase()) &&
                    <Badge isRead className="version labels">{dsl.version}</Badge>
                }
                {isCustom && <Badge className="custom">custom</Badge>}
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconForDsl(dsl)}
                <Text className='dsl-card-title'>{dsl.title}</Text>
            </CardHeader>
            <CardBody>
                {/*<Text>{dsl.description}</Text>*/}
                <Text className="pf-v5-u-color-200">{dsl.description}</Text>
            </CardBody>
            <CardFooter className="footer-labels">
                <div style={{display: "flex", flexDirection: "row", justifyContent: "start"}}>
                    {labels.map((label, index) => <Badge key={label + "-" + index} isRead
                                                         className="labels">{label}</Badge>)}
                </div>

            </CardFooter>
        </Card>
    )
}