import React, {useEffect, useState} from 'react';

import {KaravanApi} from "../api/KaravanApi";
import {SsoApi} from "../api/SsoApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import '../designer/karavan.css';
import {v4 as uuidv4} from "uuid";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {AppConfig, ContainerStatus} from "../api/ProjectModels";
import {useAppConfigStore, useStatusesStore} from "../api/ProjectStore";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";

export const DataPoller = () => {

    const [config, pageId, setPageId, setConfig] = useAppConfigStore((state) => [state.config, state.pageId, state.setPageId, state.setConfig], shallow)
    const [setContainers] = useStatusesStore((state) => [state.setContainers], shallow);
    const [request, setRequest] = useState<string>(uuidv4());

    useEffect(() => {
        console.log("DataPoller Start");
        const interval = setInterval(() => {
            getStatuses();
        }, 1000);
        return () => {
            console.log("DataPoller End");
            clearInterval(interval);
        };
    }, []);

    function getStatuses() {
        if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
            KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
                setContainers(statuses);
            });
        }
    }

    function getData() {
        if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
            KaravanApi.getConfiguration((config: AppConfig) => {
                setRequest(uuidv4());
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

    return (
        <React.Fragment></React.Fragment>
    )
}