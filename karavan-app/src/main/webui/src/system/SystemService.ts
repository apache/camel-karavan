import {useSystemStore} from "./SystemStore";
import {SystemApi} from "./SystemApi";
import {KubernetesConfigMap, KubernetesSecret} from "./SystemModels";

export class SystemService {

    public static refresh() {
        SystemApi.getSecrets((secrets: KubernetesSecret[]) => {
            useSystemStore.setState({secrets: secrets.sort((a, b) => a.name.localeCompare(b.name))});
        });
        SystemApi.getConfigMaps((configmaps: KubernetesConfigMap[]) => {
            useSystemStore.setState({configmaps: configmaps.sort((a, b) => a.name.localeCompare(b.name))});
        });
    }
}