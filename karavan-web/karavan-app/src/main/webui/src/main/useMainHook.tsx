import {KaravanApi} from "../api/KaravanApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import '../designer/karavan.css';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {AppConfig, ContainerStatus} from "../api/ProjectModels";
import {useAppConfigStore, useStatusesStore} from "../api/ProjectStore";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";

export const useMainHook = () => {

    const [setConfig] = useAppConfigStore((state) => [state.setConfig], shallow)
    const [setContainers] = useStatusesStore((state) => [state.setContainers], shallow);

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
                InfrastructureAPI.infrastructure = config.infrastructure;
            });
            updateKamelets();
            updateComponents();
            // updateSupportedComponents(); // not implemented yet
        }
    }

    async function updateKamelets(): Promise<void> {
        await new Promise(resolve => {
            KaravanApi.getKamelets(yamls => {
                const kamelets: string[] = [];
                yamls.split("\n---\n").map(c => c.trim()).forEach(z => kamelets.push(z));
                KameletApi.saveKamelets(kamelets, true);
            })
            KaravanApi.getCustomKameletNames(names => {
                KameletApi.saveCustomKameletNames(names);
            })
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