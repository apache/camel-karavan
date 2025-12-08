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
import {Badge, Card, CardBody, CardFooter, CardHeader, CardTitle, Content} from '@patternfly/react-core';
import {CamelUi} from "@features/integration/designer/utils/CamelUi";
import {ElementMeta} from "@karavan-core/model/CamelMetadata";
import {useDocumentationStore} from "../../../stores/DocumentationStore";
import {shallow} from "zustand/shallow";

interface Props {
    element: ElementMeta,
}

export function EipCard(props: Props) {

    const [setElement, setModalOpen] = useDocumentationStore((s) =>
        [s.setElement, s.setModalOpen], shallow)

    const element = props.element;

    function click (event: React.MouseEvent) {
        setElement(element)
        setModalOpen(true);
    }
    return (
        <Card  isCompact key={element.name} className="documentation-card" onClick={event => click(event)}>
            <CardHeader>
                <Badge className='label-processor'>Processor</Badge>
            </CardHeader>
            <CardHeader>
                {CamelUi.getIconForDslName(element.className)}
                <CardTitle>{element.title}</CardTitle>
            </CardHeader>
            <CardBody>
                <Content component="p">{element.description}</Content>
            </CardBody>
            <CardFooter className="footer-labels">
                <div>
                    {element.labels.split(',').map((s: string,  i: number) => <Badge key={s + i} isRead
                                                                                     className="labels">{s}</Badge>)}
                </div>
            </CardFooter>
        </Card>
    )
}