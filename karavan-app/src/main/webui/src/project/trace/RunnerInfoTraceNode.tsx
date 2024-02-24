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
    CodeBlock, CodeBlockCode, DataList, DataListCell, DataListItem, DataListItemCells, DataListItemRow, DataListWrapModifier,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm, Panel, PanelHeader, PanelMain, PanelMainBody
} from '@patternfly/react-core';
import '../../designer/karavan.css';

interface Props {
    trace: any
}

export function RunnerInfoTraceNode (props: Props) {

    const type = props.trace?.message?.body?.type;
    const body = props.trace?.message?.body?.value;
    const headers: any[] = [...props.trace?.message?.headers];
    return (
        <Panel isScrollable>
                <PanelMain tabIndex={0}>
                    <PanelHeader>
                        <DescriptionList isHorizontal>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Headers</DescriptionListTerm>
                            </DescriptionListGroup>
                            <DataList aria-label="Compact data list example" isCompact>
                                {headers.map((header: any, index: number) => (
                                    <DataListItem key={header[0] + "-" + index} aria-labelledby="compact-item1">
                                        <DataListItemRow>
                                            <DataListItemCells
                                                dataListCells={[
                                                    <DataListCell key="uid" >{header.key}</DataListCell>,
                                                    <DataListCell key="type">{header.type}</DataListCell>,
                                                    <DataListCell key="routeId" wrapModifier={DataListWrapModifier.truncate}>
                                                        {header.value}
                                                    </DataListCell>,
                                                ]}
                                            />
                                        </DataListItemRow>
                                    </DataListItem>))}
                            </DataList>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Body</DescriptionListTerm>
                                <DescriptionListDescription>
                                    {type}
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    </PanelHeader>
                    <PanelMainBody style={{padding: "0"}}>
                        <CodeBlock title="Body">
                            <CodeBlockCode id="code-content">{body}</CodeBlockCode>
                        </CodeBlock>
                    </PanelMainBody>
                </PanelMain>
            </Panel>
    );
}
