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
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";

interface Props {
    onMethodSelect: (method: DslMetaModel) => void
}

export function RestMethodSelector(props: Props) {

    const [dark] = useDesignerStore((s) => [s.dark], shallow)

    function selectMethod (evt: React.MouseEvent, method: any) {
        evt.stopPropagation()
        props.onMethodSelect(method);
    }

    function getCard(dsl: DslMetaModel, index: number) {
        return (
            <Card key={dsl.dsl + index}  isCompact className="dsl-card"
                  onClick={event => selectMethod(event, dsl)}>
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

    return (
        <PageSection variant={dark ? "darker" : "light"}>
            <Tabs style={{overflow: 'hidden'}} activeKey="methods" onSelect={event => {}}>
                <Tab eventKey="methods" title={<TabTitleText>Methods</TabTitleText>}>
                    <Gallery hasGutter className="dsl-gallery">
                        {CamelUi.getSelectorRestMethodModels().map((dsl: DslMetaModel, index: number) => getCard(dsl, index))}
                    </Gallery>
                </Tab>
            </Tabs>
        </PageSection>
    )
}