import React from 'react';
import {useFileStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {DesignerEditor} from "./DesignerEditor";
import {useDesignerStore} from "@/designer/DesignerStore";
import './DeveloperManager.css'
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {APPLICATION_PROPERTIES} from "@/api/ProjectModels";
import {ASYNCAPI_FILE_NAME_JSON, ASYNCAPI_FILE_NAME_YAML} from "karavan-core/lib/contants";
import {EditorType} from "@/developer/EditorConfig";
import {EditorErrorBoundaryWrapper} from "@/developer/EditorErrorBoundaryWrapper";
import {DeveloperToolbar} from "@/developer/DeveloperToolbar";

function DeveloperEditor(props: { editorType: "json" | "groovy" | "yaml" | "xml" | "markdown" | "sql" }) {
    return null;
}

export function DeveloperManager() {

    const [file] = useFileStore((s) => [s.file], shallow)
    const [designerSwitch, setDesignerSwitch] = useDesignerStore((s) => [s.designerSwitch, s.setDesignerSwitch], shallow)

    function yamlIsCamel(): boolean {
        if (file && file.name.endsWith(".camel.yaml")) {
            try {
                const i = CamelDefinitionYaml.yamlToIntegration(file.name, file?.code);
            } catch (e: any) {
                // EventBus.sendAlert(' ' + e?.name, '' + e?.message, 'danger');
                return false;
            }
            return true;
        }
        return false;
    }

    function getDeveloperUI() {
        const isYaml = file !== undefined && (file.name.endsWith(".yaml") || file.name.endsWith(".yml"));
        const isCamelYaml = yamlIsCamel();
        const isKameletYaml = file !== undefined && file.name.endsWith(".kamelet.yaml");
        const isAsyncApiYaml = file !== undefined && file.name === ASYNCAPI_FILE_NAME_YAML;
        const isAsyncApiJson = file !== undefined && file.name === ASYNCAPI_FILE_NAME_JSON;
        const isIntegration = isCamelYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const showDesigner = designerSwitch && ((isCamelYaml && isIntegration) || isKameletYaml);
        const showPropertiesEditor = file !== undefined && file.name === APPLICATION_PROPERTIES;
        const isMarkdown = file !== undefined && file.name.endsWith(".md");
        const isGroovy = file !== undefined && file.name.endsWith(".groovy");
        const isSql = file !== undefined && file.name.endsWith(".sql");
        const isXml = file !== undefined && file.name.endsWith(".xml");
        if (showDesigner) {
            return <DesignerEditor/>;
        } else {
            let editorType: EditorType;
            if (isGroovy) {
                editorType = 'groovy';
            } else if (isSql) {
                editorType = 'sql';
            } else if (isYaml || isCamelYaml || isKameletYaml || isAsyncApiYaml) {
                editorType = 'yaml';
            } else if (isMarkdown) {
                editorType = 'markdown';
            } else if (isXml) {
                editorType = 'xml';
            } else {
                editorType = 'json'; // default
            }
            return <DeveloperEditor editorType={editorType}/>
        }
    }

    return (
        <div className='editor-manager'>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
                    <DeveloperToolbar/>
                    {getDeveloperUI()}
                </div>
            </EditorErrorBoundaryWrapper>
        </div>
    )
}