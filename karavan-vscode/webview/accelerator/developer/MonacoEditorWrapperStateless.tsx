import React, {useEffect, useRef, useState} from "react";
import '@/monaco-setup';
import type * as monaco from "monaco-editor";
import Editor, {OnMount} from "@monaco-editor/react";
import {useTheme} from "@/main/ThemeContext";
import {useDebounceValue} from "usehooks-ts";
import {defaultEditorOptions} from "@/accelerator/developer/EditorConfig";

const MIN_HEIGHT = 100; // px
const MAX_HEIGHT = 400; // px

export interface MonacoEditorProps {
    language: string;
    onChange?: (value: string | undefined) => void;
    onDidBlurEditorText?: () => void;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    height?: string;
    width?: string;
    initialCode: string;
    completionProvider?: monaco.languages.CompletionItemProvider;
}

export const MonacoEditorWrapperStateless: React.FC<MonacoEditorProps> = ({
                                                                              language,
                                                                              onChange,
                                                                              editorOptions,
                                                                              height,
                                                                              width = "100%",
                                                                              completionProvider, initialCode,onDidBlurEditorText
                                                                          }) => {
    const {isDark} = useTheme();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const providerRefCompletionItem = useRef<monaco.IDisposable | null>(null);
    const [autoHeight, setAutoHeight] = useState(MIN_HEIGHT);
    const [code, setCode] = useState<string | undefined>(initialCode);
    const [debouncedCode] = useDebounceValue(code, 300);

    useEffect(() => {
        return () => disposeRefs();
    }, [])

    useEffect(() => {
        onChange?.(debouncedCode);
    }, [debouncedCode]);

    useEffect(() => {
        return () => disposeRefs();
    }, [])

    function disposeRefs() {
        providerRefCompletionItem.current?.dispose();
    }

    const handleEditorWillMount = (monacoInstance: typeof monaco) => {
        if (completionProvider) {
            disposeRefs();
            monacoInstance.languages.registerCompletionItemProvider(language, completionProvider);
        }
    };

    const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
        editorRef.current = editor;
        resizeEditor();

        editor.onDidContentSizeChange(() => {
            resizeEditor();
        });

        editor.onDidBlurEditorText(() => {
            onDidBlurEditorText?.()
        });
    };

    const resizeEditor = () => {
        if (!editorRef.current) return;

        const contentHeight = editorRef.current.getContentHeight();
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, contentHeight));

        setAutoHeight(newHeight);
        editorRef.current.layout({width: editorRef.current.getLayoutInfo().width, height: newHeight});
    };

    return (
        <Editor className={'monaco-editor-wrapper-stateless'}
                defaultLanguage={language}
                value={code}
                onChange={(value, ev) => setCode(value)}
                options={editorOptions || defaultEditorOptions}
                height={height ?? autoHeight}
                width={width}
                theme={isDark ? 'vs-dark' : 'light'}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
        />
    );
};
