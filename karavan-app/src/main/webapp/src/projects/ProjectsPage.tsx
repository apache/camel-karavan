import React from 'react';
import {
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    TextInput,
    PageSection,
    TextContent,
    Text,
    Button,
    Modal,
    FormGroup,
    ModalVariant,
    Form,
    Badge,
    Tooltip,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
    OverflowMenu,
    OverflowMenuContent,
    OverflowMenuGroup,
    OverflowMenuItem,
    Flex, FlexItem, Radio
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {DeploymentStatus, Project} from "./ProjectModels";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import {CamelUi} from "../designer/utils/CamelUi";
import {KaravanApi} from "../api/KaravanApi";
import {QuarkusIcon, SpringIcon} from "../designer/utils/KaravanIcons";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";

interface Props {
    config: any,
    onSelect: (project: Project) => void
    toast: (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => void
}

interface State {
    projects: Project[],
    deploymentStatuses: DeploymentStatus[],
    isCreateModalOpen: boolean,
    isDeleteModalOpen: boolean,
    isCopy: boolean,
    projectToCopy?: Project,
    projectToDelete?: Project,
    filter: string,
    name: string,
    description: string,
    projectId: string,
    runtime: string,
}

export class ProjectsPage extends React.Component<Props, State> {

    public state: State = {
        projects: [],
        deploymentStatuses: [],
        isCreateModalOpen: false,
        isDeleteModalOpen: false,
        isCopy: false,
        filter: '',
        name: '',
        description: '',
        projectId: '',
        runtime: this.props.config.runtime
    };
    interval: any;

    componentDidMount() {
        this.interval = setInterval(() => this.onGetProjects(), 1300);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onProjectDelete = (project: Project) => {
        this.setState({isDeleteModalOpen: true, projectToDelete: project})
    };


    deleteProject = () => {
        if (this.state.projectToDelete)
            KaravanApi.deleteProject(this.state.projectToDelete, res => {
                if (res.status === 204) {
                    this.props.toast?.call(this, "Success", "Project deleted", "success");
                    this.onGetProjects();
                } else {
                    this.props.toast?.call(this, "Error", res.statusText, "danger");
                }
            });
        this.setState({isDeleteModalOpen: false})
    }

    onProjectCreate = (project: Project) => {
        KaravanApi.postProject(project, res => {
            console.log(res.status)
            if (res.status === 200 || res.status === 201) {
                this.props.toast?.call(this, "Success", "Project created", "success");
            } else {
                this.props.toast?.call(this, "Error", res.status + ", " + res.statusText, "danger");
            }
        });
    };

    onGetProjects = () => {
        KaravanApi.getProjects((projects: Project[]) => {
            this.setState({projects: projects})
        });
        KaravanApi.getDeploymentStatuses(this.props.config.environment, (statuses: DeploymentStatus[]) => {
            this.setState({deploymentStatuses: statuses});
        });
    }

    tools = () => (<Toolbar id="toolbar-group-types">
        <ToolbarContent>
            <ToolbarItem>
                <Button variant="link" icon={<RefreshIcon/>} onClick={e => this.onGetProjects()}/>
            </ToolbarItem>
            <ToolbarItem>
                <TextInput className="text-field" type="search" id="search" name="search"
                           autoComplete="off" placeholder="Search by name"
                           value={this.state.filter}
                           onChange={e => this.setState({filter: e})}/>
            </ToolbarItem>
            <ToolbarItem>
                <Button icon={<PlusIcon/>} onClick={e => this.setState({isCreateModalOpen: true, isCopy: false})}>Create</Button>
            </ToolbarItem>
        </ToolbarContent>
    </Toolbar>);

    title = () => (<TextContent>
        <Text component="h1">Projects</Text>
    </TextContent>);

    closeModal = () => {
        this.setState({isCreateModalOpen: false, isCopy: false, name: this.props.config.groupId, description: '', projectId: ''});
        this.onGetProjects();
    }

    saveAndCloseCreateModal = () => {
        const {name, description, projectId, runtime} = this.state;
        const p = new Project(projectId, name, description, runtime, '');
        this.onProjectCreate(p);
        this.setState({isCreateModalOpen: false, isCopy: false, name: this.props.config.groupId, description: '', projectId: ''});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.name !== undefined && this.state.description !== undefined && this.state.projectId !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        const {isCopy, projectToCopy, projectId, name, isCreateModalOpen} = this.state;
        const {runtimes} = this.props.config;
        return (
            <Modal
                title={!isCopy ? "Create new project" : "Copy project from " + projectToCopy?.projectId}
                variant={ModalVariant.small}
                isOpen={isCreateModalOpen}
                onClose={this.closeModal}
                onKeyDown={this.onKeyDown}
                actions={[
                    <Button key="confirm" variant="primary" onClick={this.saveAndCloseCreateModal}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={this.closeModal}>Cancel</Button>
                ]}
                className="new-project"
            >
                <Form isHorizontal={true} autoComplete="off">
                    <FormGroup label="Name" fieldId="name" isRequired>
                        <TextInput className="text-field" type="text" id="name" name="name"
                                   value={this.state.name}
                                   onChange={e => this.setState({name: e})}/>
                    </FormGroup>
                    <FormGroup label="Description" fieldId="description" isRequired>
                        <TextInput className="text-field" type="text" id="description" name="description"
                                   value={this.state.description}
                                   onChange={e => this.setState({description: e})}/>
                    </FormGroup>
                    <FormGroup label="Project ID" fieldId="projectId" isRequired helperText="Unique project name">
                        <TextInput className="text-field" type="text" id="projectId" name="projectId"
                                   value={this.state.projectId}
                                   onFocus={e => this.setState({projectId: projectId === '' ? CamelUi.nameFromTitle(name) : projectId})}
                                   onChange={e => this.setState({projectId: CamelUi.nameFromTitle(e)})}/>
                    </FormGroup>
                    <FormGroup label="Runtime" fieldId="runtime" isRequired>
                        {runtimes?.map((runtime: string) => (
                            <Radio key={runtime} id={runtime} name={runtime} className="radio"
                                   isChecked={this.state.runtime === runtime}
                                   onChange={checked => {
                                       if (checked) this.setState({runtime: runtime})
                                   }}
                                   body={
                                       <div className="runtime-radio">
                                           {runtime === 'quarkus' ? QuarkusIcon() : SpringIcon()}
                                           <div className="runtime-label">{CamelUtil.capitalizeName(runtime)}</div>
                                       </div>}
                            />
                        ))}
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    deleteModalForm() {
        return (
            <Modal
                title="Confirmation"
                variant={ModalVariant.small}
                isOpen={this.state.isDeleteModalOpen}
                onClose={() => this.setState({isDeleteModalOpen: false})}
                actions={[
                    <Button key="confirm" variant="primary" onClick={e => this.deleteProject()}>Delete</Button>,
                    <Button key="cancel" variant="link"
                            onClick={e => this.setState({isDeleteModalOpen: false})}>Cancel</Button>
                ]}
                onEscapePress={e => this.setState({isDeleteModalOpen: false})}>
                <div>{"Are you sure you want to delete the project " + this.state.projectToDelete?.projectId + "?"}</div>
            </Modal>
        )
    }

    getEnvironments(): string [] {
        return this.props.config.environments && Array.isArray(this.props.config.environments) ? Array.from(this.props.config.environments) : [];
    }

    getDeploymentByEnvironments(name: string): [string, DeploymentStatus | undefined] [] {
        const deps = this.state.deploymentStatuses;
        return this.getEnvironments().map(e => {
            const env: string = e as string;
            const dep = deps.find(d => d.name === name && d.env === env);
            return [env, dep];
        });
    }

    render() {
        const runtime = this.props.config?.runtime ? this.props.config.runtime : "QUARKUS";
        const projects = this.state.projects.filter(p => p.name.toLowerCase().includes(this.state.filter) || p.description.toLowerCase().includes(this.state.filter));
        return (
            <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                <PageSection isFilled className="kamelets-page">
                    <TableComposable aria-label="Projects" variant={"compact"}>
                        <Thead>
                            <Tr>
                                <Th key='type'>Runtime</Th>
                                <Th key='projectId'>Project ID</Th>
                                <Th key='name'>Name</Th>
                                <Th key='description'>Description</Th>
                                <Th key='commit'>Commit</Th>
                                <Th key='deployment'>Environment</Th>
                                <Th key='action'></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {projects.map(project => (
                                <Tr key={project.projectId}>
                                    <Td modifier={"fitContent"}>
                                        <Tooltip content={runtime} position={"left"}>
                                            <Badge className="runtime-badge">{runtime.substring(0, 1)}</Badge>
                                        </Tooltip>
                                    </Td>
                                    <Td>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={e => this.props.onSelect?.call(this, project)}>
                                            {project.projectId}
                                        </Button>
                                    </Td>
                                    <Td>{project.name}</Td>
                                    <Td>{project.description}</Td>
                                    <Td isActionCell>
                                        <Tooltip content={project.lastCommit} position={"bottom"}>
                                            <Badge>{project.lastCommit?.substr(0, 7)}</Badge>
                                        </Tooltip>
                                    </Td>
                                    <Td noPadding style={{width: "180px"}}>
                                        <Flex direction={{default: "row"}}>
                                            {this.getDeploymentByEnvironments(project.projectId).map(value => (
                                                <FlexItem className="badge-flex-item" key={value[0]}>
                                                    <Badge className="badge" isRead={!value[1]}>{value[0]}</Badge>
                                                </FlexItem>
                                            ))}
                                        </Flex>
                                    </Td>
                                    <Td isActionCell>
                                        <OverflowMenu breakpoint="md">
                                            <OverflowMenuContent>
                                                <OverflowMenuGroup groupType="button">
                                                    <OverflowMenuItem>
                                                        <Tooltip content={"Copy project"} position={"bottom"}>
                                                            <Button variant={"plain"} icon={<CopyIcon/>}
                                                                    onClick={e => this.setState({isCreateModalOpen: true, isCopy: true, projectToCopy: project})}></Button>
                                                        </Tooltip>
                                                    </OverflowMenuItem>
                                                    <OverflowMenuItem>
                                                        <Tooltip content={"Delete project"} position={"bottom"}>
                                                            <Button variant={"plain"} icon={<DeleteIcon/>} onClick={e => this.onProjectDelete(project)}></Button>
                                                        </Tooltip>
                                                    </OverflowMenuItem>
                                                </OverflowMenuGroup>
                                            </OverflowMenuContent>
                                        </OverflowMenu>
                                    </Td>
                                </Tr>
                            ))}
                            {projects.length === 0 &&
                                <Tr>
                                    <Td colSpan={8}>
                                        <Bullseye>
                                            <EmptyState variant={EmptyStateVariant.small}>
                                                <EmptyStateIcon icon={SearchIcon}/>
                                                <Title headingLevel="h2" size="lg">
                                                    No results found
                                                </Title>
                                            </EmptyState>
                                        </Bullseye>
                                    </Td>
                                </Tr>
                            }
                        </Tbody>
                    </TableComposable>
                </PageSection>
                {this.createModalForm()}
                {this.deleteModalForm()}
            </PageSection>
        )
    }
}