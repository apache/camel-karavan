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
import {JSON_SCHEMA_EXTENSION} from "@core/contants";
import {useNavigate} from "react-router-dom";
import {YamlEditor} from "@features/project/developer/YamlEditor";

export interface DeveloperEditorProps {
    editorType: EditorType;
}

export function DeveloperEditor(props: DeveloperEditorProps): JSX.Element {

    const {editorType} = props
    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)
    const [file, setFile] = useFileStore((s) => [s.file, s.setFile], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [code, setCode] = useState<string>("");
    const isJsonSchema = file !== undefined && file.name.endsWith(JSON_SCHEMA_EXTENSION);
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
        } else if (editorType === 'yaml' && file) {
            return <YamlEditor projectId={file?.projectId}
                               filename={file?.name}
                               initialCode={code}
                               onChange={value => setCode(value ?? '')}
            />
        } else if (file) {
            return <CodeEditor projectId={file?.projectId} filename={file?.name} initialCode={code} onChange={value => setCode(value ?? '')}/>
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