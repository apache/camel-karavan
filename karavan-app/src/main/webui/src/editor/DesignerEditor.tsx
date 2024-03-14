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
import {ProjectFile} from "../api/ProjectModels";
import {useFilesStore, useFileStore} from "../api/ProjectStore";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {CodeUtils} from "../util/CodeUtils";
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";

interface Props {
    projectId: string
}

export function DesignerEditor(props: Props) {

    const [file, designerTab, setFile] = useFileStore((s) => [s.file, s.designerTab, s.setFile], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [propertyPlaceholders, setPropertyPlaceholders] = useState<string[]>([]);
    const [beans, setBeans] = useState<RegistryBeanDefinition[]>([]);
    const [key, setKey] = useState<string>(Math.random().toString());
    const [code, setCode] = useState<string>();

    useEffect(() => {
        setCode(file?.code);
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
        });
        return () => {
            //save custom kamelet on page unload
            if (props.projectId.includes('kamelets') && file) {
                KameletApi.saveKamelet(file?.code);
            }
        };
    }, []);

    function save(name: string, code: string) {
        if (file) {
            file.code = code;
            ProjectService.updateFile(file, true);
        }
    }

    function onGetCustomCode(name: string, javaType: string): Promise<string | undefined> {
        return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code));
    }

    function onSavePropertyPlaceholder(key: string, value: string) {
        const file = files.filter(f => f.name === 'application.properties')?.at(0);
        const code = file?.code?.concat('\n').concat(key).concat('=').concat(value);
        if (file && code) {
            file.code = code;
            ProjectService.updateFile(file, false);
        }
    }

    function internalConsumerClick(uri?: string, name?: string, routeId?: string) {
        const integrations = files.filter(f => f.name.endsWith(".camel.yaml"))
            .map(f => CamelDefinitionYaml.yamlToIntegration(f.name, f.code));
        if (uri && name) {
            const routes = TopologyUtils.findTopologyRouteNodes(integrations);
            for (const route of routes) {
                if (route?.from?.uri === uri && route?.from?.parameters?.name === name) {
                    const switchToFile = files.filter(f => f.name === route.fileName).at(0);
                    if (switchToFile) {
                        setFile('select', switchToFile);
                        setKey(Math.random().toString())
                    }
                }
            }
        } else {
            const nodes = TopologyUtils.findTopologyOutgoingNodes(integrations)
                .filter(t => t.routeId === routeId);
            for (const node of nodes) {
                const switchToFile = files.filter(f => f.name === node.fileName).at(0);
                if (switchToFile) {
                    setFile('select', switchToFile);
                    setKey(Math.random().toString())
                }
            }
        }
    }

    return (file !== undefined ?
            <KaravanDesigner key={key}
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
                             onInternalConsumerClick={internalConsumerClick}
                             files={files.map(f => new IntegrationFile(f.name, f.code))}
            />
            : <></>
    )
}
