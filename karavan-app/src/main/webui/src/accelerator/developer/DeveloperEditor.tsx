import React, {JSX, useEffect, useState} from 'react';
import {CodeEditor} from "./CodeEditor";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@/accelerator/developer/EditorErrorBoundaryWrapper";
import {EditorType} from "@/accelerator/developer/EditorConfig";
import {useFilesStore, useFileStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useDesignerStore} from "@/integration-designer/DesignerStore";
import {ProjectService} from "@/api/ProjectService";
import {useDeveloperStore} from "@/accelerator/developer/DeveloperStore";
import {useNavigate} from "react-router-dom";

export interface DeveloperEditorProps {
    editorType: EditorType;
}

export function DeveloperEditor(props: DeveloperEditorProps): JSX.Element {

    const {editorType} = props
    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)
    const {setLoading} = useDeveloperStore()
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

    useEffect(() => {
        return () => {
            setLoading(false)
        }
    }, []);

    // Persist changes when code differs from the file's current content
    useEffect(() => {
        if (!file) return;
        if (code === undefined || code?.trim().length === 0) return;
        if (file.code !== code) {
            const updatedFile = {...file, code};
            ProjectService.updateFile(updatedFile, true);
        }
    }, [code]);


    return (
        <div className='editor-manager'>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                {file && <CodeEditor projectId={file?.projectId} filename={file?.name} initialCode={code} onChange={value => setCode(value ?? '')}/>}
            </EditorErrorBoundaryWrapper>
        </div>
    )
}