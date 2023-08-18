import {Routes, Route, useNavigate, Navigate} from 'react-router-dom';
import {useLocation} from 'react-router-dom';
import React, {useEffect, useState} from "react";
import {KaravanApi} from "../api/KaravanApi";
import {Bullseye, Flex, FlexItem, Page, Spinner} from "@patternfly/react-core";
import Icon from "../Logo";
import {MainLogin} from "./MainLogin";
import {Notification} from "./Notification";
import {DashboardPage} from "../dashboard/DashboardPage";
import {ProjectsPage} from "../projects/ProjectsPage";
import {ProjectPage} from "../project/ProjectPage";
import {ServicesPage} from "../services/ServicesPage";
import {ContainersPage} from "../containers/ContainersPage";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {AppConfig, ContainerStatus, Project, ToastMessage} from "../api/ProjectModels";
import {SsoApi} from "../api/SsoApi";
import {v4 as uuidv4} from "uuid";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {useAppConfigStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";

export const Main = () => {

    const [config, pageId, setPageId, setConfig] = useAppConfigStore((state) => [state.config, state.pageId, state.setPageId, state.setConfig], shallow)
    const [setContainers] = useStatusesStore((state) => [state.setContainers], shallow);
    const [request, setRequest] = useState<string>(uuidv4());
    let location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Main Start");
        const interval = setInterval(() => {
            getStatuses();
        }, 1000);
        const sub = ProjectEventBus.onSelectProject()?.subscribe((project: Project | undefined) => {
            if (project) setPageId("project");
        });
        KaravanApi.getAuthType((authType: string) => {
            console.log("authType", authType);
            if (authType === 'oidc') {
                SsoApi.auth(() => {
                    KaravanApi.getMe((user: any) => {
                        getData();
                    });
                });
            }
            getData();
        });
        return () => {
            console.log("Main End");
            clearInterval(interval);
            sub?.unsubscribe();
        };
    }, []);

    function onLogin(username: string, password: string) {
        KaravanApi.auth(username, password, (res: any) => {
            if (res?.status === 200) {
                getData();
            } else {
                toast("Error", "Incorrect username and/or password!", "danger");
            }
        });
    }

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

    function toast(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'custom') {
        ProjectEventBus.sendAlert(new ToastMessage(title, text, variant))
    }

    return (
        <Page className="karavan">
            {KaravanApi.authType === undefined &&
                <Bullseye className="loading-page">
                    <Spinner className="spinner" diameter="140px" aria-label="Loading..."/>
                    <div className="logo-placeholder">{Icon()}</div>
                </Bullseye>}
            {(KaravanApi.isAuthorized || KaravanApi.authType === 'public') &&
                <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                      alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                    <FlexItem>
                        {<PageNavigation/>}
                    </FlexItem>
                    <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage key={'dashboard'}/>}/>
                            <Route path="/projects" element={<ProjectsPage key={'projects'}/>}/>
                            <Route path="/projects/:projectId" element={<ProjectPage key={'project'}/>}/>
                            <Route path="/services" element={<ServicesPage key="services"/>}/>
                            <Route path="/containers" element={<ContainersPage key="services"/>}/>
                            <Route path="/knowledgebase" element={<KnowledgebasePage dark={false}/>}/>
                            <Route path="*" element={<Navigate to="/projects" replace/>}/>
                        </Routes>
                    </FlexItem>
                </Flex>
            }
            {!KaravanApi.isAuthorized && KaravanApi.authType === 'basic' &&
                <MainLogin config={config} onLogin={onLogin}/>}
            <Notification/>
        </Page>
    );
};
