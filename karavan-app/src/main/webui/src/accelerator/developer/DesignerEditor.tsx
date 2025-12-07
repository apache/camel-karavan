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
import '@/integration-designer/karavan.css';
import {APPLICATION_PROPERTIES, ProjectFile} from "@/api/ProjectModels";
import {useFilesStore, useFileStore, useProjectStore} from "@/api/ProjectStore";
import {KaravanDesigner} from "@/integration-designer/KaravanDesigner";
import {ProjectService} from "@/api/ProjectService";
import {shallow} from "zustand/shallow";
import {CodeUtils} from "@/util/CodeUtils";
import {useDesignerStore, useIntegrationStore} from "@/integration-designer/DesignerStore";
import {CamelUi} from "@/integration-designer/utils/CamelUi";
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {DslProperties} from "@/integration-designer/property/DslProperties";
import {ExpressionEditor} from "@/integration-designer/property/expression/ExpressionEditor";

export function DesignerEditor() {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [file, designerTab, setFile] = useFileStore((s) => [s.file, s.designerTab, s.setFile], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [key, setKey] = useIntegrationStore((s) => [s.key, s.setKey], shallow);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)
    const [propertyPlaceholders, setPropertyPlaceholders] = useState<[string, string][]>([]);
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
            if (project?.projectId?.includes('kamelets') && file) {
                ProjectService.loadCustomKamelets()
            }
        };
    }, []);

    useEffect(() => {
        // TODO: cause multiple KaravanDesigner reload
        setKey(Math.random().toString());
    }, [beans, propertyPlaceholders]);

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
        const file = files.filter(f => f.name === APPLICATION_PROPERTIES)?.at(0);
        const code = file?.code?.concat('\n').concat(key).concat('=').concat(value);
        if (file && code) {
            file.code = code;
            ProjectService.updateFile(file, false);
        }
    }

    function onCreateNewRoute(componentName: string, propertyName: string, propertyValue: string) {
        const parameters: any = {};
        parameters[propertyName] = propertyValue;
        CamelUi.onCreateNewRoute(project.projectId, files, componentName, parameters, '', newFile => {
            setFile('select', newFile);
            setKey(Math.random().toString());
        })
    }

    function onCreateNewFile(fileName: string, code: string, open:boolean) {
        CamelUi.createNewFile(project.projectId, fileName, code, newFile => {
            if (open) {
                setFile('select', newFile);
                setKey(Math.random().toString());
            }
        })
    }

    function internalConsumerClick(uri?: string, name?: string, routeId?: string, fileName?: string) {
        CamelUi.internalConsumerClick(files, uri, name, routeId, fileName, (fileName1, step) => {
            switchToFile(fileName1);
            if (step) setSelectedStep(step);
        })
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
                             filename={file.name}
                             yaml={file.code}
                             tab={designerTab}
                             onSave={(name, yaml) => save(name, yaml)}
                             onSaveCustomCode={(name, code, active) =>
                                 ProjectService.updateFile(new ProjectFile(name + ".java", project.projectId, code, Date.now()), active)}
                             onGetCustomCode={onGetCustomCode}
                             propertyPlaceholders={propertyPlaceholders}
                             onSavePropertyPlaceholder={onSavePropertyPlaceholder}
                             beans={beans}
                             onInternalConsumerClick={internalConsumerClick}
                             onCreateNewRoute={onCreateNewRoute}
                             onCreateNewFile={onCreateNewFile}
                             files={files.map(f => new IntegrationFile(f.name, f.code))}
                             mainRightPanel={<DslProperties designerType={"routes"} expressionEditor={ExpressionEditor}/>}
            />
            : <></>
    )
}
