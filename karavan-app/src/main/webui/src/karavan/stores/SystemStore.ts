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


