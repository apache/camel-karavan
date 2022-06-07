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
    PageHeaderToolsItem, Dropdown, DropdownToggle, NavExpandable, NavGroup
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

interface Props {
}

interface State {
    version: string,
    mode: 'local' | 'gitops' | 'serverless',
    isNavOpen: boolean,
    pageId: 'projects' | 'project' | 'configuration' | 'kamelets' | 'designer' | "components" | "eip" | "openapi" | "acl"
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

    pageNav = () => (<Nav onSelect={this.onNavSelect}>
        <NavList>
            <NavItem id="projects" to="#" itemId={'projects'}
                     isActive={this.state.pageId === 'projects'}>
                Projects
            </NavItem>
            <NavItem id="configuration" to="#" itemId={"configuration"}
                     isActive={this.state.pageId === 'configuration'}>
                Configuration
            </NavItem>
            <NavItem id="acl" to="#" itemId={"acl"}
                     isActive={this.state.pageId === 'acl'}>
                User Management
            </NavItem>
            <NavExpandable id="help" title={"Help"} isExpanded={false}>
                <NavItem id="eip" to="#" itemId={"eip"}
                         isActive={this.state.pageId === 'eip'}>
                    Enterprise Integration Patterns
                </NavItem>
                <NavItem id="kamelets" to="#" itemId={"kamelets"}
                         isActive={this.state.pageId === 'kamelets'}>
                    Kamelets
                </NavItem>
                <NavItem id="components" to="#" itemId={"components"}
                         isActive={this.state.pageId === 'components'}>
                    Components
                </NavItem>
            </NavExpandable>
        </NavList>
    </Nav>);

    sidebar = () => (<PageSidebar nav={this.pageNav()} isNavOpen={this.state.isNavOpen}/>);

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
            <Page className="karavan" header={this.header(this.state.version)} sidebar={this.sidebar()}>
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