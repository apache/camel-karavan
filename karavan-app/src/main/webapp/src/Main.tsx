import React from 'react';
import {
    Page,
    PageHeader,
    PageSidebar,
    NavItem,
    NavList,
    Nav,
    ModalVariant,
    Button,
    Modal,
    Alert,
    AlertActionCloseButton,
    Flex,
    FlexItem,
    Avatar,
    PageHeaderTools,
    PageHeaderToolsGroup,
    PageHeaderToolsItem,
    Dropdown,
    DropdownToggle,
    NavExpandable,
    NavGroup,
    Tabs,
    Tab,
    PageSection,
    Badge,
    Tooltip,
    Divider
} from '@patternfly/react-core';
import {KaravanApi} from "./api/KaravanApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import './designer/karavan.css';
import {ConfigurationPage} from "./config/ConfigurationPage";
import {KameletsPage} from "./kamelets/KameletsPage";
import {v4 as uuidv4} from "uuid";
import avatarImg from './avatarImg.svg';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import Icon from "./Logo";
import {ComponentsPage} from "./components/ComponentsPage";
import {EipPage} from "./eip/EipPage";
import {OpenApiPage} from "./integrations/OpenApiPage";
import {ProjectsPage} from "./projects/ProjectsPage";
import {Project} from "./models/ProjectModels";
import {ProjectPage} from "./projects/ProjectPage";
import TachometerAltIcon from "@patternfly/react-icons/dist/js/icons/tachometer-alt-icon";
import UsersIcon from "@patternfly/react-icons/dist/js/icons/users-icon";
import ProjectsIcon from "@patternfly/react-icons/dist/js/icons/repository-icon";
import KameletsIcon from "@patternfly/react-icons/dist/js/icons/registry-icon";
import EipIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import ComponentsIcon from "@patternfly/react-icons/dist/js/icons/module-icon";
import ConfigurationIcon from "@patternfly/react-icons/dist/js/icons/cogs-icon";

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
    version: string,
    mode: 'local' | 'gitops' | 'serverless',
    isNavOpen: boolean,
    pageId: string,
    projects: Project[],
    project?: Project,
    isModalOpen: boolean,
    projectToDelete?: Project,
    openapi: string,
    alerts: ToastMessage[],
    request: string
    filename: string
}

export class Main extends React.Component<Props, State> {

    public state: State = {
        version: '',
        mode: 'local',
        isNavOpen: true,
        pageId: "projects",
        projects: [],
        isModalOpen: false,
        alerts: [],
        request: uuidv4(),
        openapi: '',
        filename: ''
    };

    designer = React.createRef();

    componentDidMount() {
        KaravanApi.getConfiguration((config: any) => {
            this.setState({
                version: config?.['karavan.version'],
                mode: config?.['karavan.mode'],
            })
        });
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
    };

    toolBar = (version: string) => (
        <div className="top-toolbar">
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}}
                  style={{width: "100%"}}>
                <FlexItem style={{marginTop: "auto", marginBottom: "auto"}}>
                    {/*<FlexItem>*/}
                    {/*    <TextContent>*/}
                    {/*        <Text component={TextVariants.h5}>{"v. " + version}</Text>*/}
                    {/*    </TextContent>*/}
                    {/*</FlexItem>*/}
                </FlexItem>
                <FlexItem style={{marginTop: "auto", marginBottom: "auto"}}>
                    <PageHeaderTools>
                        <PageHeaderToolsGroup>
                            <PageHeaderToolsItem>
                                <Avatar src={avatarImg} alt="avatar" border="dark"/>
                            </PageHeaderToolsItem>
                            <PageHeaderToolsItem>
                                <Dropdown
                                    isPlain
                                    position="right"
                                    onSelect={event => {
                                    }}
                                    isOpen={false}
                                    toggle={<DropdownToggle onToggle={isOpen => {
                                    }}>cameleer</DropdownToggle>}
                                    // dropdownItems={userDropdownItems}
                                />
                            </PageHeaderToolsItem>
                        </PageHeaderToolsGroup>
                    </PageHeaderTools>
                </FlexItem>
            </Flex>
        </div>
    )

    header = (version: string) => (
        <PageHeader className="page-header"
                    onNavToggle={this.onNavToggle}
                    showNavToggle
                    logo={Icon()}
                    headerTools={this.toolBar(version)}
        />
    );


    pageNav = () => {
        const pages: MenuItem[] = [
            new MenuItem("dashboard", "Dashboard", <TachometerAltIcon/>),
            new MenuItem("projects", "Projects", <ProjectsIcon/>),
            new MenuItem("eip", "Enterprise Integration Patterns", <EipIcon/>),
            new MenuItem("kamelets", "Kamelets", <KameletsIcon/>),
            new MenuItem("components", "Components", <ComponentsIcon/>),
            new MenuItem("acl", "Access Control", <UsersIcon/>),
            new MenuItem("configuration", "Configuration", <ConfigurationIcon/>)
        ]
        return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height:"100%"}}>
            <FlexItem alignSelf={{default:"alignSelfCenter"}}>
                <Tooltip content={"Apache Camel Karavan"} position={"right"}>
                    {Icon()}
                </Tooltip>
            </FlexItem>
            {pages.map(page =>
                <FlexItem>
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
            <FlexItem alignSelf={{default:"alignSelfCenter"}}>
                <Avatar src={avatarImg} alt="avatar" border="dark"/>
            </FlexItem>
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

    onGetProjects() {
        KaravanApi.getProjects((projects: []) => {
            this.setState({
                projects: projects, request: uuidv4()
            })
        });
    }

    render() {
        return (
            <Page className="karavan">
                <Flex style={{width: "100%", height:"100%"}} alignItems={{default:"alignItemsStretch"}} spaceItems={{ default: 'spaceItemsNone' }}>
                    <FlexItem>
                        {this.pageNav()}
                    </FlexItem>
                    <FlexItem flex={{default:"flex_2"}} style={{height:"100%"}}>
                        {this.state.pageId === 'projects' &&
                            <ProjectsPage key={this.state.request}
                                          projects={this.state.projects}
                                          onDelete={this.onProjectDelete}
                                          onSelect={this.onProjectSelect}
                                          onRefresh={() => {
                                              this.onGetProjects();
                                          }}
                                          onCreate={this.onProjectCreate}/>}
                        {this.state.pageId === 'project' && this.state.project && <ProjectPage project={this.state.project}/>}
                        {this.state.pageId === 'configuration' && <ConfigurationPage/>}
                        {this.state.pageId === 'kamelets' && <KameletsPage dark={false}/>}
                        {this.state.pageId === 'components' && <ComponentsPage dark={false}/>}
                        {this.state.pageId === 'eip' && <EipPage dark={false}/>}
                        {this.state.pageId === 'openapi' &&
                            <OpenApiPage dark={false} openapi={this.state.openapi} filename={this.state.filename}/>}
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
                    <div>{"Are you sure you want to delete the project " + this.state.projectToDelete?.name + "?"}</div>
                </Modal>
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