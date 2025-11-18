import React from 'react';
import {useFileStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {DesignerEditor} from "./DesignerEditor";
import {useDesignerStore} from "@/integration-designer/DesignerStore";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@/accelerator/developer/EditorErrorBoundaryWrapper";
import {DeveloperEditor} from "@/accelerator/developer/DeveloperEditor";
import {EditorType} from "@/accelerator/developer/EditorConfig";
import {DeveloperToolbar} from "@/accelerator/developer/DeveloperToolbar";
import {CamelDefinitionYaml} from "core/api/CamelDefinitionYaml";

export function DeveloperManager() {

    const [file] = useFileStore((s) => [s.file], shallow)
    const [designerSwitch] = useDesignerStore((s) => [s.designerSwitch], shallow)

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
        const isIntegration = isCamelYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const showDesigner = designerSwitch && ((isCamelYaml && isIntegration) || isKameletYaml);
        const isMarkdown = file !== undefined && file.name.endsWith(".md");
        const isGroovy = file !== undefined && file.name.endsWith(".groovy");
        const isXml = file !== undefined && file.name.endsWith(".xml");
        if (showDesigner) {
            return <DesignerEditor/>;
        } else {
            let editorType: EditorType;
            if (isGroovy) {
                editorType = 'groovy';
            } else if (isYaml || isCamelYaml || isKameletYaml) {
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