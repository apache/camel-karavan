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
    CardHeader, Card, CardTitle, CardBody, CardFooter, Badge, Checkbox, Flex
} from '@patternfly/react-core';
import {KameletModel} from "@/core/model/KameletModels";
import {CamelUi} from "@/integration-designer/utils/CamelUi";
import {KameletApi} from "@/core/api/KameletApi";
import {useDocumentationStore} from "../DocumentationStore";
import {shallow} from "zustand/shallow";

interface Props {
    kamelet: KameletModel,
}

export function KameletCard(props: Props) {

    const [setKamelet, setModalOpen] = useDocumentationStore((s) => [s.setKamelet, s.setModalOpen], shallow)

    const kamelet = props.kamelet;
    const isCustom = KameletApi.getCustomKameletNames().includes(kamelet.metadata.name);

    function click(event: React.MouseEvent) {
        const { target } = event;
        if (!(target as HTMLElement).parentElement?.className.includes("block-checkbox")) {
            setKamelet(kamelet)
            setModalOpen(true);
        }

    }

    const supportLevel = kamelet.metadata.annotations["camel.apache.org/kamelet.support.level"];
    const classNameBadge = 'label-kamelet' + (supportLevel !== 'Stable' ? '-preview' : '')
    return (
        <Card  isCompact key={kamelet.metadata.name} className="documentation-card"
               onClick={event => click(event)}
        >
            <CardHeader className="header-labels">
                <Flex style={{width:'100%'}} gap={{default:'gapSm'}} justifyContent={{default: 'justifyContentSpaceBetween'}}>
                    <Badge className={classNameBadge}>Kamelet</Badge>
                    <Badge isRead className="support-level labels">{kamelet.metadata.annotations["camel.apache.org/kamelet.support.level"]}</Badge>
                </Flex>
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconFromSource(kamelet.icon())}
                <CardTitle>{kamelet.spec.definition.title}</CardTitle>
            </CardHeader>
            <CardBody>{kamelet.spec.definition.description}</CardBody>
            <CardFooter className="footer-labels">
                <Badge isRead className="labels">{kamelet.metadata.labels["camel.apache.org/kamelet.type"].toLowerCase()}</Badge>
                {isCustom && <Badge className="custom labels">custom</Badge>}
            </CardFooter>
        </Card>
    )
}