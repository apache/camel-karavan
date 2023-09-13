import {Navigate, Route, Routes} from 'react-router-dom';
import React, {useEffect, useRef} from "react";
import {KaravanApi} from "../api/KaravanApi";
import {
    Bullseye,
    Flex,
    FlexItem,
    Page,
    ProgressStep,
    ProgressStepper,
    Spinner,
    Text, TextContent, TextVariants,
    Tooltip,
    TooltipPosition
} from "@patternfly/react-core";
import Icon from "../Logo";
import {MainLogin} from "./MainLogin";
import {DashboardPage} from "../dashboard/DashboardPage";
import {ProjectsPage} from "../projects/ProjectsPage";
import {ProjectPage} from "../project/ProjectPage";
import {ServicesPage} from "../services/ServicesPage";
import {ContainersPage} from "../containers/ContainersPage";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";
import {SsoApi} from "../api/SsoApi";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";
import {useMainHook} from "./useMainHook";
import {MainDataPoller} from "./MainDataPoller";
import {TemplatesPage} from "../templates/TemplatesPage";
import {EventBus} from "../designer/utils/EventBus";
import {Notification} from "../designer/utils/Notification";

export function Main() {

    const [readiness] = useAppConfigStore((s) => [s.readiness], shallow)
    const {getData, getStatuses} = useMainHook();

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
        EventBus.sendAlert(title, text, variant)
    }

    function showSpinner() {
        return KaravanApi.authType === undefined || readiness === undefined;
    }

    function showStepper() {
        return readiness !== undefined && readiness.status !== true;
    }

    function getStepper() {
        const steps: any[] = Array.isArray(readiness?.checks) ? readiness.checks : [];
        return (
            <Bullseye className="">
                <Flex direction={{default:"column"}} justifyContent={{default: "justifyContentCenter"}}>
                    <FlexItem style={{textAlign: "center"}}>
                        {Icon()}
                        <TextContent>
                            <Text component={TextVariants.h2}>
                                Waiting for services
                            </Text>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <ProgressStepper aria-label="Readiness progress" isCenterAligned isVertical >
                            {steps.map(step => (
                                <ProgressStep
                                    variant={step.status === 'UP' ? "success" : "info"}
                                    isCurrent={step.status !== 'UP'}
                                    icon={step.status !== 'UP' ? <Spinner isInline aria-label="Loading..."/> : undefined}
                                    id={step.name}
                                    titleId={step.name}
                                    aria-label={step.name}
                                >
                                    {step.name}
                                </ProgressStep>
                            ))}
                        </ProgressStepper>
                    </FlexItem>
                </Flex>
            </Bullseye>
        )
    }

    function showMain() {
        return !showStepper() && !showSpinner() && (KaravanApi.isAuthorized || KaravanApi.authType === 'public');
    }

    return (
        <Page className="karavan">
            {showSpinner() &&
                <Bullseye className="loading-page">
                    <Spinner className="spinner" diameter="140px" aria-label="Loading..."/>
                    <Tooltip content="Connecting to server..." position={TooltipPosition.bottom}>
                        <div className="logo-placeholder">{Icon()}</div>
                    </Tooltip>
                </Bullseye>
            }
            {showStepper() && getStepper()}
            {showMain() &&
                <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                      alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                    <FlexItem>
                        {<PageNavigation/>}
                    </FlexItem>
                    <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                        <Routes>
                            {/*<Route path="/dashboard" element={<DashboardPage key={'dashboard'}/>}/>*/}
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
