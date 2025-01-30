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
    EmptyState,
    EmptyStateVariant,
    EmptyStateHeader,
    EmptyStateIcon,
    Bullseye
} from '@patternfly/react-core';
import {InfoTabContainer} from "./InfoTabContainer";
import {InfoTabContext} from "./InfoTabContext";
import {InfoTabMemory} from "./InfoTabMemory";
import {shallow} from "zustand/shallow";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {useStatusesStore} from "../api/ProjectStore";

interface Props {
    currentPodName: string
    header?: React.ReactNode
}

export function InformationLog(props: Props): JSX.Element {

    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const camelContainers = containers.filter(cs => cs.containerName === props.currentPodName);

    return (
        <div style={{display: "flex", flexDirection: "column", position: "relative", height: "100%"}}>
            {props.header}
            {camelContainers.map((containerStatus, index) =>
                <Card key={containerStatus.containerId} isFlat isFullHeight>
                    <CardBody>
                        <Flex direction={{default: "row"}}
                              justifyContent={{default: "justifyContentSpaceBetween"}}>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoTabContainer containerStatus={containerStatus}/>
                            </FlexItem>
                            <Divider orientation={{default: "vertical"}}/>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoTabMemory containerStatus={containerStatus}/>
                            </FlexItem>
                            <Divider orientation={{default: "vertical"}}/>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoTabContext containerStatus={containerStatus}/>
                            </FlexItem>
                        </Flex>
                    </CardBody>
                </Card>
            )}
            {camelContainers.length === 0 &&
                <Card>
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
        </div>
    )
}
