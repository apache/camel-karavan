import {KaravanApi} from "@/api/KaravanApi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {AppConfig, ContainerStatus, Project} from "@/api/ProjectModels";
import {useAppConfigStore, useProjectsStore, useStatusesStore} from "@/api/ProjectStore";
import {InfrastructureAPI} from "@/integration-designer/utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@/api/ProjectService";
import {SpiBeanApi} from "karavan-core/lib/api/SpiBeanApi";
import {MainConfigurationApi} from "karavan-core/lib/api/MainConfigurationApi";
import {useContext} from "react";
import {AuthContext} from "@/auth/AuthProvider";

export function useMainHook () {

    const [setConfig, setDockerInfo] = useAppConfigStore((s) => [s.setConfig, s.setDockerInfo], shallow)
    const [setProjects] = useProjectsStore((s) => [s.setProjects], shallow)
    const [setContainers] = useStatusesStore((state) => [state.setContainers], shallow);
    const [selectedEnv, selectEnvironment] = useAppConfigStore((state) => [state.selectedEnv, state.selectEnvironment], shallow)
    const { user } = useContext(AuthContext);

    const getStatuses = () =>  {
        if (user) {
            KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
                setContainers(statuses);
            });
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


    return { getData, getStatuses }
}