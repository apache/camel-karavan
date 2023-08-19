import {Routes, Route, Navigate} from 'react-router-dom';
import React, {useEffect, useRef} from "react";
import {KaravanApi} from "../api/KaravanApi";
import {Bullseye, Flex, FlexItem, Page, Spinner} from "@patternfly/react-core";
import Icon from "../Logo";
import {MainLogin} from "./MainLogin";
import {DashboardPage} from "../dashboard/DashboardPage";
import {ProjectsPage} from "../projects/ProjectsPage";
import {ProjectPage} from "../project/ProjectPage";
import {ServicesPage} from "../services/ServicesPage";
import {ContainersPage} from "../containers/ContainersPage";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {ToastMessage} from "../api/ProjectModels";
import {SsoApi} from "../api/SsoApi";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";
import {Notification} from "./Notification";
import {useMainHook} from "./useMainHook";
import {MainDataPoller} from "./MainDataPoller";
import {TemplatesPage} from "../templates/TemplatesPage";

export const Main = () => {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const { getData, getStatuses } = useMainHook();

    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            effect()
        }
    }, [])

    function effect() {
        console.log("Main Start");
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
        };
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
                            <Route path="/templates" element={<TemplatesPage key={'templates'}/>}/>
                            <Route path="/services" element={<ServicesPage key="services"/>}/>
                            <Route path="/containers" element={<ContainersPage key="services"/>}/>
                            <Route path="/knowledgebase" element={<KnowledgebasePage dark={false}/>}/>
                            <Route path="*" element={<Navigate to="/projects" replace/>}/>
                        </Routes>
                    </FlexItem>
                </Flex>
            }
            {!KaravanApi.isAuthorized && KaravanApi.authType === 'basic' &&
                <MainLogin/>}
            <Notification/>
            <MainDataPoller/>
        </Page>
    );
};
