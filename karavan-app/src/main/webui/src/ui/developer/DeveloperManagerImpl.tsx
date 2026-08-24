import React, {useEffect} from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@developer/monaco/EditorErrorBoundaryWrapper";
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import {DeveloperEditor} from "./DeveloperEditor";
import {EditorType} from "@developer/monaco/EditorConfig";
import DeveloperToolbar from "./DeveloperToolbar";
import {useDeveloperToggleStore} from "@developer/toggle/useDeveloperToggleStore";
import {DiffViewer} from "@developer/diff/DiffViewer";
import {DesignerEditor} from "@developer/DesignerEditor";

export function DeveloperManager() {

    const [file] = useFileStore((s) => [s.file], shallow)
    const developerView = useDeveloperToggleStore((s) => s.developerView)
    const setDeveloperView = useDeveloperToggleStore((s) => s.setDeveloperView)

    useEffect(() => {
        if (isCamelYaml || isKameletYaml) {
            setDeveloperView('designer');
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
    const showDesigner = developerView === 'designer' && ((isCamelYaml && isIntegration) || isKameletYaml);
    const isMarkdown = file?.name.endsWith(".md");
    const isGroovy = file?.name.endsWith(".groovy");
    const isSql = file?.name.endsWith(".sql");
    const isXml = file?.name.endsWith(".xml");
    const isSvg = file?.name.endsWith(".svg");

    function getDeveloperUI() {
        if (developerView === 'diff') {
            return <DiffViewer/>
        } else if (showDesigner) {
            return <DesignerEditor/>;
        } else {
            let editorType: EditorType;
            if (isGroovy) {
                editorType = 'groovy';
            } else if (isSql) {
                editorType = 'sql';
            } else if (isYaml) {
                editorType = 'yaml';
            } else if (isMarkdown) {
                editorType = 'markdown';
            } else if (isXml) {
                editorType = 'xml';
            } else if (isSvg) {
                editorType = 'svg';
            } else {
                editorType = 'json'; // default
            }
            return <DeveloperEditor editorType={editorType}/>
        }
    }

    return (
        <div id={"editor-manager"} className='editor-manager' key={`${file?.projectId}-${file?.name}`}>
            <EditorErrorBoundaryWrapper onError={error => console.error(error)}>
                <div id={"editor-manager-inner"} style={{display: 'flex', flexDirection: 'column', width: '99%', height: '100%'}}>
                    <DeveloperToolbar/>
                    {getDeveloperUI()}
                </div>
            </EditorErrorBoundaryWrapper>
        </div>
    )
}