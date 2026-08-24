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
import React, {JSX, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {MonacoEditorWrapper} from "../monaco/MonacoEditorWrapper";
import {useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {defaultEditorOptions} from "@developer/monaco/EditorConfig";
import * as monaco from 'monaco-editor';
import {ProcessorName} from "@core/model/ExchangeDefinitions";
import {Group} from "react-resizable-panels";

export interface GroovyEditorProps {
    processorName: ProcessorName;
    paramName?: string;
    filename: string;
    stepId?: string;
    initialCode?: string;
    onChange?: (value: string | undefined) => void;
    onLinkOpen?: (uri: monaco.Uri) => void;
}

export function GroovyEditor(props: GroovyEditorProps): JSX.Element {
    const {filename, initialCode, onChange, onLinkOpen} = props;
    const [project] = useProjectStore((s) => [s.project], shallow);

    function onCodeChange(code: string | undefined) {
        onChange?.(code);
    }


    return (
        <Group orientation="horizontal" className='editor-with-preview' key={'groovyEditorKey'}>
                <MonacoEditorWrapper
                    key={`${project.projectId}/${filename}`}
                    language="groovy"
                    editorOptions={defaultEditorOptions}
                    initialCode={initialCode}
                    onChange={onCodeChange}
                    onLinkOpen={onLinkOpen}
                />
            {/*</Panel>*/}
        </Group>
    )
}