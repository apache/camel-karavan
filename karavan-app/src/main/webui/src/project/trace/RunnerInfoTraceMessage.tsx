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
import React, {useMemo, useState} from 'react';
import {
    CodeBlock,
    CodeBlockCode, Flex,
    Tab,
    Tabs, TabTitleText, Text, TextContent, TextVariants
} from '@patternfly/react-core';
import '../../designer/karavan.css';

interface Props {
    trace: any
}

export function RunnerInfoTraceMessage (props: Props) {

    const [tab, setTab] = useState<string>('variables');
    const [valueName, setValueName] = useState<string>();

    const message = props.trace?.message;
    const data: Record<string, any[]> = {
        headers: message?.headers ? [...message?.headers] : [],
        properties: message?.exchangeProperties ? [...message?.exchangeProperties] : [],
        variables: message?.exchangeVariables ? [...message?.exchangeVariables] : [],
    }
    const body = message?.body?.value;
    const values = useMemo(() => (data[tab] ?? []), [tab, data]);
    const value = useMemo(() => values.filter(v => v.key === valueName)?.at(0), [tab, values, valueName]);

    function getBody() {
        return (
            <CodeBlock title="Body">
                <CodeBlockCode id="code-content">{body}</CodeBlockCode>
            </CodeBlock>
        )
    }

    function getValueValue() {
        if (value?.value !== undefined) {
            const isObject = value?.value instanceof Object;
            return (
                <CodeBlock title="Body">
                    <CodeBlockCode id="code-content">{isObject ? JSON.stringify(value.value) : value.value}</CodeBlockCode>
                </CodeBlock>
            )
        }
    }

    function getValueType() {
        if (value !== undefined) {
            return (
                <TextContent className="title">
                    <Flex gap={{default: "gap"}}>
                        <Text component={TextVariants.p}>Type:</Text>
                        <Text component={TextVariants.h6}>{value.type}</Text>
                    </Flex>
                </TextContent>
            )
        }
    }

    return (
        <div className="panel2">
            <TextContent className="title">
                <Text component={TextVariants.h3}>Message</Text>
            </TextContent>
            <Tabs activeKey={tab} onSelect={(event, eventKey) => setTab(eventKey.toString())}>
                <Tab eventKey={'variables'} title={<TabTitleText>Variables</TabTitleText>}/>
                <Tab eventKey={'body'} title={<TabTitleText>Body</TabTitleText>}/>
                <Tab eventKey={'headers'} title={<TabTitleText>Headers</TabTitleText>}/>
                <Tab eventKey={'properties'} title={<TabTitleText>Properties</TabTitleText>}/>
            </Tabs>
            {['variables', 'headers', 'properties'].includes(tab) && values.length > 0 &&
                <>
                    <Tabs key={valueName} activeKey={valueName} onSelect={(event, eventKey) => setValueName(eventKey.toString())}>
                        {values.map(v => (<Tab eventKey={v.key} title={<TabTitleText>{v.key}</TabTitleText>}/>))}
                    </Tabs>
                    {getValueType()}
                </>
            }
            <div className="scrollable">
                {tab === 'body' && getBody()}
                {['variables', 'headers', 'properties'].includes(tab) && getValueValue()}
            </div>
        </div>
    );
}
