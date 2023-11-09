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
    Card,
    CardBody,
    Flex,
    FlexItem,
    Divider,
    PageSection,
    EmptyState,
    EmptyStateVariant,
    EmptyStateHeader,
    EmptyStateIcon,
    Bullseye, Panel
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {InfoContainer} from "./InfoContainer";
import {InfoContext} from "./InfoContext";
import {InfoMemory} from "./InfoMemory";
import {useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";

export function DashboardTab() {

    const [project, camelStatuses] = useProjectStore((state) =>
        [state.project, state.camelStatuses], shallow);
    const [containers] = useStatusesStore((state) => [state.containers], shallow);

    const camelContainers = containers
        .filter(c => c.projectId === project.projectId && ['devmode', 'project'].includes(c.type));

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            {camelContainers.map((containerStatus, index) =>
                <Card className="dashboard-card" key={containerStatus.containerId}>
                    <CardBody>
                        <Flex direction={{default: "row"}}
                              justifyContent={{default: "justifyContentSpaceBetween"}}>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoContainer containerStatus={containerStatus}/>
                            </FlexItem>
                            <Divider orientation={{default: "vertical"}}/>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoMemory containerStatus={containerStatus}/>
                            </FlexItem>
                            <Divider orientation={{default: "vertical"}}/>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoContext containerStatus={containerStatus}/>
                            </FlexItem>
                        </Flex>
                    </CardBody>
                </Card>
            )}
            {camelContainers.length === 0 &&
                <Card className="project-development">
                    <CardBody>
                        <Bullseye>
                            <EmptyState variant={EmptyStateVariant.sm}>
                                <EmptyStateHeader titleText="No running containers"
                                                  icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2"/>
                            </EmptyState>
                        </Bullseye>
                    </CardBody>
                </Card>
            }
        </PageSection>
    )
}
