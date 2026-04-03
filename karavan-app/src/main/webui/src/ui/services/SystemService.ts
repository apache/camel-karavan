import {useSystemStore} from "@stores/SystemStore";
import {SystemApi} from "@api/SystemApi";
import {KubernetesConfigMap, KubernetesSecret} from "@models/SystemModels";

export class SystemService {

    public static refresh() {
        SystemApi.getSecrets((secrets: KubernetesSecret[]) => {
            useSystemStore.setState({secrets: [...secrets].sort((a, b) => a.name.localeCompare(b.name))});
        });
        SystemApi.getConfigMaps((configmaps: KubernetesConfigMap[]) => {
            useSystemStore.setState({configmaps: [...configmaps].sort((a, b) => a.name.localeCompare(b.name))});
        });
        SystemApi.getEnvVars((envVars: string[]) => {
            useSystemStore.setState({envVars: [...envVars].sort()});
        });
        SystemApi.getAppProps((appProps: string[]) => {
            useSystemStore.setState({appProps: [...appProps].sort()});
        });
    }
}