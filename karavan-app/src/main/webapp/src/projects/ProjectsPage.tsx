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
    Flex, FlexItem
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {Project} from "./ProjectModels";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import {CamelUi} from "../designer/utils/CamelUi";

interface Props {
    projects: Project[],
    config: any,
    onSelect: (project: Project) => void
    onCreate: (project: Project) => void
    onDelete: (project: Project) => void
    onRefresh: any
}

interface State {
    projects: Project[],
    isCreateModalOpen: boolean,
    isCopy: boolean,
    projectToCopy?: Project,
    filter: string,
    name: string,
    description: string,
    projectId: string,
}

export class ProjectsPage extends React.Component<Props, State> {

    public state: State = {
        projects: this.props.projects,
        isCreateModalOpen: false,
        isCopy: false,
        filter: '',
        name: '',
        description: '',
        projectId: '',
    };
    interval: any;

    componentDidMount() {
        this.interval = setInterval(() => this.props.onRefresh.call(this), 500);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    tools = () => (<Toolbar id="toolbar-group-types">
        <ToolbarContent>
            <ToolbarItem>
                <TextInput className="text-field" type="search" id="search" name="search"
                           autoComplete="off" placeholder="Search by name"
                           value={this.state.filter}
                           onChange={e => this.setState({filter: e})}/>
            </ToolbarItem>
            <ToolbarItem>
                <Button variant="secondary" icon={<RefreshIcon/>}
                        onClick={e => this.props.onRefresh.call(this)}>Refresh</Button>
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
        this.setState({isCreateModalOpen: false, isCopy: false, name: this.props.config.groupId, description:'', projectId: ''});
        this.props.onRefresh.call(this);
    }

    saveAndCloseCreateModal = () => {
        const {name, description, projectId} = this.state;
        const p = new Project(projectId, name, description, '');
        this.props.onCreate.call(this, p);
        this.setState({isCreateModalOpen: false, isCopy: false, name: this.props.config.groupId, description: '',  projectId: ''});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.name !== undefined && this.state.description !== undefined && this.state.projectId !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        const {isCopy, projectToCopy, projectId, name} = this.state;
        return (
            <Modal
                title={!isCopy ? "Create new project" : "Copy project from " + projectToCopy?.projectId}
                variant={ModalVariant.small}
                isOpen={this.state.isCreateModalOpen}
                onClose={this.closeModal}
                onKeyDown={this.onKeyDown}
                actions={[
                    <Button key="confirm" variant="primary" onClick={this.saveAndCloseCreateModal}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={this.closeModal}>Cancel</Button>
                ]}
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
                                   onFocus={e => this.setState({projectId : projectId === '' ? CamelUi.nameFromTitle(name) : projectId})}
                                   onChange={e => this.setState({projectId: CamelUi.nameFromTitle(e)})}/>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    render() {
        const runtime = this.props.config?.runtime ? this.props.config.runtime : "QUARKUS";
        const projects = this.state.projects.filter(p => p.name.includes(this.state.filter) || p.description.includes(this.state.filter));
        const environments: string[] = this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments)
            : [];
        return (
            <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                <PageSection isFilled className="kamelets-page" >
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
                                            <Badge className="runtime-badge">{runtime.substring(0,1)}</Badge>
                                        </Tooltip>
                                    </Td>
                                    <Td>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={e=>this.props.onSelect?.call(this, project)}>
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
                                    <Td noPadding style={{width:"180px"}}>
                                        <Flex direction={{default: "row"}}>
                                            {environments.filter(e => e !== undefined)
                                                .map(e => <FlexItem key={e}><Badge isRead={!project.deployed}>{e}</Badge></FlexItem>)}
                                        </Flex>
                                    </Td>
                                    <Td isActionCell>
                                        <OverflowMenu breakpoint="md">
                                            <OverflowMenuContent>
                                                <OverflowMenuGroup groupType="button">
                                                    <OverflowMenuItem>
                                                        <Tooltip content={"Copy project"} position={"bottom"}>
                                                            <Button variant={"plain"} icon={<CopyIcon/>} onClick={e=>this.setState({isCreateModalOpen: true, isCopy: true, projectToCopy: project})}></Button>
                                                        </Tooltip>
                                                    </OverflowMenuItem>
                                                    <OverflowMenuItem>
                                                        <Tooltip content={"Delete project"} position={"bottom"}>
                                                            <Button variant={"plain"} icon={<DeleteIcon/>} onClick={e=>this.props.onDelete?.call(this, project)}></Button>
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
                                                <EmptyStateIcon icon={SearchIcon} />
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
            </PageSection>
        )
    }
}