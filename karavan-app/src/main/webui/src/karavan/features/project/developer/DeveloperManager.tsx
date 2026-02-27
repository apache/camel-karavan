/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useDesignerStore} from "@features/project/designer/DesignerStore";
import './DeveloperManager.css'
import {EditorErrorBoundaryWrapper} from "@features/project/developer/EditorErrorBoundaryWrapper";
import {CamelDefinitionYaml} from "@karavan-core/api/CamelDefinitionYaml";
import {DeveloperEditor} from "@features/project/developer/DeveloperEditor";
import {EditorType} from "@features/project/developer/EditorConfig";
import {DOCKER_COMPOSE, DOCKER_STACK, KUBERNETES_YAML} from "@models/ProjectModels";
import DeveloperToolbar from "@features/project/developer/DeveloperToolbar";
import {DesignerEditor} from "@features/project/developer/DesignerEditor";

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

    const isYaml = file !== undefined && (file.name.endsWith(".yaml") || file.name.endsWith(".yml"));
    const isCamelYaml = yamlIsCamel();
    const isKameletYaml = file !== undefined && file.name.endsWith(".kamelet.yaml");
    const isIntegration = isCamelYaml && (file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code) || file?.code?.length === 0);
    const showDesigner = designerSwitch && ((isCamelYaml && isIntegration) || isKameletYaml);
    const isMarkdown = file !== undefined && file.name.endsWith(".md");
    const isGroovy = file !== undefined && file.name.endsWith(".groovy");
    const isSql = file !== undefined && file.name.endsWith(".sql");
    const isXml = file !== undefined && file.name.endsWith(".xml");
    const isInfra = file !== undefined
        && (file.name.endsWith(DOCKER_COMPOSE) || file.name.endsWith(DOCKER_STACK) || file.name.endsWith(KUBERNETES_YAML));
    const showDesignerToggle = !isInfra && !isSql && !isGroovy && !isXml;
    // const showRunButton = isSql ? "sql" : (isGroovy ? "groovy" : undefined);
    const showRunButton = (isGroovy ? "groovy" : undefined);

    function getDeveloperUI() {
        if (showDesigner) {
            return <DesignerEditor/>;
        } else {
            let editorType: EditorType;
            if (isGroovy) {
                editorType = 'groovy';
            } else if (isSql) {
                editorType = 'sql';
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
                    <DeveloperToolbar showDesignerToggle={showDesignerToggle} showRunButton={showRunButton}/>
                    {getDeveloperUI()}
                </div>
            </EditorErrorBoundaryWrapper>
        </div>
    )
}