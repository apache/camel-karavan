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
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {KubernetesConfigMap, KubernetesSecret} from "@models/SystemModels";

export const SystemMenus = ['containers', 'deployments', 'secrets', 'configMaps', 'envVars', 'appProps', 'log'] as const;
export type SystemMenu = typeof SystemMenus[number] ;

interface SystemState {
    filter: string;
    setFilter: (filter: string) => void;
    secrets: KubernetesSecret[];
    setSecrets: (secrets: KubernetesSecret[]) => void;
    configmaps: KubernetesConfigMap[];
    setConfigMaps: (configmaps: KubernetesConfigMap[]) => void;
    tabIndex: SystemMenu;
    setTabIndex: (tabIndex: SystemMenu | number) => void;
    envVars: string[];
    setEnvVars: (envVars: string[]) => void;
    appProps: string[];
    setAppProps: (appProps: string[]) => void;
}

export const useSystemStore = createWithEqualityFn<SystemState>((set) => ({
    filter: '',
    secrets: [],
    configmaps: [],
    tabIndex: 'containers',
    setFilter: (filter: string)=> {
        set({filter: filter});
    },
    setSecrets: (secrets: KubernetesSecret[])=> {
        set({secrets: secrets});
    },
    setConfigMaps: (configmaps: KubernetesConfigMap[]) => {
        set({configmaps: configmaps});
    },
    setTabIndex: (tabIndex: SystemMenu | number) => {
        const tab = typeof tabIndex === 'number' ? SystemMenus[tabIndex] : tabIndex;
        set({tabIndex: tab});
    },
    envVars: [],
    appProps: [],
    setEnvVars: (envVars: string[]) => {
        set({envVars: envVars});
    },
    setAppProps: (appProps: string[]) => {
        set({appProps: appProps});
    }
}), shallow)


