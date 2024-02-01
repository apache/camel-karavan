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
import React, {useEffect, useState} from 'react';
import '../designer/karavan.css';
import Editor from "@monaco-editor/react";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectFile} from "../api/ProjectModels";
import {useFilesStore, useFileStore} from "../api/ProjectStore";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {CodeUtils} from "../util/CodeUtils";
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";

interface Props {
    projectId: string
}

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown'],
    ['properties', 'ini']
])

export function FileEditor (props: Props) {

    const [file, designerTab] = useFileStore((s) => [s.file, s.designerTab], shallow )
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [propertyPlaceholders, setPropertyPlaceholders] = useState<string[]>([]);
    const [beans, setBeans] = useState<RegistryBeanDefinition[]>([]);

    useEffect(() => {
        const pp = CodeUtils.getPropertyPlaceholders(files);
        setPropertyPlaceholders(prevState => {
            prevState.length = 0;
            prevState.push(...pp);
            return prevState;
        })
        const bs = CodeUtils.getBeans(files);
        setBeans(prevState => {
            prevState.length = 0;
            prevState.push(...bs);
            return prevState;
        })
    }, []);

    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            ProjectService.updateFile(file, true);
        }
    }

    function onGetCustomCode (name: string, javaType: string): Promise<string | undefined> {
        return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code));
    }

    function onSavePropertyPlaceholder (key: string, value: string) {
        const file = files.filter(f => f.name === 'application.properties')?.at(0);
        const code = file?.code?.concat('\n').concat(key).concat('=').concat(value);
        if (file && code) {
            file.code = code;
            ProjectService.updateFile(file, false);
        }
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
                    ProjectService.updateFile(new ProjectFile(name + ".java", props.projectId, code, Date.now()), false)}
                onGetCustomCode={onGetCustomCode}
                propertyPlaceholders={propertyPlaceholders}
                onSavePropertyPlaceholder={onSavePropertyPlaceholder}
                beans={beans}
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
    const showDesigner = (isCamelYaml && isIntegration) || isKameletYaml;
    const showEditor = !showDesigner;
    return (
        <>
            {showDesigner && getDesigner()}
            {showEditor && getEditor()}
        </>
    )
}
