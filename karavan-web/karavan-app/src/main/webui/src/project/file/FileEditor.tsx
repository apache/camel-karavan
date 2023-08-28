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

interface Props {
    projectId: string
}

export function FileEditor (props: Props) {

    const [file, operation, mode] = useFileStore((state) =>
        [state.file, state.operation, state.mode, state.setMode], shallow )

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
                dark={false}
                filename={file.name}
                yaml={file.code}
                onSave={(name, yaml) => save(name, yaml)}
                onSaveCustomCode={(name, code) =>
                    ProjectService.saveFile(new ProjectFile(name + ".java", props.projectId, code, Date.now()), false)}
                onGetCustomCode={onGetCustomCode}
            />
        )
    }

    function getEditor () {
        const language = file?.name.split('.').pop();
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

    const isYaml = file !== undefined && file.name.endsWith("yaml");
    const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
    const isProperties = file !== undefined && file.name.endsWith("properties");
    const isCode = file !== undefined && (file.name.endsWith("java") || file.name.endsWith("groovy") || file.name.endsWith("json"));
    const showDesigner = isYaml && isIntegration && mode === 'design';
    const showEditor = isCode || (isYaml && !isIntegration) || (isYaml && mode === 'code');
    return (
        <>
            {showDesigner && getDesigner()}
            {showEditor && getEditor()}
            {isProperties && file !== undefined && <PropertiesTable/>}
        </>
    )
}
