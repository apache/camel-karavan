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
import React, {useEffect, useState} from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, CardFooter, Badge, Checkbox, Flex, Text
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {CamelUi} from "../../designer/utils/CamelUi";
import {Component} from "karavan-core/lib/model/ComponentModels";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";
import {ComponentApi} from 'karavan-core/lib/api/ComponentApi';

interface Props {
    component: Component,
    onChange: (name: string, checked: boolean) => void
}

export function ComponentCard(props: Props) {

    const [setComponent, setModalOpen, showBlockCheckbox] = useKnowledgebaseStore((s) =>
        [s.setComponent, s.setModalOpen, s.showBlockCheckbox], shallow)
    const component = props.component;
    const [blockedComponents, setBlockedComponents] = useState<string[]>();
    useEffect(() => {
        setBlockedComponents(ComponentApi.getBlockedComponentNames());
    }, []);


    function click(event: React.MouseEvent) {
        const {target} = event;
        if (!(target as HTMLElement).parentElement?.className.includes("block-checkbox")) {
            setComponent(component)
            setModalOpen(true);
        }
    }

    function selectComponent(event: React.FormEvent, checked: boolean) {
        props.onChange(component.component.name, checked);
        setBlockedComponents([...ComponentApi.getBlockedComponentNames()]);
    }

    const isBlockedComponent = blockedComponents ? blockedComponents.findIndex(r => r === component.component.name) > -1 : false;
    const isRemote = component.component.remote;
    const classNameBadge = 'label-component' + (component.component.supportLevel !== 'Stable' ? '-preview' : '')
    return (
        <Card isCompact key={component.component.name} className="knowledgebase-card"
              onClick={event => click(event)}
        >
            <CardHeader className="header-labels">
                <Flex style={{width: '100%'}} gap={{default: 'gapSm'}} justifyContent={{default: 'justifyContentSpaceBetween'}}>
                    <Badge className={classNameBadge}>Component</Badge>
                    <Badge isRead className="support-level labels">{component.component.supportLevel}</Badge>
                </Flex>
                {showBlockCheckbox &&
                    <Checkbox id={component.component.name}
                              className="block-checkbox labels"
                              isChecked={!isBlockedComponent}
                              onChange={(_, checked) => selectComponent(_, checked)}
                    />
                }
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconForComponent(component.component.title, component.component.label)}
                <CardTitle>{component.component.title}</CardTitle>
            </CardHeader>
            <CardBody>
                <Text className="pf-v5-u-color-200">{component.component.description}</Text>
            </CardBody>
            <CardFooter className="footer-labels">
                <Badge isRead className="labels">{component.component.label}</Badge>
                <Badge isRead className="labels">{isRemote ? 'remote' : 'internal'}</Badge>
            </CardFooter>
        </Card>
    )
}