import React from 'react';
import {shallow} from "zustand/shallow";
import {DesignerEditor} from "./DesignerEditor";
import './DeveloperManager.css'
import { useFileStore } from "@stores/ProjectStore";
import { useDesignerStore } from "../designer/DesignerStore";
import { CamelDefinitionYaml } from "@karavan-core/api/CamelDefinitionYaml";
import {EditorType} from "@features/integration/developer/EditorConfig";
import DeveloperEditor from "@features/integration/developer/DeveloperEditor";
import {EditorErrorBoundaryWrapper} from "@features/integration/developer/EditorErrorBoundaryWrapper";
import {DeveloperToolbar} from "@features/integration/developer/DeveloperToolbar";

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
        const isCamelYaml = yamlIsCamel();
        const isKameletYaml = file !== undefined && file.name.endsWith(".kamelet.yaml");
        const isIntegration = isCamelYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const showDesigner = designerSwitch && ((isCamelYaml && isIntegration) || isKameletYaml);
        if (showDesigner) {
            return <DesignerEditor/>;
        } else {
            return <DeveloperEditor/>
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