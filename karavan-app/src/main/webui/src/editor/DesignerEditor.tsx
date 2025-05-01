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
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../designer/utils/CamelUi";
import {toKebabCase} from "../designer/utils/ValidatorUtils";
import {KaravanApi} from "../api/KaravanApi";
import {EventBus} from "../designer/utils/EventBus";
import {getIntegrations} from "../topology/TopologyApi";
import {useDesignerStore, useIntegrationStore} from "../designer/DesignerStore";

interface Props {
    projectId: string
}

export function DesignerEditor(props: Props) {

    const [file, designerTab, setFile] = useFileStore((s) => [s.file, s.designerTab, s.setFile], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [key, setKey] = useIntegrationStore((s) => [s.key, s.setKey], shallow);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)
    const [propertyPlaceholders, setPropertyPlaceholders] = useState< [string, string][]>([]);
    const [beans, setBeans] = useState<BeanFactoryDefinition[]>([]);
    const [code, setCode] = useState<string>();

    useEffect(() => {
        setCode(file?.code);
        const pp = CodeUtils.getPropertyPlaceholders(files);
        setPropertyPlaceholders(pp);
        const bs = CodeUtils.getBeans(files);
        setBeans(bs)
        setKey(Math.random().toString());
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

    function onCreateNewRoute(componentName: string, propertyName: string, propertyValue: string) {
        try {
            const integrations = getIntegrations(files);
            const incomingNodes = TopologyUtils.findTopologyIncomingNodes(integrations)
                .filter(n => n.from?.uri === componentName && n.from?.parameters?.[propertyName] === propertyValue);
            if (incomingNodes.length > 0) {
                internalConsumerClick(undefined, undefined, incomingNodes[0].routeId, incomingNodes[0].fileName);
            } else {
                createNewRoute(componentName, propertyName, propertyValue);
            }
        } catch (err: any){
            console.error(err)
        }
    }

    function createNewRoute(componentName: string, propertyName: string, propertyValue: string) {
        try {
            const name = 'from-' + componentName + '-' + toKebabCase(propertyValue);
            const newRoute = CamelUi.createRouteFromComponent(componentName, propertyName, propertyValue);
            const newIntegration = Integration.createNew(propertyValue, 'plain');
            newIntegration.spec.flows = [newRoute];
            const code = CamelDefinitionYaml.integrationToYaml(newIntegration);
            const fileName = name + '.camel.yaml';
            const file = new ProjectFile(fileName, props.projectId, code, Date.now());
            KaravanApi.saveProjectFile(file, (result, newFile) => {
                if (result) {
                    setFile('select', newFile);
                    setKey(Math.random().toString());
                } else {
                    EventBus.sendAlert('Error creating file', 'Error: ' +newFile?.toString());
                }
            });
        } catch (err: any){
            console.error(err)
        }
    }

    function internalConsumerClick(uri?: string, name?: string, routeId?: string, fileName?: string) {
        let done = false;
        const integrations = files.filter(f => f.name.endsWith(".camel.yaml"))
            .map(f => CamelDefinitionYaml.yamlToIntegration(f.name, f.code));
        if (fileName) {
            const uniqueUri = uri + ':name=' + name;
            const outgoingNodes = TopologyUtils.findTopologyRouteOutgoingNodes(integrations);
            let step = outgoingNodes.filter(node => node.uniqueUri === uniqueUri).at(0)?.step;
            if (step === undefined) {
                const restUri = uri + ':' + name;
                const restNodes = TopologyUtils.findTopologyRestNodes(integrations);
                restNodes.filter(restNode => restNode.uris.includes(restUri)).forEach(restNode => {
                    step = restNode.rest.get?.filter(m => m.to === restUri).at(0)
                        || restNode.rest.post?.filter(m => m.to === restUri).at(0)
                        || restNode.rest.put?.filter(m => m.to === restUri).at(0)
                        || restNode.rest.delete?.filter(m => m.to === restUri).at(0)
                        || restNode.rest.patch?.filter(m => m.to === restUri).at(0)
                        || restNode.rest.head?.filter(m => m.to === restUri).at(0);
                })
            }
            switchToFile(fileName);
            setSelectedStep(step)
            done = true;
        } else if (uri && name) {
            const routes = TopologyUtils.findTopologyRouteNodes(integrations);
            for (const route of routes) {
                if (route?.from?.uri === uri && (route?.from?.parameters?.name === name || route?.from?.parameters?.address === name)) {
                    switchToFile(route.fileName);
                    setSelectedStep(route?.from);
                    done = true;
                }
            }
        } else {
            const nodes = TopologyUtils.findTopologyRouteOutgoingNodes(integrations).filter(t => t.routeId === routeId);
            for (const node of nodes) {
                switchToFile(node.fileName);
                done = true;
            }
        }
        if (!done) {
            EventBus.sendAlert('Warning', 'Route not found. Possibly not created.', 'warning');
        }
    }

    function switchToFile(fileName: string) {
        const file = files.filter(f => f.name === fileName).at(0);
        if (file) {
            setFile('select', file);
            setKey(Math.random().toString())
        }
    }

    return (file !== undefined && key !== undefined ?
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
                             onCreateNewRoute={onCreateNewRoute}
                             files={files.map(f => new IntegrationFile(f.name, f.code))}
            />
            : <></>
    )
}
