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
import '../designer/karavan.css';
import {useFileStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {DesignerEditor} from "./DesignerEditor";
import {CodeEditor} from "./CodeEditor";
import {EventBus} from "../designer/utils/EventBus";

interface Props {
    projectId: string
}

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown'],
    ['properties', 'ini']
])

export function FileEditor(props: Props) {

    const [file] = useFileStore((s) => [s.file], shallow)

    function yamlIsCamel(): boolean {
        if (file && file.name.endsWith(".camel.yaml")) {
            try {
                const i = CamelDefinitionYaml.yamlToIntegration(file.name, file?.code);
            } catch (e: any) {
                console.log(e)
                EventBus.sendAlert(' ' + e?.name, '' + e?.message, 'danger');
                return false;
            }
            return true;
        }
        return false;
    }

    const isCamelYaml = yamlIsCamel();
    const isKameletYaml = file !== undefined && file.name.endsWith(".kamelet.yaml");
    const isIntegration = isCamelYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
    const showDesigner = (isCamelYaml && isIntegration) || isKameletYaml;
    const showEditor = !showDesigner;
    return (
        <>
            {showDesigner && <DesignerEditor projectId={props.projectId}/>}
            {showEditor && <CodeEditor projectId={props.projectId}/>}
        </>
    )
}
