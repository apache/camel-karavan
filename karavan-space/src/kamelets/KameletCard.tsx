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
import '../designer/karavan.css';
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {CamelUi} from "../designer/utils/CamelUi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";

interface Props {
    kamelet: KameletModel,
    onClickCard: any
}

interface State {
    kamelet: KameletModel,
}

export class KameletCard extends React.Component<Props, State> {

    public state: State = {
        kamelet: this.props.kamelet
    };

    click = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.onClickCard.call(this, this.state.kamelet);
    }

    render() {
        const kamelet = this.state.kamelet;
        const isCustom = KameletApi.getCustomKameletNames().includes(kamelet.metadata.name);
        return (
            <Card isHoverable isCompact key={kamelet.metadata.name} className="kamelet-card"
                  onClick={event => this.click(event)}
            >
                <CardHeader className="header-labels">
                    {isCustom && <Badge className="custom">custom</Badge>}
                    <Badge isRead className="support-level labels">{kamelet.metadata.annotations["camel.apache.org/kamelet.support.level"]}</Badge>
                </CardHeader>
                <CardHeader>
                    {CamelUi.getIconFromSource(kamelet.icon())}
                    <CardTitle>{kamelet.spec.definition.title}</CardTitle>
                </CardHeader>
                <CardBody>{kamelet.spec.definition.description}</CardBody>
                <CardFooter className="footer-labels">
                    <Badge isRead className="labels">{kamelet.metadata.labels["camel.apache.org/kamelet.type"].toLowerCase()}</Badge>
                    <Badge isRead className="version labels">{kamelet.metadata.annotations["camel.apache.org/catalog.version"].toLowerCase()}</Badge>
                    {/*</div>*/}
                </CardFooter>
            </Card>
        );
    }
};