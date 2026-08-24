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
import {Badge, Card, CardBody, CardFooter, CardHeader, CardTitle, Checkbox, Content, Flex, Tooltip} from '@patternfly/react-core';
import {shallow} from "zustand/shallow";
import {useDocumentationStore} from "@stores/DocumentationStore";
import {Component} from "@core/model/ComponentModels";
import {CamelUi} from "@designer/utils/CamelUi";
import {useDocumentationHook} from "../useDocumentationHook";
import {ComponentApi} from "@core/api/ComponentApi";

interface Props {
    component: Component,
}

export function ComponentCard(props: Props) {

    const {onChangeBlockedList} = useDocumentationHook();
    const [setComponent, setModalOpen]
        = useDocumentationStore((s) =>
        [s.setComponent, s.setModalOpen], shallow)
    const component = props.component;

    function click(event: React.MouseEvent) {
        const {target} = event;
        if (!(target as HTMLElement).parentElement?.className.includes("block-checkbox")) {
            setComponent(component)
            setModalOpen(true);
        }
    }

    const isBlockedComponent = ComponentApi.getBlockedComponentNames().includes(component.component.name);
    const isRemote = component.component.remote;
    const classNameBadge = 'label-component' + (component.component.supportLevel !== 'Stable' ? '-preview' : '')
    return (
        <Card isCompact key={component.component.name} className="documentation-card"
              onClick={event => click(event)}
        >
            <CardHeader className="header-labels">
                <Flex style={{width: '100%'}} gap={{default: 'gapSm'}} justifyContent={{default: 'justifyContentSpaceBetween'}}>
                    <Badge className={classNameBadge}>Component</Badge>
                    <Badge isRead className="support-level labels">{component.component.supportLevel}</Badge>
                </Flex>
                <Tooltip content={isBlockedComponent ? 'Unblock' : 'Block'}>
                    <Checkbox id={component.component.name}
                              className="block-checkbox labels"
                              isChecked={!isBlockedComponent}
                              onChange={(_, checked) => onChangeBlockedList("component", component.component.name, checked)}
                    />
                </Tooltip>
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconForComponent(component.component.title, component.component.label)}
                <CardTitle>{component.component.title}</CardTitle>
            </CardHeader>
            <CardBody>
                <Content component="p" className="-pf-v6-u-color-200">{component.component.description}</Content>
            </CardBody>
            <CardFooter className="footer-labels">
                <Badge isRead className="labels">{component.component.label}</Badge>
                <Badge isRead className="labels">{isRemote ? 'remote' : 'internal'}</Badge>
            </CardFooter>
        </Card>
    )
}