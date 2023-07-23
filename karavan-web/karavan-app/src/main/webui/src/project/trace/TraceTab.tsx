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
import React, {useEffect, useState} from 'react';
import {
    Bullseye,
    Button,
    EmptyState,
    EmptyStateIcon,
    EmptyStateVariant, Flex, FlexItem,
    Panel,
    PanelHeader,
    Text,
    Switch, TextContent, TextVariants, Title, PageSection,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {RunnerInfoTraceModal} from "./RunnerInfoTraceModal";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {KaravanApi} from "../../api/KaravanApi";
import {useProjectStore} from "../../api/ProjectStore";


export const TraceTab = () => {

    const {project} = useProjectStore();
    const [trace, setTrace] = useState<any>({});
    const [nodes, setNodes] = useState([{}]);
    const [isOpen, setIsOpen] = useState(false);
    const [refreshTrace, setRefreshTrace] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 1000);
        return () => {
            clearInterval(interval)
        };
    }, [refreshTrace]);


    function onRefreshStatus() {
        const projectId = project.projectId;
        if (refreshTrace) {
            KaravanApi.getDevModeStatus(projectId, "trace", res => {
                if (res.status === 200) {
                    console.log(JSON.parse(res.data.status))
                    setTrace(JSON.parse(res.data.status));
                } else {
                    setTrace({});
                }
            })
        }
    }

    function closeModal() {
        setIsOpen(false);
    }

    function getNodes(exchangeId: string): any[] {
        const traces: any[] = trace?.trace?.traces || [];
        return traces
            .filter(t => t.message?.exchangeId === exchangeId)
            .sort((a, b) => a.uid > b.uid ? 1 : -1);
    }

    function getNode(exchangeId: string): any {
        const traces: any[] = trace?.trace?.traces || [];
        return traces
            .filter(t => t.message?.exchangeId === exchangeId)
            .sort((a, b) => a.uid > b.uid ? 1 : -1)
            .at(0);
    }

    const traces: any[] = (trace?.trace?.traces || []).sort((a: any, b: any) => b.uid > a.uid ? 1 : -1);
    const exchanges: any[] = Array.from(new Set((traces).map((item: any) => item?.message?.exchangeId)));
    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            {isOpen && <RunnerInfoTraceModal isOpen={isOpen} trace={trace} nodes={nodes} onClose={closeModal}/>}
            <Panel>
                <PanelHeader>
                    <Flex direction={{default: "row"}} justifyContent={{default:"justifyContentFlexEnd"}}>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h6}>Auto refresh</Text>
                            </TextContent>
                        </FlexItem>
                        <FlexItem>
                            <Switch aria-label="refresh"
                                    id="refresh"
                                    isChecked={refreshTrace}
                                    onChange={checked => setRefreshTrace(checked)}
                            />
                        </FlexItem>
                    </Flex>
                </PanelHeader>
            </Panel>
            <TableComposable aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='uid' width={30}>Type</Th>
                        <Th key='exchangeId' width={40}>Filename</Th>
                        <Th key='timestamp' width={30}>Updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {exchanges.map(exchangeId => {
                        const node = getNode(exchangeId);
                        return <Tr key={node?.uid}>
                            <Td>
                                {node?.uid}
                            </Td>
                            <Td>
                                <Button style={{padding: '0'}} variant={"link"}
                                        onClick={e => {
                                            setTrace(trace);
                                            setNodes(getNodes(exchangeId));
                                            setIsOpen(true);
                                        }}>
                                    {exchangeId}
                                </Button>
                            </Td>
                            <Td>
                                {node ? new Date(node?.timestamp).toISOString() : ""}
                            </Td>

                        </Tr>
                    })}
                    {exchanges.length === 0 &&
                        <Tr>
                            <Td colSpan={8}>
                                <Bullseye>
                                    <EmptyState variant={EmptyStateVariant.small}>
                                        <EmptyStateIcon icon={SearchIcon}/>
                                        <Title headingLevel="h2" size="lg">
                                            No results found
                                        </Title>
                                    </EmptyState>
                                </Bullseye>
                            </Td>
                        </Tr>
                    }
                </Tbody>
            </TableComposable>
        </PageSection>
    );
}
