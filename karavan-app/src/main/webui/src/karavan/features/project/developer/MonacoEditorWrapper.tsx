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
import React, {useEffect, useRef, useState} from "react";
import '@shared/monaco-setup';
import type * as monaco from "monaco-editor";
import {IDisposable} from "monaco-editor";
import Editor, {OnMount} from "@monaco-editor/react";
import {useTheme} from "@app/theme/ThemeContext";
import {useDebounceValue} from "usehooks-ts";
import {Spinner} from "@patternfly/react-core";
import {createEditorOverlayWidget} from "./EditorOverlayWidget";


export interface MonacoEditorProps {
    language: string;
    onChange?: (value: string | undefined) => void;
    onScroll?: (scrollPercent: number) => void;
    onEditorDidMount?: (editor: monaco.editor.IStandaloneCodeEditor,
                        monacoInstance: typeof monaco) => void;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    height?: string;
    width?: string;
    completionProvider?: monaco.languages.CompletionItemProvider;
    initialCode?: string;
    contextKeys?: Map<string, boolean>
    contextMenuActions?: monaco.editor.IActionDescriptor[]
    markers?: monaco.editor.IMarkerData[]
    decorations?: monaco.editor.IModelDeltaDecoration[]
    codeActionProvider?: monaco.languages.CodeActionProvider;
    readOnly?: boolean;
    onLinkOpen?: (uri: monaco.Uri) => void;
    title?: string;
    onBeforeMount?: (monacoInstance: typeof monaco) => void;
}

export const MonacoEditorWrapper: React.FC<MonacoEditorProps> = ({
                                                                     language,
                                                                     onChange,
                                                                     editorOptions,
                                                                     height = "100%",
                                                                     width = "100%",
                                                                     completionProvider,
                                                                     initialCode,
                                                                     onScroll,
                                                                     contextKeys = new Map<string, boolean>(),
                                                                     onEditorDidMount,
                                                                     contextMenuActions = [],
                                                                     markers = [],
                                                                     decorations = [],
                                                                     codeActionProvider,
                                                                     readOnly = false,
                                                                     onLinkOpen,
                                                                     title,
                                                                     onBeforeMount
                                                                 }) => {
    const {isDark} = useTheme();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof monaco | null>(null);
    const providerRefCompletionItem = useRef<monaco.IDisposable | null>(null);
    const decorationsCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
    const providerRefCodeAction = useRef<monaco.IDisposable | null>(null);
    const [code, setCode] = useState<string | undefined>(initialCode);
    const [debouncedCode] = useDebounceValue(code, 300);
    const providerRefLinkProvider = useRef<monaco.IDisposable | null>(null);
    const providerRefLinkOpener = useRef<monaco.IDisposable | null>(null);

    useEffect(() => {
        return () => disposeRefs();
    }, [])

    useEffect(() => {
        onChange?.(debouncedCode);
    }, [debouncedCode]);

    useEffect(() => {
        setCode(initialCode);
    }, [initialCode]);

    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                // The 'owner' is a unique string that identifies your error source
                monacoRef.current.editor.setModelMarkers(model, 'validation-owner', markers);
            }
        }
    }, [markers]);

    useEffect(() => {
        decorationsCollectionRef.current?.set(decorations);
    }, [decorations]);


    function disposeRefs() {
        providerRefCompletionItem.current?.dispose();
        providerRefCodeAction.current?.dispose();
        providerRefLinkProvider.current?.dispose();
        providerRefLinkOpener.current?.dispose();
    }

    const handleBeforeMount = (monacoInstance: typeof monaco) => {
        disposeRefs();

        onBeforeMount?.(monacoInstance);
        
        if (onLinkOpen) {
            providerRefLinkProvider.current = monacoInstance.languages.registerLinkProvider(language, {
                provideLinks(model) {
                    const text = model.getValue();
                    const links: monaco.languages.ILink[] = [];
                    // Matches things like "$ref": "./file.schema.json"
                    const refRegex = /\$ref"\s*:\s*"((?:\.{1,2}\/)[^"#]+\.json(?:#[^"]*)?)"/g;

                    for (const match of text.matchAll(refRegex)) {
                        const startIdx = (match.index ?? 0) + match[0].indexOf(match[1]);
                        const endIdx = startIdx + match[1].length;
                        const start = model.getPositionAt(startIdx);
                        const end = model.getPositionAt(endIdx);

                        links.push({
                            range: new monacoInstance.Range(
                                start.lineNumber, start.column,
                                end.lineNumber, end.column
                            ),
                            url: monacoInstance.Uri.parse(match[1]),
                            tooltip: `Open schema ${match[1]}`,
                        });
                    }

                    return {links};
                },
            });

            // --- Intercept clicks on those schema links ---
            providerRefLinkOpener.current = monacoInstance.editor.registerLinkOpener({
                open: (resource) => {
                    if (resource.scheme === 'file') {
                        onLinkOpen?.(resource);
                        return true; // handled by us
                    }
                    return false;
                },
            });
        }

        if (completionProvider) {
            providerRefCompletionItem.current = monacoInstance.languages.registerCompletionItemProvider(language, completionProvider);
        }
        if (codeActionProvider) {
            providerRefCodeAction.current = monacoInstance.languages.registerCodeActionProvider(language, codeActionProvider);
        }
    };

    const handleOnMount: OnMount = (editor: monaco.editor.IStandaloneCodeEditor,
                                           monacoInstance: typeof monaco) => {
        editorRef.current = editor;
        monacoRef.current = monacoInstance;
        decorationsCollectionRef.current = editor.createDecorationsCollection();
        onEditorDidMount?.(editor, monacoInstance);

        editor.onDidScrollChange(() => {
            const current = editorRef.current;
            if (!current) return;
            const scrollTop = current.getScrollTop();
            const scrollHeight = current.getScrollHeight();
            const clientHeight = current.getDomNode()?.clientHeight || 1;
            const scrollPercent = scrollTop / (scrollHeight - clientHeight);
            onScroll?.(scrollPercent);
        });

        // Add a context keys
        contextKeys.entries().forEach(contextKey => editor.createContextKey(contextKey[0], contextKey[1]));
        // Add a context-menu action
        const disposables: IDisposable[] = contextMenuActions.map(action => editor.addAction(action));

        const widget = createEditorOverlayWidget(title);
        editor.addOverlayWidget(widget);

        // Clean up on unmount
        return () => {
            disposables.forEach(disposable => disposable?.dispose?.());
            // Clear all decorations when component unmounts
            decorationsCollectionRef.current?.clear();
        };
    };

    return (
        <Editor className={'monaco-editor-wrapper'}
                loading={<Spinner/>}
                defaultLanguage={language}
                value={code}
                onChange={(value, ev) => setCode(value)}
                options={{...editorOptions, readOnly}}
                height={height}
                width={width}
                theme={isDark ? 'vs-dark' : 'light'}
                beforeMount={handleBeforeMount}
                onMount={handleOnMount}
        />
    );
};
