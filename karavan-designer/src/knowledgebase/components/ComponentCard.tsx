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
    CardHeader, Card, CardTitle, CardBody, CardFooter, Badge
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {CamelUi} from "../../designer/utils/CamelUi";
import {Component} from "karavan-core/lib/model/ComponentModels";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";

interface Props {
    component: Component,
}

export function ComponentCard(props: Props) {

    const [setComponent, setModalOpen] = useKnowledgebaseStore((s) =>
        [s.setComponent, s.setModalOpen], shallow)

    const component = props.component;

    function click (event: React.MouseEvent) {
        setComponent(component)
        setModalOpen(true);
    }

    return (
        <Card isCompact key={component.component.name} className="kamelet-card"
              onClick={event => click(event)}
        >
            <CardHeader className="header-labels">
                {component.component.supportType === 'Supported' && <Badge isRead className="support-type labels">{component.component.supportType}</Badge>}
                <Badge isRead className="support-level labels">{component.component.supportLevel}</Badge>
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconForComponent(component.component.title, component.component.label)}
                <CardTitle>{component.component.title}</CardTitle>
            </CardHeader>
            <CardBody>{component.component.description}</CardBody>
            <CardFooter className="footer-labels">
                <Badge isRead className="labels">{component.component.label}</Badge>
                <Badge isRead className="version labels">{component.component.version}</Badge>
            </CardFooter>
        </Card>
    )
}