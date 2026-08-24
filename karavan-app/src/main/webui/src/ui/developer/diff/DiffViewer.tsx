import React, {JSX, useEffect, useMemo, useState} from 'react';
import './DiffViewer.css'
import {EditorErrorBoundaryWrapper} from "@developer/monaco/EditorErrorBoundaryWrapper";
import {useFileStore} from "@stores/ProjectStore";
import {MonacoDiffEditor} from "@shared/MonacoEditor";
import {useTheme} from "@compass/theme/ThemeContext";

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown'],
    ['properties', 'ini']
])

export function DiffViewer(): JSX.Element {

    const { isDark } = useTheme();
    const file = useFileStore((s) => s.file)
    const fetchCommitedFile = useFileStore((s) => s.fetchCommitedFile)
    const fileCommited = useFileStore((s) => s.fileCommited)
    const [code, setCode] = useState<string>(file?.code ?? "");

    useEffect(() => {
        if (file) {
            fetchCommitedFile(file).then(_ => setCode(file.code))
        }
    }, [file?.projectId, file?.name, file?.lastUpdate]);

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

    const extension = file?.name.split('.').pop();
    const language = extension && languages.has(extension) ? languages.get(extension) : extension;

    return (
        <div className='diff-viewer'>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                <MonacoDiffEditor
                    height="100%"
                    language={language}
                    original={fileCommited?.code || ''}
                    modified={code || ''}
                    theme={isDark ? "vs-dark" : "vs-light"}
                    options={options}
                />
            </EditorErrorBoundaryWrapper>
        </div>
    )
}