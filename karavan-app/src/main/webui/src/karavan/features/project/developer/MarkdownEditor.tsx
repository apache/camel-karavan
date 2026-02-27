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
import React, {JSX, useEffect, useRef, useState} from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTheme} from "@app/theme/ThemeContext";
import {MonacoEditorWrapper} from "@features/project/developer/MonacoEditorWrapper";
import MarkdownPreview, {MarkdownPreviewRef} from "@uiw/react-markdown-preview";
import {Group, Panel, Separator} from "react-resizable-panels";
import {useDebounceValue} from "usehooks-ts";
import {ErrorBoundaryWrapper} from '@shared/ui/ErrorBoundaryWrapper';
import {defaultEditorOptions} from "@features/project/developer/EditorConfig";

export interface MarkdownEditorProps {
    projectId: string;
    filename: string;
    initialCode?: string;
    onChange?: (value: (string | undefined)) => void;
}

export function MarkdownEditor(props: MarkdownEditorProps): JSX.Element {

    const {projectId, filename, initialCode, onChange} = props;
    const {isDark} = useTheme();
    const [file] = useFileStore((s) => [s.file], shallow)
    const [scrollPercent, setScrollPercent] = useState<number>(0);
    const [debouncedScroll] = useDebounceValue(scrollPercent, 100);
    const previewRef = useRef<MarkdownPreviewRef>(null);

    useEffect(() => {
        if (previewRef.current) {
            const preview = previewRef.current.mdp.current;
            if (preview) {
                const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
                preview.scrollTop = previewScrollHeight * scrollPercent;
            }
        }
    }, [debouncedScroll]);

    return (
        <Group orientation="horizontal" className='editor-with-preview'>
            <Panel minSize={10} defaultSize={50} className='editor-panel'>
                <MonacoEditorWrapper key={`${projectId}/${filename}`}
                                     language="markdown"
                                     editorOptions={defaultEditorOptions}
                                     onScroll={sp => setScrollPercent(sp)}
                                     onChange={onChange}
                                     initialCode={initialCode}/>
            </Panel>
            <Separator className='resize-handler'/>
            <Panel minSize={10} defaultSize={50} className='preview-panel'>
                <ErrorBoundaryWrapper onError={error => console.error((error))}>
                    <MarkdownPreview key={"MarkdownEditorPreview"} source={file?.code} wrapperElement={{'data-color-mode': isDark ? 'dark' : 'light'}} ref={previewRef}/>
                </ErrorBoundaryWrapper>
            </Panel>
        </Group>
    )
}
