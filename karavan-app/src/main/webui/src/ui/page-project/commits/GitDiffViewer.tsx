import React, {useMemo} from "react";
import {MonacoDiffEditor} from "@shared/MonacoEditor";
import {useTheme} from "@compass/theme/ThemeContext";

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

        // MonacoDiffEditor disposes the editor and both models on unmount, so no manual teardown here.
        return (
            <div style={{ height: 500, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <MonacoDiffEditor
                    height="100%"
                    original={originalText}
                    modified={modifiedText}
                    theme={isDark ? "vs-dark" : "vs-light"}
                    options={options}
                />
            </div>
        );
    }
