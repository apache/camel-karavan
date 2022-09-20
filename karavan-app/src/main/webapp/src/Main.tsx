import React from 'react';
import {
    Page,
    ModalVariant,
    Button,
    Modal,
    Alert,
    AlertActionCloseButton,
    Flex,
    FlexItem,
    Avatar,
    Tooltip,
    Divider, Spinner, Bullseye, Popover, Badge
} from '@patternfly/react-core';
import {KaravanApi} from "./api/KaravanApi";
import {SsoApi} from "./api/SsoApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import './designer/karavan.css';
import {ConfigurationPage} from "./config/ConfigurationPage";
import {KameletsPage} from "./kamelets/KameletsPage";
import {v4 as uuidv4} from "uuid";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import Icon from "./Logo";
import {ComponentsPage} from "./components/ComponentsPage";
import {EipPage} from "./eip/EipPage";
import {ProjectsPage} from "./projects/ProjectsPage";
import {Project} from "./projects/ProjectModels";
import {ProjectPage} from "./projects/ProjectPage";
import UserIcon from "@patternfly/react-icons/dist/js/icons/user-icon";
import ProjectsIcon from "@patternfly/react-icons/dist/js/icons/repository-icon";
import KameletsIcon from "@patternfly/react-icons/dist/js/icons/registry-icon";
import EipIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import ComponentsIcon from "@patternfly/react-icons/dist/js/icons/module-icon";
import ConfigurationIcon from "@patternfly/react-icons/dist/js/icons/cogs-icon";
import {MainLogin} from "./MainLogin";

class ToastMessage {
    id: string = ''
    text: string = ''
    title: string = ''
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';

    constructor(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') {
        this.id = uuidv4();
        this.title = title;
        this.text = text;
        this.variant = variant;
    }
}

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

interface Props {
}

interface State {
    config: any,
    isNavOpen: boolean,
    pageId: string,
    projects: Project[],
    project?: Project,
    isModalOpen: boolean,
    projectToDelete?: Project,
    openapi: string,
    alerts: ToastMessage[],
    request: string,
    filename: string,
    key: string,
    showUser?: boolean,
}

export class Main extends React.Component<Props, State> {

    public state: State = {
        config: {},
        isNavOpen: true,
        pageId: "projects",
        projects: [],
        isModalOpen: false,
        alerts: [],
        request: uuidv4(),
        openapi: '',
        filename: '',
        key: '',
    };

    designer = React.createRef();

    componentDidMount() {
        KaravanApi.getAuthType((authType: string) => {
            console.log("authType", authType);
            if (authType === 'oidc') {
                SsoApi.auth(() => {
                    KaravanApi.getMe((user: any) => {
                        console.log("me", user);
                        this.getData();
                    });
                });
            } else {
                this.setState({key: Math.random().toString()})
            }
        });
        console.log("KaravanApi.isAuthorized", KaravanApi.isAuthorized);
        if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
            this.getData();
        }
    }

    onLogin = (username: string, password: string) => {
        KaravanApi.auth(username, password, (res: any) => {
            if (res?.status === 200) {
                this.getData();
            } else {
                this.toast("Error", "Incorrect username and/or password!", "danger");
            }
        });
    }

    getData() {
        KaravanApi.getKameletNames(names => names.forEach(name => {
            KaravanApi.getKamelet(name, yaml => KameletApi.saveKamelet(yaml))
        }));
        KaravanApi.getComponentNames(names => names.forEach(name => {
            KaravanApi.getComponent(name, json => ComponentApi.saveComponent(json))
        }));
        this.onGetProjects();
    }

    onNavToggle = () => {
        this.setState({
            isNavOpen: !this.state.isNavOpen
        });
    };

    onNavSelect = (result: any) => {
        if (result.itemId === 'integrations') {
            this.onGetProjects();
        }
        this.setState({
            pageId: result.itemId,
        });
    }

    pageNav = () => {
        const pages: MenuItem[] = [
            // new MenuItem("dashboard", "Dashboard", <TachometerAltIcon/>),
            new MenuItem("projects", "Projects", <ProjectsIcon/>),
            new MenuItem("eip", "Enterprise Integration Patterns", <EipIcon/>),
            new MenuItem("kamelets", "Kamelets", <KameletsIcon/>),
            new MenuItem("components", "Components", <ComponentsIcon/>),
            new MenuItem("configuration", "Configuration", <ConfigurationIcon/>)
        ]
        return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height:"100%"}} spaceItems={{default:"spaceItemsNone"}}>
            <FlexItem alignSelf={{default:"alignSelfCenter"}}>
                <Tooltip className="logo-tooltip" content={"Apache Camel Karavan " + this.state.config.version} position={"right"}>
                    {Icon()}
                </Tooltip>
            </FlexItem>
            {pages.map(page =>
                <FlexItem key={page.pageId} className={this.state.pageId === page.pageId ? "nav-button-selected" : ""}>
                    <Tooltip content={page.tooltip} position={"right"}>
                        <Button id={page.pageId} icon={page.icon} variant={"plain"}
                                className={this.state.pageId === page.pageId ? "nav-button-selected" : ""}
                                onClick={event => this.setState({pageId: page.pageId})}
                        />
                    </Tooltip>
                </FlexItem>
            )}
            <FlexItem flex={{default:"flex_2"}} alignSelf={{default:"alignSelfCenter"}}>
                <Divider/>
            </FlexItem>
            {KaravanApi.authType !== 'public' &&
                <FlexItem alignSelf={{default:"alignSelfCenter"}}>
                    <Popover
                        aria-label="Current user"
                        position={"right-end"}
                        hideOnOutsideClick={false}
                        isVisible={this.state.showUser === true}
                        shouldClose={tip => this.setState({showUser: false})}
                        shouldOpen={tip => this.setState({showUser: true})}
                        headerContent={<div>{KaravanApi.me.userName}</div>}
                        bodyContent={
                            <Flex direction={{default:"row"}}>
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

    onProjectDelete = (project: Project) => {
        this.setState({isModalOpen: true, projectToDelete: project})
    };

    deleteErrorMessage = (id: string) => {
        this.setState({alerts: this.state.alerts.filter(a => a.id !== id)})
    }
    deleteProject = () => {
        if (this.state.projectToDelete)
            KaravanApi.deleteProject(this.state.projectToDelete, res => {
                if (res.status === 204) {
                    this.toast("Success", "Project deleted", "success");
                    this.onGetProjects();
                } else {
                    this.toast("Error", res.statusText, "danger");
                }
            });
        this.setState({isModalOpen: false})
    }

    toast = (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => {
        const mess = [];
        mess.push(...this.state.alerts, new ToastMessage(title, text, variant));
        this.setState({alerts: mess})
    }

    onProjectSelect = (project: Project) => {
        this.setState({isNavOpen: true, pageId: 'project', project: project});
    };

    onProjectCreate = (project: Project) => {
        KaravanApi.postProject(project, res => {
            console.log(res.status)
            if (res.status === 200 || res.status === 201) {
                this.toast("Success", "Project created", "success");
                this.setState({isNavOpen: true, pageId: 'project', project: project});
            } else {
                this.toast("Error", res.status + ", " + res.statusText, "danger");
            }
        });
    };

    onGetProjects = () => {
        KaravanApi.getConfiguration((config: any) => {
            KaravanApi.getProjects((projects: Project[]) => {
                this.setState({
                    projects: projects, request: uuidv4(), config: config
                })
            });
        });

    }

    getMain() {
        return (
            <>
                <Flex direction={{default:"row"}} style={{width: "100%", height:"100%"}} alignItems={{default:"alignItemsStretch"}} spaceItems={{ default: 'spaceItemsNone' }}>
                    <FlexItem>
                        {this.pageNav()}
                    </FlexItem>
                    <FlexItem flex={{default:"flex_2"}} style={{height:"100%"}}>
                        {this.state.pageId === 'projects' &&
                            <ProjectsPage key={this.state.request}
                                          projects={this.state.projects}
                                          config={this.state.config}
                                          onDelete={this.onProjectDelete}
                                          onSelect={this.onProjectSelect}
                                          onRefresh={() => {
                                              this.onGetProjects();
                                          }}
                                          onCreate={this.onProjectCreate}/>}
                        {this.state.pageId === 'project' && this.state.project && <ProjectPage project={this.state.project} config={this.state.config}/>}
                        {this.state.pageId === 'configuration' && <ConfigurationPage/>}
                        {this.state.pageId === 'kamelets' && <KameletsPage dark={false}/>}
                        {this.state.pageId === 'components' && <ComponentsPage dark={false}/>}
                        {this.state.pageId === 'eip' && <EipPage dark={false}/>}
                    </FlexItem>
                </Flex>
                <Modal
                    title="Confirmation"
                    variant={ModalVariant.small}
                    isOpen={this.state.isModalOpen}
                    onClose={() => this.setState({isModalOpen: false})}
                    actions={[
                        <Button key="confirm" variant="primary" onClick={e => this.deleteProject()}>Delete</Button>,
                        <Button key="cancel" variant="link"
                                onClick={e => this.setState({isModalOpen: false})}>Cancel</Button>
                    ]}
                    onEscapePress={e => this.setState({isModalOpen: false})}>
                    <div>{"Are you sure you want to delete the project " + this.state.projectToDelete?.projectId + "?"}</div>
                </Modal>
            </>
        )
    }

    render() {
        return (
            <Page className="karavan">
                {KaravanApi.authType === undefined && <Bullseye className="loading-page">
                    <Spinner className="spinner" isSVG diameter="140px" aria-label="Loading..." />
                    <div className="logo-placeholder">{Icon()}</div>
                </Bullseye>}
                {(KaravanApi.isAuthorized || KaravanApi.authType === 'public') && this.getMain()}
                {!KaravanApi.isAuthorized && KaravanApi.authType === 'basic' && <MainLogin config={this.state.config} onLogin={this.onLogin}/>}
                {this.state.alerts.map((e: ToastMessage) => (
                    <Alert key={e.id} className="main-alert" variant={e.variant} title={e.title}
                           timeout={e.variant === "success" ? 1000 : 2000}
                           actionClose={<AlertActionCloseButton onClose={() => this.deleteErrorMessage(e.id)}/>}>
                        {e.text}
                    </Alert>
                ))}
            </Page>
        )
    }
}