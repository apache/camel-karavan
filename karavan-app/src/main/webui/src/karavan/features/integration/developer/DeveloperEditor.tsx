import React, {JSX, useEffect, useState} from 'react';
import {CodeEditor} from "./CodeEditor";
import './DeveloperManager.css'
import { useDesignerStore } from "../designer/DesignerStore";
import {useDeveloperStore } from "@stores/DeveloperStore";
import {shallow} from "zustand/shallow";
import {useFileStore} from "@stores/ProjectStore";
import {ProjectService} from "@services/ProjectService";
import {EditorErrorBoundaryWrapper} from "@features/integration/developer/EditorErrorBoundaryWrapper";

function DeveloperEditor(): JSX.Element {

    const [setDesignerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch], shallow)
    const {setLoading} = useDeveloperStore()
    const [file] = useFileStore((s) => [s.file], shallow)
    const [code, setCode] = useState<string>("");

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

export default DeveloperEditor