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
import '../designer/karavan.css';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {AppConfig, Project} from "../api/ProjectModels";
import {useAppConfigStore, useProjectsStore} from "../api/ProjectStore";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../api/ProjectService";
import {SpiBeanApi} from "karavan-core/lib/api/SpiBeanApi";

export function useMainHook () {

    const [setConfig, isAuthorized] = useAppConfigStore((s) => [s.setConfig, s.isAuthorized], shallow)
    const [setProjects] = useProjectsStore((s) => [s.setProjects], shallow)
    const [selectedEnv, selectEnvironment] = useAppConfigStore((state) => [state.selectedEnv, state.selectEnvironment], shallow)

    const getData = () =>  {
        if (isAuthorized) {
            KaravanApi.getConfiguration((config: AppConfig) => {
                setConfig(config);
                if (!selectedEnv || selectedEnv.length == 0) {
                    selectEnvironment(config.environment, true);
                }
                InfrastructureAPI.infrastructure = config.infrastructure;
            });
            KaravanApi.getProjects((projects: Project[]) => {
                setProjects(projects);
            });
            updateComponents();
            updateBeans();
            ProjectService.reloadKamelets();
            ProjectService.reloadBlockedTemplates();
            // updateSupportedComponents(); // not implemented yet
        }
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

    async function updateBeans(): Promise<void> {
        await new Promise(resolve => {
            KaravanApi.getBeans(code => {
                const beans: [] = JSON.parse(code);
                const jsons: string[] = [];
                beans.forEach(c => jsons.push(JSON.stringify(c)));
                SpiBeanApi.saveSpiBeans(jsons, true);
            })
        });
    }

    return { getData }
}