import React, {useEffect, useState} from 'react';
import {
    Page,
    Flex,
    FlexItem,
     Spinner, Bullseye
} from '@patternfly/react-core';
import {KaravanApi} from "../api/KaravanApi";
import {SsoApi} from "../api/SsoApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import '../designer/karavan.css';
import {v4 as uuidv4} from "uuid";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import Icon from "../Logo";
import {ProjectsPage} from "../projects/ProjectsPage";
import {MainLogin} from "./MainLogin";
import {DashboardPage} from "../dashboard/DashboardPage";
import {ContainersPage} from "../containers/ContainersPage";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {AppConfig, ContainerStatus, Project, ToastMessage} from "../api/ProjectModels";
import {ProjectPage} from "../project/ProjectPage";
import {useAppConfigStore, useStatusesStore} from "../api/ProjectStore";
import {Notification} from "./Notification";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";
import {ServicesPage} from "../services/ServicesPage";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";

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