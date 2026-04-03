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
