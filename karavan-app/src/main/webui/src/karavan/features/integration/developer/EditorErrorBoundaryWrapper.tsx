import React, {ReactNode} from "react";
import {Alert} from "@patternfly/react-core";
import * as monaco from "monaco-editor";
import {MonacoEditorWrapper} from "@features/integration/developer/MonacoEditorWrapper";

export interface EditorErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: {enabled: false},
    scrollBeyondLastLine: false,
    scrollbar: {
        useShadows: false,
    },
    selectOnLineNumbers: true,
    automaticLayout: true,
    lineNumbers: "on",
    folding: false,
    lineNumbersMinChars: 3,
    showUnused: false,
    fontSize: 12,
    fixedOverflowWidgets: false,
    suggest: {
        showKeywords: false,
        showStatusBar: true,
        showIcons: true,
        preview: true,
        showSnippets: true,
    },
};

interface ErrorBoundaryProps {
    children: ReactNode;
    onError: (error: Error) => void;
}

export class EditorErrorBoundaryWrapper extends React.Component<ErrorBoundaryProps, EditorErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Handle error (logging, etc.)
        console.error("Error caught in ErrorBoundary:", error, errorInfo);
        this.props.onError(error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="editor-error">
                    <Alert title="Error" variant='danger' style={{margin: 8}}>Something went wrong: {this.state.error?.message}</Alert>
                    <MonacoEditorWrapper language="text" editorOptions={editorOptions} />
                </div>
            )
        }
        return this.props.children;
    }
}
