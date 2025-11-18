import * as monaco from "monaco-editor";

export type EditorType = 'groovy' | 'sql' | 'json' | 'yaml' | 'markdown' | 'xml'

export const defaultEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: {enabled: false},
    scrollBeyondLastLine: false,
    scrollbar: {
        useShadows: false,
    },
    selectOnLineNumbers: true,
    automaticLayout: true,
    lineNumbers: "on",
    folding: true,
    lineNumbersMinChars: 3,
    showUnused: false,
    fontSize: 12,
    fixedOverflowWidgets: false,
    suggest: {
        showKeywords: true,
        showStatusBar: true,
        showIcons: true,
        preview: true,
        showSnippets: true,
    },
};