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
import React, {useState} from 'react';
import {
    CodeBlockCode,
    CodeBlock, Skeleton
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import Editor from "@monaco-editor/react";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectFile, ProjectFileTypes} from "../../api/ProjectModels";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {KaravanDesigner} from "../../designer/KaravanDesigner";
import {ProjectService} from "../../api/ProjectService";
import {PropertiesTable} from "./PropertiesTable";

export const FileEditor = () => {

    const [editAdvancedProperties] = useState<boolean>(false);
    const {file, operation} = useFileStore();
    const [mode, setMode] = useState<"design" | "code">("design");
    const [key, setKey] = useState<string>('');
    const {project} = useProjectStore();
    const {config} = useAppConfigStore();

    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            ProjectService.saveFile(file);
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
                key={"key"}
                filename={file.name}
                yaml={file.code}
                onSave={(name, yaml) => save(name, yaml)}
                onSaveCustomCode={(name, code) =>
                    ProjectService.saveFile(new ProjectFile(name + ".java", project.projectId, code, Date.now()))}
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

    function getLogView ()  {
        return (
            <div>
                {file !== undefined && file.code.length !== 0 &&
                    <CodeBlock>
                        <CodeBlockCode id="code-content" className="log-code">{file.code}</CodeBlockCode>
                    </CodeBlock>}
                {(file === undefined || file.code.length === 0) &&
                    <div>
                        <Skeleton width="25%" screenreaderText="Loading contents"/>
                        <br/>
                        <Skeleton width="33%"/>
                        <br/>
                        <Skeleton width="50%"/>
                        <br/>
                        <Skeleton width="66%"/>
                        <br/>
                        <Skeleton width="75%"/>
                        <br/>
                        <Skeleton/>
                    </div>}
            </div>
        )
    }


    function isBuildIn(): boolean {
        return ['kamelets', 'templates'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project.projectId === 'templates';
    }

    const types = isBuildIn()
        ? (isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
        : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);
    const isYaml = file !== undefined && file.name.endsWith("yaml");
    const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
    const isProperties = file !== undefined && file.name.endsWith("properties");
    const isLog = file !== undefined && file.name.endsWith("log");
    const isCode = file !== undefined && (file.name.endsWith("java") || file.name.endsWith("groovy") || file.name.endsWith("json"));
    const showDesigner = isYaml && isIntegration && mode === 'design';
    const showEditor = isCode || (isYaml && !isIntegration) || (isYaml && mode === 'code');
    return (
        <>
            {showDesigner && getDesigner()}
            {showEditor && getEditor()}
            {isLog && getLogView()}
            {isProperties && file !== undefined && <PropertiesTable/>}
        </>
    )
}
