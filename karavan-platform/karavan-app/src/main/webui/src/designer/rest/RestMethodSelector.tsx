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
    Card, CardBody, CardFooter, CardHeader, Gallery, PageSection,
    Tab, Tabs, TabTitleText,
    Text
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";

interface Props {
    onMethodSelect: (method: DslMetaModel) => void
    dark: boolean
}

interface State {
}

export class RestMethodSelector extends React.Component<Props, State> {

    public state: State = {};


    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        this.setState({tabIndex: eventKey})
    }


    selectMethod = (evt: React.MouseEvent, method: any) => {
        evt.stopPropagation()
        this.props.onMethodSelect.call(this, method);
    }

    getCard(dsl: DslMetaModel, index: number) {
        return (
            <Card key={dsl.dsl + index} isHoverable isCompact className="dsl-card"
                  onClick={event => this.selectMethod(event, dsl)}>
                <CardHeader>
                    {CamelUi.getIconForDsl(dsl)}
                    <Text>{dsl.title}</Text>
                </CardHeader>
                <CardBody>
                    <Text>{dsl.description}</Text>
                </CardBody>
                <CardFooter>
                    {dsl.navigation.toLowerCase() === "kamelet"
                        && <div className="footer" style={{justifyContent: "space-between"}}>
                            <Badge isRead className="labels">{dsl.labels}</Badge>
                            <Badge isRead className="version">{dsl.version}</Badge>
                        </div>}
                    {dsl.navigation.toLowerCase() === "component"
                        && <div className="footer" style={{justifyContent: "flex-start"}}>
                            {dsl.labels.split(',').map((s: string) => <Badge key={s} isRead className="labels">{s}</Badge>)}
                        </div>}
                </CardFooter>
            </Card>
        )
    }

    render() {
        return (
            <PageSection variant={this.props.dark ? "darker" : "light"}>
                <Tabs style={{overflow: 'hidden'}} activeKey="methods" onSelect={this.selectTab}>
                        <Tab eventKey="methods" title={<TabTitleText>Methods</TabTitleText>}>
                            <Gallery hasGutter className="dsl-gallery">
                                {CamelUi.getSelectorRestMethodModels().map((dsl: DslMetaModel, index: number) => this.getCard(dsl, index))}
                            </Gallery>
                        </Tab>
                </Tabs>
            </PageSection>
        );
    }
}