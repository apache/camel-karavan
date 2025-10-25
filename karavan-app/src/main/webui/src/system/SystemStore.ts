import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {KubernetesConfigMap, KubernetesSecret} from "./SystemModels";

interface SystemState {
    filter: string;
    setFilter: (filter: string) => void;
    secrets: KubernetesSecret[];
    setSecrets: (secrets: KubernetesSecret[]) => void;
    configmaps: KubernetesConfigMap[];
    setConfigMaps: (configmaps: KubernetesConfigMap[]) => void;
}

export const useSystemStore = createWithEqualityFn<SystemState>((set) => ({
    filter: '',
    secrets: [],
    configmaps: [],
    setFilter: (filter: string)=> {
        set({filter: filter});
    },
    setSecrets: (secrets: KubernetesSecret[])=> {
        set({secrets: secrets});
    },
    setConfigMaps: (configmaps: KubernetesConfigMap[]) => {
        set({configmaps: configmaps});
    },
}), shallow)


