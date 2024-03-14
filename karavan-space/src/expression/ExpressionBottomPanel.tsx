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
import {ClipboardCopy, Text, TextContent} from '@patternfly/react-core';
import './ExpressionModalEditor.css'
import {Table, Tbody, Td, Tr} from "@patternfly/react-table";
import {Context, ExpressionFunctions, ExpressionVariables} from "./ExpressionContextModel";

interface Props {
    dslLanguage?: [string, string, string],
}

export function ExpressionBottomPanel(props: Props) {

    const {dslLanguage} = props;
    const language = dslLanguage?.[0];
    const vars: Context[] = ExpressionVariables.filter(e => e.name === language)?.[0]?.information || [];
    const funcs: Context[] = ExpressionFunctions.filter(e => e.name === language)?.at(0)?.information || []
    const showVars = vars.length > 0;
    const showFuncs = funcs.length > 0;

    function getRows(data: Context[]) {
        return (
            data?.map((context, index, array) =>
                <Tr key={index} style={{padding: '0'}}>
                    <Td style={{padding: '0px 0px 6px 0px'}} modifier='fitContent'>
                        <ClipboardCopy key={index} hoverTip="Copy" clickTip="Copied"
                                       variant="inline-compact">
                            {context.key}
                        </ClipboardCopy>
                    </Td>
                    <Td style={{padding: '0px 0px 0px 16px'}}>
                        {context.value}
                    </Td>
                </Tr>
            )
        )
    }

    function getRowHeader(data: string) {
        return (
            <Tr key='vars' style={{padding: '0'}}>
                <Td style={{padding: '16px 6px 6px 0px'}}>
                    <TextContent>
                        <Text component='h3'>{data}</Text>
                    </TextContent>
                </Td>
            </Tr>
        )
    }

    return (
        <div className='context'>
            <div className='context-column'>
                <Table variant='compact' borders={false}>
                    <Tbody>
                        {showVars && getRowHeader('Variables')}
                        {showVars && getRows(vars)}
                        {showFuncs && getRowHeader('Functions')}
                        {showFuncs && getRows(funcs)}
                    </Tbody>
                </Table>
            </div>
        </div>
    )
}
