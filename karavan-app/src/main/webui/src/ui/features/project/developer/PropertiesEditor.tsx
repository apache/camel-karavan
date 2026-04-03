import React, {useEffect, useRef, useState} from 'react';
import './PropertiesEditor.css';
import '@shared/monaco-setup';
import {Range} from '@shared/monaco-setup';
import type * as monaco from "monaco-editor";
import {ProjectService} from "@services/ProjectService";
import {shallow} from "zustand/shallow";
import {useDesignerStore} from "@features/project/designer/DesignerStore";
import {MonacoEditorWrapper} from "@features/project/developer/MonacoEditorWrapper";
import {defaultEditorOptions} from "@features/project/developer/EditorConfig";
import {useFileStore} from "@stores/ProjectStore";
import {CodeUtils} from "@util/CodeUtils";
import {capitalize} from "@patternfly/react-core";
import {Group} from "react-resizable-panels";

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown'],
    ['properties', 'ini']
])

interface LineInfo {
    newText?: string;
    marker?: monaco.editor.IMarkerData;
    action: 'replace' | 'remove';
}

export function PropertiesEditor() {

    const [file] = useFileStore((s) => [s.file], shallow);
    const [code, setCode] = useState<string>();
    const [markers, setMarkers] = useState<monaco.editor.IMarkerData[]>([]);
    const [decorations, setDecorations] = useState<monaco.editor.IModelDeltaDecoration[]>([])
    const [isEditorMounted, setIsEditorMounted] = useState<boolean>(false);
    const lineInfoRef = useRef<Map<number, LineInfo>>(new Map());
    const replaceAllCommandIdRef = useRef<string | null>(null);

    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)

    useEffect(() => {
        setDesignerSwitch(false);
    }, [file]);

    useEffect(() => {
        const interval = setInterval(() => {
            saveCode();
        }, 400);
        return () => {
            clearInterval(interval);
            saveCode();
        }
    }, [code]);

    function saveCode() {
        if (file && code && file.code !== code) {
            file.code = code;
            ProjectService.updateFile(file, true);
        }
    }

    const extension = file?.name.split('.').pop();
    const language = extension && languages.has(extension) ? languages.get(extension) : extension;

    const contextKeys: Map<string, boolean> = new Map<string, boolean>(
        [['sortPropertiesHandle', true]]
    )

    const propertiesActionProvider: monaco.languages.CodeActionProvider = {
        provideCodeActions: (model, range, context, token) => {
            const replaceAllCommandId = replaceAllCommandIdRef.current;
            if (!replaceAllCommandId) return { actions: [], dispose: () => {} };

            const currentCode = model.getValue(); // entire editor content
            const actions: monaco.languages.CodeAction[] = [];
            // Find markers that we can provide fixes for
            context.markers.forEach(error => {
                const lineNumber = error.startLineNumber;
                const lineInfo = lineInfoRef.current.get(lineNumber)
                const message = error.message;
                if (lineInfo) {
                    const title = `${capitalize(lineInfo.action)} property` + (lineInfo.action === 'replace' ? ` with ${lineInfo.newText}` : '');
                    const edit: monaco.languages.IWorkspaceTextEdit | monaco.languages.IWorkspaceFileEdit =
                        lineInfo.action === 'replace'
                        ? {
                            resource: model.uri,
                            textEdit: {
                                range: new Range(error.startLineNumber, error.startColumn, error.endLineNumber, error.endColumn),
                                text: lineInfo.newText,
                                insertAsSnippet: false
                            } as monaco.languages.TextEdit & {
                                insertAsSnippet?: boolean;
                            },
                            versionId: undefined
                        }
                        : {
                            resource: model.uri,
                            textEdit: {
                                range: new Range(error.startLineNumber, 1, error.startLineNumber + 1, 1),
                                text: "",
                                insertAsSnippet: false
                            } as monaco.languages.TextEdit & {
                                insertAsSnippet?: boolean;
                            },
                            versionId: undefined
                        }
                    actions.push({
                        title: title,
                        kind: "quickfix",
                        isPreferred: true,
                        diagnostics: [error],
                        edit: {
                            edits: [edit]
                        }
                    });
                    if (lineInfo.action === 'replace') {
                        actions.push({
                            title: 'Replace all',
                            kind: "quickfix",
                            isPreferred: true,
                            diagnostics: [error],
                            command: {
                                id: replaceAllCommandId,
                                title: "Replace all",
                                arguments: [currentCode]
                            }
                        });
                    }
                }
            });

            return {
                actions: actions,
                dispose: () => {}
            };
        }
    };


    function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) {
        setIsEditorMounted(true);
        replaceAllCommandIdRef.current = editor.addCommand(0, (...args: any[]) => {
            const [_, currentCode] = args;
            const newCode = CodeUtils.getReplaceAllPropertiesNames(currentCode ?? '');
            setCode(newCode);
        })
    }

    return (
        <Group orientation="horizontal" className='editor-with-preview' style={{paddingTop: 6}}>
            {file !== undefined && <MonacoEditorWrapper key={`${file.projectId}/${file.name}`}
                                                        language={language || 'ini'}
                                                        editorOptions={defaultEditorOptions}
                                                        initialCode={code}
                                                        onEditorDidMount={handleEditorDidMount}
                                                        contextKeys={contextKeys}
                                                        onChange={value => setCode(value)}
                                                        markers={markers}
                                                        decorations={decorations}
                                                        codeActionProvider={propertiesActionProvider}
            />}
        </Group>
    )
}
