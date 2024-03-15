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
    CodeBlock,
    CodeBlockCode,
    DataList,
    DataListCell,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    DataListWrapModifier,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm, Flex,
    Panel,
    PanelHeader,
    PanelMain,
    PanelMainBody, Tab,
    Tabs, TabTitleText, Text, TextContent, TextVariants
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Caption, Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";

interface Props {
    trace: any
}

export function RunnerInfoTraceMessage (props: Props) {

    const [tab, setTab] = useState<string | number>('variables');
    const [variableName, setVariableName] = useState<string | number>();

    const message = props.trace?.message;
    const type = message?.body?.type;
    const headers: any[] = message?.headers ? [...message?.headers] : [];
    const properties: any[] = message?.exchangeProperties ? [...message?.exchangeProperties] : [];
    const variables: any[] = message?.exchangeVariables ? [...message?.exchangeVariables] : [];
    const body = message?.body?.value;
    const variable = variables.filter(v => v.key === variableName)?.at(0);

    function getBody() {
        return (
            <CodeBlock title="Body">
                <CodeBlockCode id="code-content">{body}</CodeBlockCode>
            </CodeBlock>
        )
    }

    function getVariableValue() {
        if (variable?.value !== undefined) {
            const isObject = variable?.value instanceof Object;
            return (
                <CodeBlock title="Body">
                    <CodeBlockCode id="code-content">{isObject ? JSON.stringify(variable.value) : variable.value}</CodeBlockCode>
                </CodeBlock>
            )
        }
    }

    function getVariableType() {
        if (variable?.value !== undefined) {
            return (
                <TextContent className="title">
                    <Flex gap={{default: "gap"}}>
                        <Text component={TextVariants.p}>Type:</Text>
                        <Text component={TextVariants.h6}>{variable.type}</Text>
                    </Flex>
                </TextContent>
            )
        }
    }

    function getHeaders() {
        return (
            <Table aria-label="Simple table" variant={'compact'} borders={true} className='table'>
                <Caption>Exchange message headers</Caption>
                <Thead>
                    <Tr>
                        <Th>Key</Th>
                        <Th>Type</Th>
                        <Th>Value</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {headers.map((header: any, index: number) => (
                        <Tr key={header[0] + "-" + index}>
                            <Td dataLabel={'key'}>{header.key}</Td>
                            <Td dataLabel={'type'}>{header.type}</Td>
                            <Td dataLabel={'value'}>{header.value}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        )
    }

    function getProperties() {
        return (
            <Table aria-label="Simple table" variant={'compact'} borders={true} className='table'>
                <Caption>Exchange message properties</Caption>
                <Thead>
                    <Tr>
                        <Th>Key</Th>
                        <Th>Type</Th>
                        <Th>Value</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {properties.map((header: any, index: number) => (
                        <Tr key={header[0] + "-" + index}>
                            <Td dataLabel={'key'}>{header.key}</Td>
                            <Td dataLabel={'type'}>{header.type}</Td>
                            <Td dataLabel={'value'}>{header.value}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        )
    }

    return (
        <div className="panel2">
            <TextContent className="title">
                <Text component={TextVariants.h3}>Message</Text>
            </TextContent>
            <Tabs activeKey={tab} onSelect={(event, eventKey) => setTab(eventKey)}>
                <Tab eventKey={'variables'} title={<TabTitleText>Variables</TabTitleText>}/>
                <Tab eventKey={'body'} title={<TabTitleText>Body</TabTitleText>}/>
                <Tab eventKey={'headers'} title={<TabTitleText>Headers</TabTitleText>}/>
                <Tab eventKey={'properties'} title={<TabTitleText>Properties</TabTitleText>}/>
            </Tabs>
            {tab === 'variables' && variables.length > 0 &&
                <>
                    <Tabs key={variableName} activeKey={variableName} onSelect={(event, eventKey) => setVariableName(eventKey)}>
                        {variables.map(v => (<Tab eventKey={v.key} title={<TabTitleText>{v.key}</TabTitleText>}/>))}
                    </Tabs>
                    {getVariableType()}
                </>
            }
            <div className="scrollable">
                {tab === 'variables' && getVariableValue()}
                {tab === 'body' && getBody()}
                {tab === 'headers' && getHeaders()}
                {tab === 'properties' && getProperties()}
            </div>
        </div>
    );
}
