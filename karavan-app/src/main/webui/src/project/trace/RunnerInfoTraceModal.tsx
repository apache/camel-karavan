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
    Modal,
    ModalVariant,
    JumpLinksItem,
    JumpLinks,
    TextContent, TextVariants, Text
} from '@patternfly/react-core';
import './trace.css';
import {RunnerInfoTraceMessage} from "./RunnerInfoTraceMessage";

interface Props {
    exchangeId: string
    nodes: any[]
    isOpen: boolean
    onClose: () => void
}

export function RunnerInfoTraceModal (props: Props) {

    const [activeNode, setActiveNode] = useState(props.nodes.at(0));

    return (
        <Modal
            title={"Exchange: " + props.exchangeId}
            width={"90%"}
            className="trace-modal"
            variant={ModalVariant.large}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            actions={[]}
        >
            <div className="container">
                <div className="panel1">
                    <TextContent className="title">
                        <Text component={TextVariants.h3}>Nodes</Text>
                    </TextContent>
                    <div className="scrollable">
                        <JumpLinks isVertical>
                            {[...props.nodes].map((node: any, index: number) => (
                                <JumpLinksItem key={node.uid + "-" + index}
                                               isActive={node.uid === activeNode.uid}
                                               onClick={_ => {setActiveNode(node)}}>
                                    {node.nodeId ? node.nodeId : node.routeId}
                                </JumpLinksItem>
                            ))}
                            {/*{Array.from(Array(100).keys())*/}
                            {/*    .map(_ => (<JumpLinksItem>Inactive section</JumpLinksItem>))}*/}
                        </JumpLinks>
                    </div>
                </div>
                <RunnerInfoTraceMessage trace={activeNode}/>
            </div>
        </Modal>
    );
}
