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

import React, {useState} from 'react';
import {
    Button, Flex, FlexItem,
    PageSection, Switch, Tab, Tabs, Text,
    TextContent,
    Toolbar,
    ToolbarContent,
    ToolbarItem
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../designer/MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {EventBus} from "../designer/utils/EventBus";

interface Props {
    dark: boolean,
}

export const ConfigurationPage = (props: Props) => {

    const [tab, setTab] = useState<string | number>("statuses");

    function tools() {
        return (<Toolbar id="toolbar-group-types">
            <ToolbarContent>
                {tab === 'statuses' && <ToolbarItem>
                    <Button className="dev-action-button" onClick={event => {
                        KaravanApi.deleteAllStatuses(res => {
                            if (res.status === 200) {
                                EventBus.sendAlert('Success', 'Statuses deleted', "info");
                                KaravanApi.restartInformers(res1 => {
                                    if (res1.status === 200) {
                                        EventBus.sendAlert('Success', 'Informers restarted', "info");
                                    }
                                })
                            }
                        })
                    }}>
                        Cleanup statuses
                    </Button>
                </ToolbarItem>}
                {tab === 'secrets' && <ToolbarItem>
                    <Button>Add Secret</Button>
                </ToolbarItem>}
                {tab === 'configMaps' && <ToolbarItem>
                    <Button>Add ConfigMap</Button>
                </ToolbarItem>}
            </ToolbarContent>
        </Toolbar>);
    }

    function title() {
        return (<TextContent>
            <Text component="h2">Configuration</Text>
        </TextContent>);
    }

    return (
        <PageSection className="container-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={tools()}/>
            </PageSection>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    <FlexItem className="knowledge-tabs">
                        <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                            <Tab eventKey="statuses" title="Statuses"/>
                            <Tab eventKey="secrets" title="Secrets" isDisabled/>
                            <Tab eventKey="configMaps" title="ConfigMaps" isDisabled/>
                        </Tabs>
                    </FlexItem>
                </Flex>
            </PageSection>
            <PageSection isFilled className="container-page-section">

            </PageSection>
        </PageSection>
    )
}