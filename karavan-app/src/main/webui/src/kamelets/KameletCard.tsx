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
        return (
            <Card isHoverable isCompact key={kamelet.metadata.name} className="kamelet-card"
                onClick={event => this.click(event)}
            >
                <CardHeader>
                    {CamelUi.getIconFromSource(kamelet.icon())}
                </CardHeader>
                <CardTitle>{CamelUi.titleFromName(kamelet.metadata.name)}</CardTitle>
                <CardBody>{kamelet.spec.definition.description}</CardBody>
                <CardFooter>
                    {/*<div style={{justifyContent: "space-between"}}>*/}
                        <Badge isRead className="labels">{kamelet.metadata.labels["camel.apache.org/kamelet.type"].toLowerCase()}</Badge>
                        <Badge isRead className="version">{kamelet.metadata.annotations["camel.apache.org/catalog.version"].toLowerCase()}</Badge>
                    {/*</div>*/}
                </CardFooter>
            </Card>
        );
    }
};