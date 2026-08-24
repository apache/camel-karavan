import React, {useEffect, useMemo, useState} from 'react';
import {EditorErrorBoundaryWrapper} from "@developer/monaco/EditorErrorBoundaryWrapper";
import {GroovyEditor} from "@developer/groovy/GroovyEditor";
import {CodeEditor} from "@developer/CodeEditor";
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useDesignerStore, useIntegrationStore} from "@designer/DesignerStore";
import {CamelDefinitionApiExt} from "@core/api/CamelDefinitionApiExt";
import {ProcessorName} from "@core/model/ExchangeDefinitions";

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

    function getEditor() {
        if (language === 'groovy' && file) {
            const processorName = selectedStep?.dslName.replace('Definition', '') as ProcessorName;
            let paramName: string | undefined = undefined;
            if (['SetVariable', 'SetHeader', 'SetProperty'].includes(processorName)) {
                paramName = (selectedStep as any)?.name
            }
            return <GroovyEditor processorName={processorName} paramName={paramName} filename={file.name} initialCode={customCode} stepId={(selectedStep as any)?.id} onChange={value => onChange(value ?? '')}/>
        } else if (file) {
            return <CodeEditor filename={editorId + "." +language} initialCode={customCode} onChange={value => onChange(value ?? '')}></CodeEditor>
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
