import React, {useEffect, useRef} from "react";
// Side-effect import: wires up self.MonacoEnvironment before any editor is created.
import '@shared/monaco-setup';
import * as monaco from "monaco-editor";

/**
 * Native Monaco bindings for React 19.
 *
 * Replaces @monaco-editor/react (unmaintained, and its `loader` indirection kept us pinned to an
 * old monaco). Monaco is bundled by Vite, so there is nothing to load asynchronously: the editor
 * is created on mount and disposed on unmount, and every prop that can change while mounted has
 * its own effect.
 *
 * React 19: no forwardRef. Pass `editorRef` as a plain prop when a call site needs the instance.
 */

/**
 * Same two-level DOM @monaco-editor/react rendered: a sized, positioned wrapper plus an inner
 * element that carries `className` and hosts the editor. Existing stylesheets target the inner
 * element (.monaco-editor-wrapper, .example-editor, …) and some position overlays against the
 * wrapper, so flattening this would change their layout.
 */
const WRAPPER_STYLE: React.CSSProperties = {display: 'flex', position: 'relative', textAlign: 'initial'};
const INNER_STYLE: React.CSSProperties = {width: '100%'};

export type MonacoBeforeMount = (monacoInstance: typeof monaco) => void;

/** Returning a function from onMount registers it as an extra disposer, run before the editor is disposed. */
export type MonacoOnMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
) => void | (() => void);

export type MonacoDiffOnMount = (
    editor: monaco.editor.IStandaloneDiffEditor,
    monacoInstance: typeof monaco,
) => void | (() => void);

export interface MonacoEditorProps {
    value?: string;
    language?: string;
    /** Monaco themes are global; the last editor to render a new theme wins. */
    theme?: string;
    onChange?: (value: string | undefined, event: monaco.editor.IModelContentChangedEvent) => void;
    options?: monaco.editor.IStandaloneEditorConstructionOptions;
    height?: string | number;
    width?: string | number;
    className?: string;
    beforeMount?: MonacoBeforeMount;
    onMount?: MonacoOnMount;
    editorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {

    const {value, language, theme, options, height = '100%', width = '100%', className, editorRef} = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    // Set while we push an external `value` into the model, so we don't echo it back through onChange.
    const applyingValueRef = useRef(false);

    // The create effect must run exactly once, so it reads callbacks through a ref instead of deps.
    const latestRef = useRef(props);
    latestRef.current = props;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const {beforeMount, onMount} = latestRef.current;
        beforeMount?.(monaco);

        const editor = monaco.editor.create(container, {
            value: latestRef.current.value ?? '',
            language: latestRef.current.language,
            theme: latestRef.current.theme,
            // Default on so the editor follows our resizable panels; an explicit option still wins.
            automaticLayout: true,
            ...latestRef.current.options,
        });
        instanceRef.current = editor;
        if (editorRef) editorRef.current = editor;

        const contentSubscription = editor.onDidChangeModelContent(event => {
            if (applyingValueRef.current) return;
            latestRef.current.onChange?.(editor.getValue(), event);
        });

        const mountDisposer = onMount?.(editor, monaco);

        return () => {
            if (typeof mountDisposer === 'function') mountDisposer();
            contentSubscription.dispose();
            // The editor owns the model it created from `value`, so dispose() takes it with it.
            editor.dispose();
            instanceRef.current = null;
            if (editorRef) editorRef.current = null;
        };
    }, []);

    useEffect(() => {
        const editor = instanceRef.current;
        const model = editor?.getModel();
        if (!editor || !model || value === undefined || model.getValue() === value) return;

        applyingValueRef.current = true;
        try {
            // A full-range edit rather than setValue: keeps the cursor, selection and undo stack.
            editor.pushUndoStop();
            model.pushEditOperations(
                [],
                [{range: model.getFullModelRange(), text: value}],
                () => null,
            );
            editor.pushUndoStop();
        } finally {
            applyingValueRef.current = false;
        }
    }, [value]);

    useEffect(() => {
        const model = instanceRef.current?.getModel();
        if (model && language && model.getLanguageId() !== language) {
            monaco.editor.setModelLanguage(model, language);
        }
    }, [language]);

    useEffect(() => {
        if (theme) monaco.editor.setTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (options) instanceRef.current?.updateOptions(options);
    }, [options]);

    return (
        <section style={{...WRAPPER_STYLE, width, height}}>
            <div ref={containerRef} className={className} style={INNER_STYLE}/>
        </section>
    );
};

export interface MonacoDiffEditorProps {
    original?: string;
    modified?: string;
    /** Applied to both sides unless originalLanguage/modifiedLanguage override it. */
    language?: string;
    originalLanguage?: string;
    modifiedLanguage?: string;
    theme?: string;
    options?: monaco.editor.IStandaloneDiffEditorConstructionOptions;
    height?: string | number;
    width?: string | number;
    className?: string;
    onMount?: MonacoDiffOnMount;
    editorRef?: React.RefObject<monaco.editor.IStandaloneDiffEditor | null>;
}

export const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = (props) => {

    const {
        original, modified, language, originalLanguage, modifiedLanguage, theme, options,
        height = '100%', width = '100%', className, editorRef,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
    const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
    const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

    const latestRef = useRef(props);
    latestRef.current = props;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const current = latestRef.current;
        const editor = monaco.editor.createDiffEditor(container, {
            theme: current.theme,
            automaticLayout: true,
            ...current.options,
        });
        instanceRef.current = editor;
        if (editorRef) editorRef.current = editor;

        // Diff editors never own their models, so we create and dispose them ourselves.
        const originalModel = monaco.editor.createModel(
            current.original ?? '', current.originalLanguage ?? current.language);
        const modifiedModel = monaco.editor.createModel(
            current.modified ?? '', current.modifiedLanguage ?? current.language);
        originalModelRef.current = originalModel;
        modifiedModelRef.current = modifiedModel;
        editor.setModel({original: originalModel, modified: modifiedModel});

        const mountDisposer = current.onMount?.(editor, monaco);

        return () => {
            if (typeof mountDisposer === 'function') mountDisposer();
            editor.setModel(null);
            editor.dispose();
            originalModel.dispose();
            modifiedModel.dispose();
            instanceRef.current = null;
            originalModelRef.current = null;
            modifiedModelRef.current = null;
            if (editorRef) editorRef.current = null;
        };
    }, []);

    useEffect(() => {
        const model = originalModelRef.current;
        const safeOriginal = original ?? '';
        if (model && original !== undefined && model.getValue() !== safeOriginal) {
            model.setValue(safeOriginal);
        }
    }, [original]);

    useEffect(() => {
        const model = modifiedModelRef.current;
        const safeModified = modified ?? '';
        if (model && modified !== undefined && model.getValue() !== safeModified) {
            model.setValue(safeModified);
        }
    }, [modified]);

    useEffect(() => {
        const left = originalLanguage ?? language;
        const right = modifiedLanguage ?? language;
        if (originalModelRef.current && left) monaco.editor.setModelLanguage(originalModelRef.current, left);
        if (modifiedModelRef.current && right) monaco.editor.setModelLanguage(modifiedModelRef.current, right);
    }, [language, originalLanguage, modifiedLanguage]);

    useEffect(() => {
        if (theme) monaco.editor.setTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (options) instanceRef.current?.updateOptions(options);
    }, [options]);

    return (
        <section style={{...WRAPPER_STYLE, width, height}}>
            <div ref={containerRef} className={className} style={INNER_STYLE}/>
        </section>
    );
};