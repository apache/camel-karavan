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
    Flex, FlexItem,
    Modal, ModalVariant, DescriptionListGroup, DescriptionListTerm, DescriptionList, Button
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {RunnerInfoTraceNode} from "./RunnerInfoTraceNode";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";

interface Props {
    trace: any
    nodes: any[]
    isOpen: boolean
    onClose: () => void
}

export const RunnerInfoTraceModal = (props: Props) => {

    const [activeNode, setActiveNode] = useState(props.nodes.at(0));

    function getComponent(node: any): any {
        return {name: node.nodeId, component: (<p>Step 1 content</p>) }
    }

    function getRoutes(): any[] {
        return Array.from(new Set((props.nodes).map((item: any) => item?.routeId)));
    }

    return (
        <Modal
            title={"Exchange: " + props.trace?.message?.exchangeId}
            variant={ModalVariant.large}
            isOpen={props.isOpen}
            onClose={() => props.onClose?.call(this)}
            actions={[
            ]}
        >
            <Flex direction={{default: "row"}} justifyContent={{default:"justifyContentSpaceBetween"}}>
                <FlexItem flex={{default: "flex_1"}}>
                    <DescriptionList>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Nodes</DescriptionListTerm>
                        </DescriptionListGroup>
                    </DescriptionList>
                    {props.nodes.map((node: any, index: number) => (
                        <FlexItem key={node.uid + "-" + index}>
                            <Button variant={node.uid === activeNode.uid ? "secondary" : "link"}
                                    icon={node.nodeId === undefined ? <ArrowRightIcon/> : undefined}
                                    onClick={event => {setActiveNode(node)}}>
                                {node.nodeId ? node.nodeId : node.routeId}
                            </Button>
                        </FlexItem>
                    ))}
                </FlexItem>
                <FlexItem flex={{default: "flex_3"}}>
                    <DescriptionList>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Exchange</DescriptionListTerm>
                        </DescriptionListGroup>
                    </DescriptionList>
                    <RunnerInfoTraceNode trace={activeNode} />
                </FlexItem>
            </Flex>
        </Modal>
    );
}
