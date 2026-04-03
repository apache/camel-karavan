import React, {useMemo, useRef} from "react";
import {DiffEditor} from "@monaco-editor/react";
import {useTheme} from "@app/theme/ThemeContext";

type Props = {
    originalText?: string;
    modifiedText?: string;
};

export default function GitDiffViewer({
                                          originalText = "",
                                          modifiedText = "",
                                      }: Props) {
    const options = useMemo(
        () => ({
            readOnly: true,
            renderSideBySide: true, // set false for inline diff
            minimap: { enabled: false },
            wordWrap: "on" as const,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            // makes it feel more "diff-like"
            renderIndicators: true,
        }),
        []
    );
        const { isDark } = useTheme();
        const editorRef = useRef<any>(null);

        const handleEditorDidMount = (editor: any) => {
            editorRef.current = editor;
        };

        React.useEffect(() => {
            return () => {
                if (editorRef.current) {
                    editorRef.current.setModel(null);
                }
            };
        }, []);

        return (
            <div style={{ height: 500, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <DiffEditor
                    onMount={handleEditorDidMount}
                    height="100%"
                    original={originalText}
                    modified={modifiedText}
                    theme={isDark ? "vs-dark" : "vs-light"}
                    options={options}
                />
            </div>
        );
    }