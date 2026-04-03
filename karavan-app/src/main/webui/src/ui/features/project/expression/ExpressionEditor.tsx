import React, {useEffect, useMemo, useState} from 'react';
import {EditorErrorBoundaryWrapper} from "@features/project/developer/EditorErrorBoundaryWrapper";
import {CodeEditor} from "../developer/CodeEditor";
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useDesignerStore, useIntegrationStore} from "@features/project/designer/DesignerStore";
import {CamelDefinitionApiExt} from "@core/api/CamelDefinitionApiExt";

interface Props {
    customCode: any,
    onChange: (value: string |undefined) => void,
    title: string,
    dslLanguage?: [string, string, string],
}

export function ExpressionEditor(props: Props) {

    const [file] = useFileStore((s) => [s.file], shallow)
    const [selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow)
    const [integration] = useIntegrationStore((s) => [s.integration], shallow)
    const [customCode, setCustomCode] = useState<string | undefined>();

    const {dslLanguage, onChange} = props;

    useEffect(() => {
        setCustomCode(props.customCode)
    },[]);

    const language = dslLanguage?.[0];

    const editorId = useMemo(() => {
        try {
            if (selectedStep) {
                const route = CamelDefinitionApiExt.findTopRouteElement(integration, selectedStep?.uuid);
                return (route as any).id + "." + (selectedStep as any).id;
            }
        } catch (error: any) {
            console.error(error)
        }
        return "noEditorId";
    }, [selectedStep, integration]);


    return (
        <div className='editor-manager'>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                <CodeEditor filename={editorId + "." +language} initialCode={customCode} onChange={value => onChange(value ?? '')}></CodeEditor>
            </EditorErrorBoundaryWrapper>
        </div>
    )
}
