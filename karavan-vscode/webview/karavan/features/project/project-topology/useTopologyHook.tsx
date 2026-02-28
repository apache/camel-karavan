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
import React from "react";
import {shallow} from "zustand/shallow";
import {useFilesStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {CamelDefinitionYaml} from "@karavan-core/api/CamelDefinitionYaml";
import {CamelDefinitionApiExt} from "@karavan-core/api/CamelDefinitionApiExt";
import {RouteDefinition} from "@karavan-core/model/CamelDefinition";
import {ModalConfirmationProps} from "@shared/ui/ModalConfirmation";

export function useTopologyHook(setConfirmationProps?: React.Dispatch<React.SetStateAction<ModalConfirmationProps | undefined>>) {

    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [setTabIndex, project] = useProjectStore((s) => [s.setTabIndex, s.project], shallow);

    function selectFile(fileName: string) {
        const file = files.filter(f => f.name === fileName)?.at(0);
        if (file) {
            setFile('select', file);
            setTabIndex(0);
        }
    }

    function setDisabled(fileName: string, elementId: string, enable: boolean) {
        try {
            const file = files.filter(f => f.name === fileName)?.at(0);
            if (file) {
                const integration = CamelDefinitionYaml.yamlToIntegration(file.name, file?.code);
                const element = CamelDefinitionApiExt.findElementById(integration, elementId);
                if (element) {
                    if (element.dslName === 'RouteDefinition') {
                        (element as RouteDefinition).autoStartup = enable;
                    } else {
                        (element as any).disabled = enable;
                    }
                    const newIntegration = CamelDefinitionApiExt.updateIntegrationRouteElement(integration, element);
                    file.code = CamelDefinitionYaml.integrationToYaml(newIntegration);
                    // ProjectService.updateFile(file, true);
                }

            }
        } catch (e: any) {
            EventBus.sendAlert('Error disabling Route', e?.message);
        }
    }

    function deleteRoute(fileName: string, routeId: string) {
        try {
            const file = files.filter(f => f.name === fileName)?.at(0);
            if (file) {
                const integration = CamelDefinitionYaml.yamlToIntegration(file.name, file?.code);
                const newIntegration = CamelDefinitionApiExt.deleteRouteFromIntegration(integration, routeId);
                const isEmpty = newIntegration?.spec.flows?.length === 0 && newIntegration?.spec.template === undefined;
                const propsClose: ModalConfirmationProps = {
                    isOpen: false,
                    title: '',
                    message: '',
                        onConfirm: () => {
                    },
                        onCancel: () => {
                    }
                };
                const props: ModalConfirmationProps = {
                    isOpen: true,
                    title: 'Confirmation',
                    btnConfirmVariant: 'danger',
                    message: `Delete route ${isEmpty ? ' and file ' + fileName : ''}`,
                    onConfirm: () => {
                        if (isEmpty) {
                            ProjectService.deleteFile(file);
                        } else {
                            file.code = CamelDefinitionYaml.integrationToYaml(newIntegration);
                            ProjectService.updateFile(file, true);
                        }
                        setConfirmationProps?.(propsClose)
                    },
                    onCancel: () => setConfirmationProps?.(propsClose)
                };
                setConfirmationProps?.({...props})
            }
        } catch (e: any) {
            console.error(e);
            EventBus.sendAlert('Error deleting Route', e?.message);
        }
    }

    function setRouteGroup (fileName: string, elementId: string, groupName: string) {
        try {
            const file = files.filter(f => f.name === fileName)?.at(0);
            if (file) {
                const integration = CamelDefinitionYaml.yamlToIntegration(file.name, file?.code);
                const element = CamelDefinitionApiExt.findElementById(integration, elementId);
                if (element) {
                    if (element.dslName === 'RouteDefinition') {
                        (element as RouteDefinition).group = groupName;
                    }
                    const newIntegration = CamelDefinitionApiExt.updateIntegrationRouteElement(integration, element);
                    file.code = CamelDefinitionYaml.integrationToYaml(newIntegration);
                    ProjectService.updateFile(file, true);
                }

            }
        } catch (e: any) {
            EventBus.sendAlert('Error changing Route group', e?.message);
        }
    }

    return {
        selectFile, setDisabled, deleteRoute, setRouteGroup, project
    }
}