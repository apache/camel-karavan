import React, {useEffect, useRef} from "react";
import type * as monaco from "monaco-editor";
import {IDisposable} from "monaco-editor";
import {MonacoEditor, type MonacoOnMount} from "@shared/MonacoEditor";
import {useTheme} from "@compass/theme/ThemeContext";
import {createEditorOverlayWidget} from "@developer/monaco/EditorOverlayWidget";
import {useAppConfig} from "@compass/useConfig";

export interface MonacoEditorProps {
    language: string;
    onChange?: (value: string | undefined) => void;
    onScroll?: (scrollPercent: number) => void;
    onEditorDidMount?: (editor: monaco.editor.IStandaloneCodeEditor,
                        monacoInstance: typeof monaco) => void;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    height?: string;
    width?: string;
    initialCode?: string;
    contextKeys?: Map<string, boolean>
    contextMenuActions?: monaco.editor.IActionDescriptor[]
    markers?: monaco.editor.IMarkerData[]
    decorations?: monaco.editor.IModelDeltaDecoration[]
    codeActionProvider?: monaco.languages.CodeActionProvider;
    readOnly?: boolean;
    onLinkOpen?: (uri: monaco.Uri) => void;
    title?: string;
    element?: React.JSX.Element
    onBeforeMount?: (monacoInstance: typeof monaco) => void;
    completionProvider?: monaco.languages.CompletionItemProvider;
    inlineCompletionsProvider?: monaco.languages.InlineCompletionsProvider<monaco.languages.InlineCompletions>;
    codeLensProvider?: monaco.languages.CodeLensProvider;
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
                                                                     element,
                                                                     onBeforeMount,
                                                                     inlineCompletionsProvider,
                                                                     codeLensProvider,
                                                                 }) => {
    const {isDark} = useTheme();
    const {isDev} = useAppConfig();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof monaco | null>(null);
    const providerRefCompletionItem = useRef<monaco.IDisposable | null>(null);
    const decorationsCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
    const providerRefCodeAction = useRef<monaco.IDisposable | null>(null);
    const providerRefLinkProvider = useRef<monaco.IDisposable | null>(null);
    const providerRefLinkOpener = useRef<monaco.IDisposable | null>(null);
    const providerRefInlineCompletion = useRef<monaco.IDisposable | null>(null);
    const providerRefCodeLens = useRef<monaco.IDisposable | null>(null);

    useEffect(() => {
        return () => disposeRefs();
    }, [])

    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelMarkers(model, 'validation-owner', markers);
            }
        }
    }, [markers]);

    useEffect(() => {
        decorationsCollectionRef.current?.set(decorations);
    }, [decorations]);

    useEffect(() => {
        if (monacoRef.current) {
            if (inlineCompletionsProvider) {
                providerRefInlineCompletion.current?.dispose();
                providerRefInlineCompletion.current = monacoRef.current.languages.registerInlineCompletionsProvider(language, inlineCompletionsProvider);
            }
            if (codeLensProvider) {
                providerRefCodeLens.current?.dispose();
                providerRefCodeLens.current = monacoRef.current.languages.registerCodeLensProvider(language, codeLensProvider);
            }
        }
    }, [inlineCompletionsProvider, codeLensProvider, language]);

    function disposeRefs() {
        providerRefCompletionItem.current?.dispose();
        providerRefCodeAction.current?.dispose();
        providerRefLinkProvider.current?.dispose();
        providerRefLinkOpener.current?.dispose();
        providerRefInlineCompletion.current?.dispose();
        providerRefCodeLens.current?.dispose();
    }

    const handleBeforeMount = (monacoInstance: typeof monaco) => {
        disposeRefs();

        onBeforeMount?.(monacoInstance);

        if (onLinkOpen) {
            providerRefLinkProvider.current = monacoInstance.languages.registerLinkProvider(language, {
                provideLinks(model) {
                    const text = model.getValue();
                    const links: monaco.languages.ILink[] = [];

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

            providerRefLinkOpener.current = monacoInstance.editor.registerLinkOpener({
                open: (resource) => {
                    if (resource.scheme === 'file' || resource.scheme === 'camel-yaml' || resource.scheme === 'project-file') {
                        onLinkOpen?.(resource);
                        return true;
                    }
                    return false;
                },
            });
        }

        if (completionProvider) {
            const scopedCompletionProvider: monaco.languages.CompletionItemProvider = {
                triggerCharacters: completionProvider.triggerCharacters,
                provideCompletionItems: (model, position, context, tokenSource) => {
                    if (model !== editorRef.current?.getModel()) {
                        return {suggestions: []};
                    }
                    return completionProvider.provideCompletionItems(model, position, context, tokenSource);
                },
                resolveCompletionItem: completionProvider.resolveCompletionItem
                    ? (item, tokenSource) => completionProvider.resolveCompletionItem!(item, tokenSource)
                    : undefined,
            };
            providerRefCompletionItem.current = monacoInstance.languages.registerCompletionItemProvider(language, scopedCompletionProvider);
        }
        if (codeActionProvider) {
            providerRefCodeAction.current = monacoInstance.languages.registerCodeActionProvider(language, codeActionProvider);
        }
        if (inlineCompletionsProvider) {
            providerRefInlineCompletion.current = monacoInstance.languages.registerInlineCompletionsProvider(language, inlineCompletionsProvider);
        }

        if (codeLensProvider) {
            providerRefCodeLens.current = monacoInstance.languages.registerCodeLensProvider(language, codeLensProvider);
        }
    };

    const handleOnMount: MonacoOnMount = (editor: monaco.editor.IStandaloneCodeEditor,
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

        contextKeys.entries().forEach(contextKey => editor.createContextKey(contextKey[0], contextKey[1]));
        const disposables: IDisposable[] = contextMenuActions.map(action => editor.addAction(action));

        const widget = createEditorOverlayWidget(title, element);
        if (title && element) editor.addOverlayWidget(widget)

        return () => {
            disposables.forEach(disposable => disposable?.dispose?.());
            decorationsCollectionRef.current?.clear();
        };
    };

    return (
        <MonacoEditor
            className={'monaco-editor-wrapper'}
            language={language}
            value={initialCode}
            onChange={(value) => onChange?.(value)}
            options={{...editorOptions, readOnly: readOnly || !isDev}}
            height={height}
            width={width}
            theme={isDark ? 'vs-dark' : 'light'}
            beforeMount={handleBeforeMount}
            onMount={handleOnMount}
        />
    );
};