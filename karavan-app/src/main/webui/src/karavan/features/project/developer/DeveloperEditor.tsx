import React, {JSX, useEffect, useState} from 'react';
import {CodeEditor} from "./CodeEditor";
import {MarkdownEditor} from "@features/project/developer/MarkdownEditor";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@features/project/developer/EditorErrorBoundaryWrapper";
import {EditorType} from "@features/project/developer/EditorConfig";
import {useFilesStore, useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useDesignerStore} from "@features/project/designer/DesignerStore";
import {ProjectService} from "@services/ProjectService";
import type * as monaco from "monaco-editor";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@app/navigation/Routes";

export interface DeveloperEditorProps {
    editorType: EditorType;
}

export function DeveloperEditor(props: DeveloperEditorProps): JSX.Element {

    const {editorType} = props
    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)
    const [file, setFile] = useFileStore((s) => [s.file, s.setFile], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [code, setCode] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        setDesignerSwitch(false);
    }, [setDesignerSwitch]);

    useEffect(() => {
        if (file) {
            setCode(file.code);
        }
    }, [file?.projectId, file?.name, file?.code]);

    // Persist changes when code differs from the file's current content
    useEffect(() => {
        if (!file) return;
        if (code === undefined || code?.trim().length === 0) return;
        if (file.code !== code) {
            const updatedFile = {...file, code};
            ProjectService.updateFile(updatedFile, true);
        }
    }, [code]);


    function getEditor() {
        if (editorType === 'markdown' && file) {
            return <MarkdownEditor projectId={file?.projectId} filename={file?.name} initialCode={code} onChange={value => setCode(value ?? '')}/>
        } else if (file) {
            return <CodeEditor projectId={file?.projectId} filename={file?.name} initialCode={code} onChange={value => setCode(value ?? '')} />
        }
    }

    return (
        <div className='editor-manager'>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                {getEditor()}
            </EditorErrorBoundaryWrapper>
        </div>
    )
}