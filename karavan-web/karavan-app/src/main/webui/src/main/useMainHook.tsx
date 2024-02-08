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

import {KaravanApi} from "../api/KaravanApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import '../designer/karavan.css';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {AppConfig, ContainerStatus} from "../api/ProjectModels";
import {useAppConfigStore, useStatusesStore} from "../api/ProjectStore";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../api/ProjectService";

export function useMainHook () {

    const [setConfig] = useAppConfigStore((state) => [state.setConfig], shallow)
    const [setContainers] = useStatusesStore((state) => [state.setContainers], shallow);
    const [selectedEnv, selectEnvironment] = useAppConfigStore((state) => [state.selectedEnv, state.selectEnvironment], shallow)

    const getStatuses = () =>  {
        if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
            KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
                setContainers(statuses);
            });
        }
    }

    const getData = () =>  {
        if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
            KaravanApi.getConfiguration((config: AppConfig) => {
                setConfig(config);
                if (!selectedEnv || selectedEnv.length == 0) {
                    selectEnvironment(config.environment, true);
                }
                InfrastructureAPI.infrastructure = config.infrastructure;
            });
            updateKamelets();
            updateComponents();
            // updateSupportedComponents(); // not implemented yet
        }
    }

    async function updateKamelets(): Promise<void> {
        await new Promise(resolve => {
            ProjectService.reloadKamelets();
        });
    }

    async function updateComponents(): Promise<void> {
        await new Promise(resolve => {
            KaravanApi.getComponents(code => {
                const components: [] = JSON.parse(code);
                const jsons: string[] = [];
                components.forEach(c => jsons.push(JSON.stringify(c)));
                ComponentApi.saveComponents(jsons, true);
            })
        });
    }

    async function updateSupportedComponents(): Promise<void> {
        await new Promise(resolve => {
            KaravanApi.getSupportedComponents(jsons => {
                ComponentApi.saveSupportedComponents(jsons);
            })
        });
    }

    return { getData, getStatuses }
}