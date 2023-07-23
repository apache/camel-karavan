import React, {useEffect, useState} from 'react';
import {
    Page,
    Button,
    Flex,
    FlexItem,
    Tooltip,
    Divider, Spinner, Bullseye, Popover, Badge
} from '@patternfly/react-core';
import {KaravanApi} from "./api/KaravanApi";
import {SsoApi} from "./api/SsoApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import './designer/karavan.css';
import {v4 as uuidv4} from "uuid";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import Icon from "./Logo";
import {ProjectsPage} from "./projects/ProjectsPage";
import UserIcon from "@patternfly/react-icons/dist/js/icons/user-icon";
import ProjectsIcon from "@patternfly/react-icons/dist/js/icons/repository-icon";
import KnowledgebaseIcon from "@patternfly/react-icons/dist/js/icons/book-open-icon";
import ContainersIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import DashboardIcon from "@patternfly/react-icons/dist/js/icons/tachometer-alt-icon";
import ServicesIcon from "@patternfly/react-icons/dist/js/icons/services-icon";
import ComponentsIcon from "@patternfly/react-icons/dist/js/icons/module-icon";
import {MainLogin} from "./MainLogin";
import {DashboardPage} from "./dashboard/DashboardPage";
import {ContainersPage} from "./containers/ContainersPage";
import {ProjectEventBus} from "./api/ProjectEventBus";
import {AppConfig, ContainerStatus, Project, ToastMessage} from "./api/ProjectModels";
import {ProjectPage} from "./project/ProjectPage";
import {useAppConfigStore, useDevModeStore, useFileStore, useProjectStore} from "./api/ProjectStore";
import {Notification} from "./Notification";
import {InfrastructureAPI} from "./designer/utils/InfrastructureAPI";
import {KnowledgebasePage} from "./knowledgebase/KnowledgebasePage";
import {ServicesPage} from "./services/ServicesPage";
import {shallow} from "zustand/shallow";

class MenuItem {
    pageId: string = '';
    tooltip: string = '';
    icon: any;

    constructor(pageId: string, tooltip: string, icon: any) {
        this.pageId = pageId;
        this.tooltip = tooltip;
        this.icon = icon;
    }
}

export const Main = () => {

    const [config, setConfig] = useAppConfigStore((state) => [state.config, state.setConfig], shallow)
    const [pageId, setPageId] = useState<string>('projects');
    const [request, setRequest] = useState<string>(uuidv4());
    const [showUser, setShowUser] = useState<boolean>(false);

    useEffect(() => {
        console.log("Main Start");
        const sub = ProjectEventBus.onSelectProject()?.subscribe((project: Project | undefined) => {
            if (project) setPageId("project");
        });
        KaravanApi.getAuthType((authType: string) => {
            console.log("authType", authType);
            if (authType === 'oidc') {
                SsoApi.auth(() => {
                    KaravanApi.getMe((user: any) => {
                        console.log("me", user);
                        getData();
                    });
                });
            }
            if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
                getData();
            }
        });
        return () => {
            console.log("Main End");
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

    function getData() {
        KaravanApi.getConfiguration((config: AppConfig) => {
            setRequest(uuidv4());
            setConfig(config);
            useAppConfigStore.setState({config: config});
            InfrastructureAPI.infrastructure = config.infrastructure;
        });
        updateKamelets();
        updateComponents();
        // updateSupportedComponents(); // not implemented yet
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

    function getMenu() : MenuItem[]  {
        const pages: MenuItem[] = [
            new MenuItem("dashboard", "Dashboard", <DashboardIcon/>),
            new MenuItem("projects", "Projects", <ProjectsIcon/>),
        ]
        if (config.infrastructure === 'docker') {
            pages.push(
                new MenuItem("services", "Services", <ServicesIcon/>),
                new MenuItem("containers", "Containers", <ContainersIcon/>)
            )
        }
        pages.push(new MenuItem("knowledgebase", "Knowledgebase", <KnowledgebaseIcon/>));
        return pages;
    }

    function pageNav() {
        return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height: "100%"}}
                      spaceItems={{default: "spaceItemsNone"}}>
            <FlexItem alignSelf={{default: "alignSelfCenter"}}>
                <Tooltip className="logo-tooltip" content={"Apache Camel Karavan " + config.version}
                         position={"right"}>
                    {Icon()}
                </Tooltip>
            </FlexItem>
            {getMenu().map(page =>
                <FlexItem key={page.pageId} className={pageId === page.pageId ? "nav-button-selected" : ""}>
                    <Tooltip content={page.tooltip} position={"right"}>
                        <Button id={page.pageId} icon={page.icon} variant={"plain"}
                                className={pageId === page.pageId ? "nav-button-selected" : ""}
                                onClick={event => {
                                    useFileStore.setState({operation: 'none', file: undefined})
                                    useDevModeStore.setState({podName: undefined, status: "none"})
                                    useProjectStore.setState({containerStatus: new ContainerStatus({}),})
                                    setPageId(page.pageId);
                                }}
                        />
                    </Tooltip>
                </FlexItem>
            )}
            <FlexItem flex={{default: "flex_2"}} alignSelf={{default: "alignSelfCenter"}}>
                <Divider/>
            </FlexItem>
            {KaravanApi.authType !== 'public' &&
                <FlexItem alignSelf={{default: "alignSelfCenter"}}>
                    <Popover
                        aria-label="Current user"
                        position={"right-end"}
                        hideOnOutsideClick={false}
                        isVisible={showUser}
                        shouldClose={tip => setShowUser(false)}
                        shouldOpen={tip => setShowUser(true)}
                        headerContent={<div>{KaravanApi.me.userName}</div>}
                        bodyContent={
                            <Flex direction={{default: "row"}}>
                                {KaravanApi.me.roles && Array.isArray(KaravanApi.me.roles)
                                    && KaravanApi.me.roles
                                        .filter((r: string) => ['administrator', 'developer', 'viewer'].includes(r))
                                        .map((role: string) => <Badge id={role} isRead>{role}</Badge>)}
                            </Flex>
                        }
                    >
                        <UserIcon className="avatar"/>
                    </Popover>
                </FlexItem>}
        </Flex>)
    }

    function toast(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') {
        ProjectEventBus.sendAlert(new ToastMessage(title, text, variant))
    }

    function getMain() {
        return (
            <>
                <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                      alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                    <FlexItem>
                        {pageNav()}
                    </FlexItem>
                    <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                        {pageId === 'dashboard' && <DashboardPage key='dashboard'/>}
                        {pageId === 'projects' && <ProjectsPage key={request}/>}
                        {pageId === 'project' && <ProjectPage key="projects"/>}
                        {pageId === 'services' && <ServicesPage key="services"/>}
                        {pageId === 'containers' && <ContainersPage key="containers"/>}
                        {pageId === 'knowledgebase' && <KnowledgebasePage dark={false}/>}
                    </FlexItem>
                </Flex>
            </>
        )
    }

    return (
        <Page className="karavan">
            {KaravanApi.authType === undefined &&
                <Bullseye className="loading-page">
                    <Spinner className="spinner" isSVG diameter="140px" aria-label="Loading..."/>
                    <div className="logo-placeholder">{Icon()}</div>
                </Bullseye>}
            {(KaravanApi.isAuthorized || KaravanApi.authType === 'public') && getMain()}
            {!KaravanApi.isAuthorized && KaravanApi.authType === 'basic' &&
                <MainLogin config={config} onLogin={onLogin}/>}
            <Notification/>
        </Page>
    )
}