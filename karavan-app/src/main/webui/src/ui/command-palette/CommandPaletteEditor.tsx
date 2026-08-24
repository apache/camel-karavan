import React, {useEffect, useRef, useState} from 'react';
import './CommandPaletteEditor.css';
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {useDebounceValue} from 'usehooks-ts';
import {MonacoEditorWrapper} from "@developer/monaco/MonacoEditorWrapper";
import type * as monaco from "monaco-editor";

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    scrollbar: {
        useShadows: false,
        vertical: 'auto',
        horizontal: 'hidden'
    },
    selectOnLineNumbers: true,
    automaticLayout: true,
    lineNumbers: "off",
    folding: false,
    lineNumbersMinChars: 0,
    showUnused: false,
    fontSize: 12,
    fixedOverflowWidgets: false,
    wordWrap: "on",
    wordBasedSuggestions: "off",
    quickSuggestions: false,
    snippetSuggestions: "none",
    suggestOnTriggerCharacters: false,
    suggest: {
        showKeywords: false,
        showStatusBar: false,
        showIcons: false,
        preview: false,
        showSnippets: false,
    },
};

const LINE_HEIGHT = 18;
const MIN_LINES = 3;
const MIN_HEIGHT = LINE_HEIGHT * MIN_LINES;

function clampHeight(contentHeight: number, minHeight: number, maxHeight: number) {
    return Math.min(maxHeight, Math.max(minHeight, contentHeight));
}

export function CommandPaletteEditor() {
    const parentDsl = useCommandPaletteStore((s) => s.parentDsl);
    const setStoreFilter = useCommandPaletteStore((s) => s.setFilter);
    const [editorReady, setEditorReady] = useState(false);
    const [localFilter, setLocalFilter] = useState('');
    const [debouncedFilter] = useDebounceValue(localFilter, 300);

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const hasAppliedTemplate = useRef(false);
    const isPastedContent = useRef(false);

    useEffect(() => {
        setStoreFilter(debouncedFilter);
    }, [debouncedFilter, setStoreFilter]);

    function onChange(value: string) {
        setLocalFilter(value || '');
    }

    const elementType = parentDsl === undefined || parentDsl === '' ? 'starting' : 'next';
    const camelStepsPlaceholder = "Search " + elementType + " step from the list below 👇";
    let placeholderText = camelStepsPlaceholder;

    // The editor always starts empty - templates are applied through executeEdits
    const isEditorEmpty = localFilter.trim().length === 0;

    return (
        <div className={"command-palette-editor"}>
            {isEditorEmpty && (
                <div className={"empty-editor-overlay"}>{placeholderText}</div>
            )}
            <MonacoEditorWrapper
                key={'modal-special-focus'}
                height={`${MIN_HEIGHT}px`}
                language="markdown"
                editorOptions={editorOptions}
                initialCode={""}
                onChange={(value) => onChange(value?.toString() || "")}
            />
        </div>
    );
}