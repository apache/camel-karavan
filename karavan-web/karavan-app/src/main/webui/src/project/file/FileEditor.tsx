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
import '../../designer/karavan.css';
import Editor from "@monaco-editor/react";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectFile} from "../../api/ProjectModels";
import {useFilesStore, useFileStore} from "../../api/ProjectStore";
import {KaravanDesigner} from "../../designer/KaravanDesigner";
import {ProjectService} from "../../api/ProjectService";
import {PropertiesTable} from "./PropertiesTable";
import {shallow} from "zustand/shallow";
import {PropertiesToolbar} from "./PropertiesToolbar";
import {Card, Panel} from "@patternfly/react-core";
import {PropertiesPanel} from "./PropertiesPanel";

interface Props {
    projectId: string
}

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown']
])

export function FileEditor (props: Props) {

    const [file, designerTab] = useFileStore((s) => [s.file, s.designerTab], shallow )

    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            ProjectService.saveFile(file, true);
        }
    }

    function onGetCustomCode (name: string, javaType: string): Promise<string | undefined> {
        const files = useFilesStore.getState().files;
        return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code));
    }

    function getDesigner () {
        return (
            file !== undefined &&
            <KaravanDesigner
                showCodeTab={true}
                dark={false}
                filename={file.name}
                yaml={file.code}
                tab={designerTab}
                onSave={(name, yaml) => save(name, yaml)}
                onSaveCustomCode={(name, code) =>
                    ProjectService.saveFile(new ProjectFile(name + ".java", props.projectId, code, Date.now()), false)}
                onGetCustomCode={onGetCustomCode}
            />
        )
    }

    function getEditor () {
        const extension = file?.name.split('.').pop();
        const language = extension && languages.has(extension) ? languages.get(extension) : extension;
        return (
            file !== undefined &&
            <Editor
                height="100vh"
                defaultLanguage={language}
                theme={'light'}
                value={file.code}
                className={'code-editor'}
                onChange={(value, ev) => {
                    if (value) {
                        save(file?.name, value)
                    }
                }}
            />
        )
    }

    const isCamelYaml = file !== undefined && file.name.endsWith(".camel.yaml");
    const isKameletYaml = file !== undefined && file.name.endsWith(".kamelet.yaml");
    const isIntegration = isCamelYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
    const isProperties = file !== undefined && file.name.endsWith("properties");
    const showDesigner = (isCamelYaml && isIntegration) || isKameletYaml;
    const showEditor = !showDesigner && !isProperties;
    return (
        <>
            {showDesigner && getDesigner()}
            {showEditor && getEditor()}
            {isProperties && file !== undefined && <PropertiesPanel/>}
        </>
    )
}
