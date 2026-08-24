import React, {JSX, useEffect, useRef, useState} from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTheme} from "@compass/theme/ThemeContext";
import {MonacoEditorWrapper} from "./monaco/MonacoEditorWrapper";
import MarkdownPreview, {MarkdownPreviewRef} from "@uiw/react-markdown-preview";
import {usePanelRef} from "react-resizable-panels";
import {useDebounceValue} from "usehooks-ts";
import {ErrorBoundaryWrapper} from '@shared/ui/ErrorBoundaryWrapper';
import {defaultEditorOptions} from "@developer/monaco/EditorConfig";
import {useDeveloperToggleStore} from "@developer/toggle/useDeveloperToggleStore";

export interface MarkdownEditorProps {
    projectId: string;
    filename: string;
    initialCode?: string;
    onChange?: (value: (string | undefined)) => void;
}

export function MarkdownEditor(props: MarkdownEditorProps): JSX.Element {

    const {projectId, filename, initialCode, onChange} = props;
    const {isDark} = useTheme();
    const [file] = useFileStore((s) => [s.file], shallow);
    const developerView = useDeveloperToggleStore((s) => s.developerView)
    const [scrollPercent, setScrollPercent] = useState<number>(0);
    const [debouncedScroll] = useDebounceValue(scrollPercent, 100);
    const previewRef = useRef<MarkdownPreviewRef>(null);
    const ref = usePanelRef();

    useEffect(() => {
        if (previewRef.current) {
            const preview = previewRef.current.mdp.current;
            if (preview) {
                const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
                preview.scrollTop = previewScrollHeight * scrollPercent;
            }
        }
    }, [debouncedScroll]);

    return developerView === 'preview'
        ? <ErrorBoundaryWrapper onError={error => console.error(error)}>
            <div style={{overflowY: "auto"}}>
                <MarkdownPreview
                    components={{
                        a: ({ node, ...props }) => {
                            if (props.className?.includes('anchor')) {
                                return null;
                            }
                            return <a {...props}>{props.children}</a>;
                        }
                    }}
                    style={{padding: 8}}
                    key={"MarkdownEditorPreview"}
                    source={file?.code}
                    wrapperElement={{'data-color-mode': isDark ? 'dark' : 'light'}}
                    ref={previewRef}
                />
            </div>
        </ErrorBoundaryWrapper>
        : <MonacoEditorWrapper
            key={`${projectId}/${filename}`}
            language="markdown"
            editorOptions={defaultEditorOptions}
            onScroll={sp => setScrollPercent(sp)}
            onChange={onChange}
            initialCode={initialCode}
        />
}