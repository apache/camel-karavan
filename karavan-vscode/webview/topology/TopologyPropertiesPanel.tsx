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
import '../designer/karavan.css';
import {shallow} from "zustand/shallow";
import {TopologySideBar} from "@patternfly/react-topology";
import {useTopologyStore} from "./TopologyStore";
import {DslProperties} from "../designer/property/DslProperties";
import {
    Button, DescriptionList,
    DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
    Flex,
    FlexItem, Panel, PanelHeader, PanelMain, PanelMainBody,
    Text, TextContent, TextVariants,
    Tooltip,
    TooltipPosition
} from "@patternfly/react-core";
import CloseIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

interface Props {
    onSetFile: (fileName: string) => void
}

export function TopologyPropertiesPanel(props: Props) {

    const [selectedIds, setSelectedIds, fileName, nodeData] = useTopologyStore((s) =>
        [s.selectedIds, s.setSelectedIds, s.fileName, s.nodeData], shallow);

    function isRoute() {
        if (nodeData && nodeData.type === 'route') {
            const uri: string = nodeData?.step?.from.uri || '';
            return uri !== undefined;
        }
        return false;
    }

    function isKamelet() {
        if (nodeData && nodeData.type === 'step') {
            const uri: string = nodeData?.step?.uri || '';
            return uri.startsWith("kamelet");
        }
        return false;
    }

    function getFromInfo() {
        if (isRoute()) {
            const uri: string = nodeData?.step?.from.uri || '';
            const name: string = nodeData?.step?.from.parameters?.name || '';
            if (['direct','seda'].includes(uri)) {
                return uri.concat(":").concat(name);
            } else {
                return uri;
            }
        }
        return ""
    }

    function getTitle () {
        return isRoute() ? "Route" : (isKamelet() ? "Kamelet" : "Component");
    }

    function getHeader() {
        return (
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                <FlexItem spacer={{ default: 'spacerNone' }}>
                    <Panel>
                        <PanelHeader>
                            <TextContent>
                                <Text component={TextVariants.h3}>{getTitle()}</Text>
                            </TextContent>
                        </PanelHeader>
                        <PanelMain>
                            <PanelMainBody>
                                <DescriptionList isHorizontal>
                                    <DescriptionListGroup>
                                        <DescriptionListTerm>File</DescriptionListTerm>
                                        <DescriptionListDescription>
                                            <Button className="file-button" variant="link" onClick={_ => {
                                                if (fileName) {
                                                    props.onSetFile(fileName);
                                                }
                                            }}>{fileName}
                                            </Button>
                                        </DescriptionListDescription>
                                    </DescriptionListGroup>
                                    {isRoute() && <DescriptionListGroup>
                                        <DescriptionListTerm>From</DescriptionListTerm>
                                        <DescriptionListDescription>{getFromInfo()}</DescriptionListDescription>
                                    </DescriptionListGroup>}
                                </DescriptionList>
                            </PanelMainBody>
                        </PanelMain>
                    </Panel>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                    <Tooltip content={"Close"} position={TooltipPosition.top}>
                        <Button variant="link" icon={<CloseIcon/>} onClick={event => setSelectedIds([])}/>
                    </Tooltip>
                </FlexItem>
            </Flex>
        )
    }

    return (
        <TopologySideBar
            className="topology-sidebar"
            show={selectedIds.length > 0}
            header={getHeader()}
        >
            <DslProperties designerType={'routes'}/>
        </TopologySideBar>
    )
}
