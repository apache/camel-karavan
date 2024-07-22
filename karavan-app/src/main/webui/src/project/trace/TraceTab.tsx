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
    Flex,
    FlexItem,
    Panel,
    PanelHeader,
    Text,
    Switch,
    TextContent,
    TextVariants,
    PageSection,
    ToggleGroup, ToggleGroupItem,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {TraceTable} from "./TraceTable";

export function TraceTab() {

    const [project, refreshTrace, setRefreshTrace] = useProjectStore((state) =>
        [state.project, state.refreshTrace, state.setRefreshTrace], shallow);
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [containerName, setContainerName] = useState<string>();

    const camelContainers = containers
        .filter(c => c.projectId === project.projectId && ['devmode', 'project'].includes(c.type));

    function getContainer() {
        return containerName ? containerName : camelContainers.at(0)?.containerName;
    }

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <Panel>
                <PanelHeader>
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem>
                            <Flex direction={{default: "row"}}>
                                <FlexItem>
                                    <TextContent>
                                        <Text component={TextVariants.h6}>Container</Text>
                                    </TextContent>
                                </FlexItem>
                                <FlexItem>
                                    <ToggleGroup>
                                        {camelContainers.map((containerStatus, index) =>
                                            <ToggleGroupItem
                                                text={containerStatus.containerName}
                                                isSelected={getContainer() === containerStatus.containerName}
                                                onChange={(_, selected) => {
                                                    if (selected) {
                                                        setContainerName(containerStatus.containerName);
                                                    }
                                                }}
                                            />
                                        )}
                                    </ToggleGroup>
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                        <FlexItem>
                            <Flex direction={{default: "row"}}>
                                <FlexItem>
                                    <TextContent>
                                        <Text component={TextVariants.h6}>Auto refresh</Text>
                                    </TextContent>
                                </FlexItem>
                                <FlexItem>
                                    <Switch aria-label="refresh"
                                            id="refresh"
                                            isChecked={refreshTrace}
                                            onChange={(_, checked) => setRefreshTrace(checked)}
                                    />
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                    </Flex>
                </PanelHeader>
            </Panel>
            <TraceTable containerName={getContainer()}/>
        </PageSection>
    )
}
