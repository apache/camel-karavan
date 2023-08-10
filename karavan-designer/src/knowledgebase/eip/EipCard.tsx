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
    CardHeader, Card, CardTitle, CardBody, CardFooter,Badge
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {CamelUi} from "../../designer/utils/CamelUi";
import {ElementMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    element: ElementMeta,
    onClickCard: any
}

interface State {
    element: ElementMeta,
}

export class EipCard extends React.Component<Props, State> {

    public state: State = {
        element: this.props.element
    };

    click = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.onClickCard.call(this, this.state.element);
    }

    render() {
        const component = this.state.element;
        return (
            <Card  isCompact key={component.name} className="kamelet-card"
                onClick={event => this.click(event)}
            >
                <CardHeader>
                </CardHeader>
                <CardHeader>
                    {CamelUi.getIconForDslName(component.className)}
                    <CardTitle>{component.title}</CardTitle>
                </CardHeader>
                <CardBody>{component.description}</CardBody>
                <CardFooter className="footer-labels">
                    <div>
                        {component.labels.split(',').map((s: string,  i: number) => <Badge key={s + i} isRead
                                                                                     className="labels">{s}</Badge>)}
                    </div>
                </CardFooter>
            </Card>
        )
    }
};