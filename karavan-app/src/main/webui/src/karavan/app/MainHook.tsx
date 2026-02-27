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
import {KaravanApi} from "@api/KaravanApi";
import {ComponentApi} from "@karavan-core/api/ComponentApi";
import {AppConfig, Project} from "@models/ProjectModels";
import {useAppConfigStore, useProjectsStore} from "@stores/ProjectStore";
import {InfrastructureAPI} from "@features/project/designer/utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@services/ProjectService";
import {SpiBeanApi} from "@karavan-core/api/SpiBeanApi";
import {MainConfigurationApi} from "@karavan-core/api/MainConfigurationApi";
import {useContext} from "react";
import {AuthContext} from "@api/auth/AuthProvider";
import {useReadinessStore} from "@stores/ReadinessStore";
import {AuthApi} from "@api/auth/AuthApi";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

export function mainHook () {

    const {readiness} = useReadinessStore();
    const [setConfig, setDockerInfo] = useAppConfigStore((s) => [s.setConfig, s.setDockerInfo], shallow)
    const [setProjects] = useProjectsStore((s) => [s.setProjects], shallow)
    const {fetchContainers} = useContainerStatusesStore();
    const [selectedEnv, selectEnvironment] = useAppConfigStore((state) => [state.selectedEnv, state.selectEnvironment], shallow)
    const { user } = useContext(AuthContext);

    const getStatuses = () =>  {
        if (user) {
            fetchContainers();
        }
    }

    const getData = () =>  {
        if (user) {
            KaravanApi.getConfiguration((config: AppConfig) => {
                setConfig(config);
                if (!selectedEnv || selectedEnv.length == 0) {
                    selectEnvironment(config.environment, true);
                }
                if (config.infrastructure !== 'kubernetes') {
                    KaravanApi.getInfrastructureInfo((info: any) => {
                        setDockerInfo(info)
                    })
                }
                InfrastructureAPI.infrastructure = config.infrastructure;
            });
            KaravanApi.getProjects((projects: Project[]) => {
                setProjects(projects);
            });
            updateComponents();
            updateBeans();
            updateAllConfigurations();
            ProjectService.loadCamelAndCustomKamelets();
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

    async function updateConfiguration(configName: string): Promise<{ properties: any[]; groups: any[] }> {
        return new Promise(resolve => {
            KaravanApi.getMetadataConfiguration(configName, code => {
                try {
                    const objects: any = JSON.parse(code);
                    const properties: any[] = objects.properties || [];
                    const groups: any[] = objects.groups || [];
                    resolve({ properties, groups });
                } catch (error) {
                    console.error(`Failed to parse configuration for "${configName}":`, error);
                    resolve({ properties: [], groups: [] });
                }
            });
        });
    }

    async function updateConfigurationChanges(): Promise<any[]> {
        return new Promise(resolve => {
            KaravanApi.getConfigurationChanges(code => {
                const changes: any = JSON.parse(code);
                resolve(changes);
            });
        });
    }

    async function updateAllConfigurations(): Promise<void> {
        const [meta, jbang, jib, jkube, changes] = await Promise.all([
            updateConfiguration("main"),
            updateConfiguration("jbang"),
            updateConfiguration("jib"),
            updateConfiguration("jkube"),
            updateConfigurationChanges()
        ]);

        const properties: any[] = [...meta.properties, ...jbang.properties, ...jib.properties, ...jkube.properties]
        const groups: any[] = [...meta.groups, ...jbang.groups, ...jib.groups, ...jkube.groups]

        MainConfigurationApi.saveApplicationProperties(properties, true);
        MainConfigurationApi.saveApplicationPropertyGroups(groups);
        MainConfigurationApi.saveApplicationPropertyChanges(changes);
    }

    function showSpinner() {
        return readiness === undefined;
    }

    function showStepper() {
        return readiness !== undefined && readiness.status !== true;
    }

    function showApplication() {
        return AuthApi.authType !== undefined && readiness?.status === true;
    }


    return { getData, getStatuses, showSpinner, showStepper, showApplication };
}