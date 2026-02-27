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
import React, {useMemo} from 'react';
import {defaultEditorOptions} from "@features/project/developer/EditorConfig";
import {MonacoEditorWrapper} from "@features/project/developer/MonacoEditorWrapper";
import {Group, Panel} from "react-resizable-panels";
import type * as monaco from "monaco-editor";

const LANG_MAP: Record<string, string> = {
    sh: "shell",
    md: "markdown",
    properties: "ini",
    groovy: "java",
    yml: "yaml",
    json: "json",
};

export interface CodeEditorProps {
    projectId?: string;
    filename: string;
    initialCode?: string;
    language?: string;
    onChange?: (value: (string | undefined)) => void;
    onLinkOpen?: (uri: monaco.Uri) => void;
}

export function CodeEditor(props: CodeEditorProps) {

    const {projectId, filename, initialCode, onChange, language, onLinkOpen} = props;

    const lang = language ?? useMemo(() => {
        const ext = filename?.split(".").pop()?.toLowerCase();
        return (ext && (LANG_MAP[ext] ?? ext)) || "text";
    }, [filename]);

    return (
        <Group orientation="horizontal" className='editor-with-preview' style={{paddingTop: 6}}>
            <Panel minSize={100} className='editor-panel'>
                <MonacoEditorWrapper key={`${projectId}/${filename}`}
                                     language={lang ?? 'text'}
                                     editorOptions={{...defaultEditorOptions, minimap: {enabled: true}}}
                                     initialCode={initialCode}
                                     onLinkOpen={onLinkOpen}
                                     onChange={onChange}
                />
            </Panel>
        </Group>
    )
}
