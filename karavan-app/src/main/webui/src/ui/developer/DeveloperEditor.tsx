import React, {JSX, useEffect, useState} from 'react';
import {CodeEditor} from "./CodeEditor";
import {MarkdownEditor} from "./MarkdownEditor";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@developer/monaco/EditorErrorBoundaryWrapper";
import {GroovyEditor} from "./groovy/GroovyEditor";
import {EditorType} from "@developer/monaco/EditorConfig";
import {useFilesStore, useFileStore} from "@stores/ProjectStore";
import {JSON_SCHEMA_EXTENSION} from "@core/contants";
import {useNavigate} from "react-router-dom";
import {useDebounceCallback} from "usehooks-ts";
import {useDeveloperToggleStore} from "@developer/toggle/useDeveloperToggleStore";

export interface DeveloperEditorProps {
    editorType: EditorType;
}

export function DeveloperEditor(props: DeveloperEditorProps): JSX.Element {

    const {editorType} = props
    const setDeveloperView = useDeveloperToggleStore((s) => s.setDeveloperView)
    const file = useFileStore((s) => s.file)
    const setFile = useFileStore((s) => s.setFile)
    const files = useFilesStore((s) => s.files);
    const backgroundSaveFile = useFilesStore((s) => s.backgroundSaveFile);
    const [code, setCode] = useState<string>(file?.code ?? "");
    const isJsonSchema = file !== undefined && file.name.endsWith(JSON_SCHEMA_EXTENSION);
    const navigate = useNavigate();

    useEffect(() => {
        setDeveloperView('code');
    }, [setDeveloperView]);

    useEffect(() => {
        if (file) {
            setCode(file.code);
        }
    }, [file?.projectId, file?.name]);

    // 2. Create a stable, debounced save function
    const debouncedSave = useDebounceCallback((updatedFile) => {
        backgroundSaveFile(updatedFile);
    }, 500); // 500ms delay after user STOPS typing

    // 3. Handle actual user typing
    function handleCodeChange(newCode: string | undefined) {
        const safeCode = newCode ?? '';
        setCode(safeCode); // Update UI instantly

        if (file && file.code !== safeCode) {
            // Trigger the debounced save. Empty files (safeCode === "") are now perfectly fine!
            const updatedFile = { ...file, code: safeCode };
            debouncedSave(updatedFile);
        }
    }

    function getEditor() {
        if (editorType === 'groovy' && file) {
            return <GroovyEditor processorName={"Script"} filename={file?.name} initialCode={code} onChange={handleCodeChange}/>
        } else if (editorType === 'markdown' && file) {
            return <MarkdownEditor projectId={file?.projectId} filename={file?.name} initialCode={code} onChange={handleCodeChange}/>
        } else if (file) {
            return <CodeEditor projectId={file?.projectId} filename={file?.name} initialCode={code} onChange={handleCodeChange}/>
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