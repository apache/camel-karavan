import React, {JSX, useEffect, useRef, useState} from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTheme} from "@app/theme/ThemeContext";
import {MonacoEditorWrapper} from "@features/project/developer/MonacoEditorWrapper";
import MarkdownPreview, {MarkdownPreviewRef} from "@uiw/react-markdown-preview";
import {Group, Panel, Separator, usePanelRef} from "react-resizable-panels";
import {useDebounceValue} from "usehooks-ts";
import {ErrorBoundaryWrapper} from '@shared/ui/ErrorBoundaryWrapper';
import {defaultEditorOptions} from "@features/project/developer/EditorConfig";

export interface MarkdownEditorProps {
    projectId: string;
    filename: string;
    initialCode?: string;
    onChange?: (value: (string | undefined)) => void;
}

export function MarkdownEditor(props: MarkdownEditorProps): JSX.Element {

    const {projectId, filename, initialCode, onChange} = props;
    const {isDark} = useTheme();
    const [file] = useFileStore((s) => [s.file], shallow)
    const [scrollPercent, setScrollPercent] = useState<number>(0);
    const [debouncedScroll] = useDebounceValue(scrollPercent, 100);
    const previewRef = useRef<MarkdownPreviewRef>(null);
    const ref = usePanelRef();
    const [size, setSize] = useState<number>(10);

    const resizePanel = (size: number | string) => {
        const panel = ref.current;
        if (panel) {
            panel.resize(size);
        }
    };

    useEffect(() => {
        if (previewRef.current) {
            const preview = previewRef.current.mdp.current;
            if (preview) {
                const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
                preview.scrollTop = previewScrollHeight * scrollPercent;
            }
        }
    }, [debouncedScroll]);

    return (
        <Group orientation="horizontal" className='editor-with-preview'>
            <Panel minSize={10} defaultSize={50} panelRef={ref} className='editor-panel' onResize={(panelSize, id, prevPanelSize) => setSize(size)}>
                <MonacoEditorWrapper key={`${projectId}/${filename}`}
                                     language="markdown"
                                     editorOptions={defaultEditorOptions}
                                     onScroll={sp => setScrollPercent(sp)}
                                     onChange={onChange}
                                     initialCode={initialCode}/>
            </Panel>
            <Separator className='resize-handler'/>
            <Panel minSize={10} defaultSize={50} className='preview-panel'>
                <ErrorBoundaryWrapper onError={error => console.error((error))}>
                    <MarkdownPreview key={"MarkdownEditorPreview"} source={file?.code} wrapperElement={{'data-color-mode': isDark ? 'dark' : 'light'}} ref={previewRef}/>
                </ErrorBoundaryWrapper>
            </Panel>
        </Group>
    )
}
