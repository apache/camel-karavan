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
    Bullseye,
    Button,
    EmptyState,
    EmptyStateIcon,
    EmptyStateVariant, Flex, FlexItem,
    Panel,
    PanelHeader,
    Text,
    Switch, TextContent, TextVariants, PageSection, EmptyStateHeader, Card, CardBody, Divider,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {RunnerInfoTraceModal} from "./RunnerInfoTraceModal";
import {
	Tbody,
	Td,
	Th,
	Thead,
	Tr
} from '@patternfly/react-table';
import {
	Table
} from '@patternfly/react-table/deprecated';
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {InfoContainer} from "../dashboard/InfoContainer";
import {InfoMemory} from "../dashboard/InfoMemory";
import {InfoContext} from "../dashboard/InfoContext";
import {ContainerStatus} from "../../api/ProjectModels";

interface Props {
    containerName?: string
}

export function TraceTable (props: Props) {

    const [refreshTrace, camelTraces] = useProjectStore((state) =>
        [state.refreshTrace, state.camelTraces], shallow);
    const [nodes, setNodes] = useState([{}]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [exchangeId, setExchangeId] = useState<string>('');

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

    const camelStatus = camelTraces.filter(s => s.containerName === props.containerName).at(0);
    const traceValue = camelStatus?.statuses?.filter(x => x.name === 'trace').at(0);
    const trace: any = traceValue ? JSON.parse(traceValue?.status || '') : {};

    const traces: any[] = (trace?.trace?.traces || []).sort((a: any, b: any) => b.uid > a.uid ? 1 : -1);
    const exchanges: any[] = Array.from(new Set((traces).map((item: any) => item?.message?.exchangeId)));
    return (
        <>
            {isOpen && <RunnerInfoTraceModal isOpen={isOpen} exchangeId={exchangeId} nodes={nodes} onClose={closeModal}/>}
            <Table aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='uid' width={30}>UID</Th>
                        <Th key='exchangeId' width={40}>ExchangeId</Th>
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
                                <Button className="dev-action-button" style={{padding: '0'}} variant={"link"}
                                        onClick={e => {
                                            setExchangeId(exchangeId);
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
                                    <EmptyState variant={EmptyStateVariant.sm}>
                                        <EmptyStateHeader titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2" />
                                    </EmptyState>
                                </Bullseye>
                            </Td>
                        </Tr>
                    }
                </Tbody>
            </Table>
        </>
    );
}
