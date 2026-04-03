import React, {useEffect} from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {PropertiesEditor} from "./PropertiesEditor";
import {useDesignerStore} from "@features/project/designer/DesignerStore";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@features/project/developer/EditorErrorBoundaryWrapper";
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import {DeveloperEditor} from "@features/project/developer/DeveloperEditor";
import {EditorType} from "@features/project/developer/EditorConfig";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE, DOCKER_STACK, KUBERNETES_YAML} from "@models/ProjectModels";
import DeveloperToolbar from "@features/project/developer/DeveloperToolbar";
import {DesignerEditor} from "@features/project/developer/DesignerEditor";
import {DashboardDevelopmentHook} from "@features/dashboard/development/DashboardDevelopmentHook";

export function DeveloperManager() {

    const [file] = useFileStore((s) => [s.file], shallow)
    const [designerSwitch, setDesignerSwitch] = useDesignerStore((s) => [s.designerSwitch, s.setDesignerSwitch], shallow)
    const {getValidationInfoForFile} = DashboardDevelopmentHook();
    const validation = getValidationInfoForFile(file.projectId, file?.name);

    useEffect(() => {
        if (isCamelYaml || isKameletYaml) {
            setDesignerSwitch(true);
        }
    }, [file?.name, file?.projectId])

    function yamlIsCamel(): boolean {
        if (file && file?.name.endsWith(".camel.yaml")) {
            try {
                const i = CamelDefinitionYaml.yamlToIntegration(file?.name, file?.code);
            } catch (e: any) {
                // EventBus.sendAlert(' ' + e?.name, '' + e?.message, 'danger');
                return false;
            }
            return true;
        }
        return false;
    }

    const isYaml =(file?.name.endsWith(".yaml") || file?.name.endsWith(".yml"));
    const isCamelYaml = yamlIsCamel();
    const isKameletYaml = file?.name.endsWith(".kamelet.yaml");
    const isIntegration = isCamelYaml && (file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code) || file?.code?.length === 0);
    const showDesigner = !validation?.hasErrors && designerSwitch && ((isCamelYaml && isIntegration) || isKameletYaml);
    const showPropertiesEditor = file?.name === APPLICATION_PROPERTIES;
    const isMarkdown = file?.name.endsWith(".md");
    const isGroovy = file?.name.endsWith(".groovy");
    const isSql = file?.name.endsWith(".sql");
    const isXml = file?.name.endsWith(".xml");
    const isSvg = file?.name.endsWith(".svg");
    const isInfra = file?.name.endsWith(DOCKER_COMPOSE) || file?.name.endsWith(DOCKER_STACK) || file?.name.endsWith(KUBERNETES_YAML);
    const showDesignerToggle = !isInfra && !isSql && !isGroovy && !isXml && !showPropertiesEditor;
    // const showRunButton = isSql ? "sql" : (isGroovy ? "groovy" : undefined);
    const showRunButton = (isGroovy ? "groovy" : undefined);

    function getDeveloperUI() {
        if (showDesigner) {
            return <DesignerEditor/>;
        } else if (showPropertiesEditor) {
            return <PropertiesEditor/>
        } else {
            let editorType: EditorType;
            if (isYaml || isCamelYaml || isKameletYaml) {
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
        <div id={"editor-manager"} className='editor-manager' key={`${file?.projectId}-${file?.name}`}>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                <div id={"editor-manager-inner"} style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
                    <DeveloperToolbar showDesignerToggle={showDesignerToggle} showRunButton={showRunButton}/>
                    {getDeveloperUI()}
                </div>
            </EditorErrorBoundaryWrapper>
        </div>
    )
}