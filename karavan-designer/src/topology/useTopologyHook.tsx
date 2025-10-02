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
import {shallow} from "zustand/shallow";
import {useFilesStore, useFileStore} from "../api/ProjectStore";
import {EventBus} from "../designer/utils/EventBus";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {RouteDefinition} from "karavan-core/lib/model/CamelDefinition";
import {ProjectService} from "../api/ProjectService";

export function useTopologyHook() {

    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);

    function selectFile(fileName: string) {
        const file = files.filter(f => f.name === fileName)?.at(0);
        if (file) {
            setFile('select', file);
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
                    ProjectService.updateFile(file, true);
                }

            }
        } catch (e: any) {
            EventBus.sendAlert('Error disabling Route', e?.message);
        }
    }

    return {
        selectFile, setDisabled
    }
}