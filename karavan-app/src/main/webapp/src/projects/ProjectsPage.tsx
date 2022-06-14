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
    ToggleGroup,
    ToggleGroupItem,
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
import {Project} from "../models/ProjectModels";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";

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
    groupId: string,
    artifactId: string,
    version: string,
    folder: string,
    runtime: string,
}

export class ProjectsPage extends React.Component<Props, State> {

    public state: State = {
        projects: this.props.projects,
        isCreateModalOpen: false,
        isCopy: false,
        filter: '',
        groupId: this.props.config.groupId,
        artifactId: '',
        version: '',
        folder: '',
        runtime: this.props.config.defaultRuntime,
    };

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
        this.setState({isCreateModalOpen: false, isCopy: false, groupId: this.props.config.groupId, artifactId:'', version: '', folder: '', runtime: this.props.config.defaultRuntime});
        this.props.onRefresh.call(this);
    }

    saveAndCloseCreateModal = () => {
        const {groupId, artifactId, version, runtime} = this.state;
        const p = new Project(groupId, artifactId, version, '', runtime ? runtime : this.props.config.defaultRuntime, '');
        this.props.onCreate.call(this, p);
        this.setState({isCreateModalOpen: false, isCopy: false, groupId: this.props.config.groupId, artifactId: '', version: '', folder: '', runtime: this.props.config.defaultRuntime});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.groupId !== undefined && this.state.artifactId !== undefined && this.state.version !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        const {runtime, isCopy, projectToCopy } = this.state;
        return (
            <Modal
                title={!isCopy ? "Create new project" : "Copy project from " + projectToCopy?.artifactId}
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
                    <FormGroup label="GroupId" fieldId="group" isRequired>
                        <TextInput className="text-field" type="text" id="group" name="group"
                                   value={this.state.groupId}
                                   onChange={e => this.setState({groupId: e})}/>
                    </FormGroup>
                    <FormGroup label="ArtifactId" fieldId="artifact" isRequired>
                        <TextInput className="text-field" type="text" id="artifact" name="artifact"
                                   value={this.state.artifactId}
                                   onChange={e => this.setState({artifactId: e})}/>
                    </FormGroup>
                    <FormGroup label="Version" fieldId="version" isRequired>
                        <TextInput className="text-field" type="text" id="version" name="version"
                                   value={this.state.version}
                                   onChange={e => this.setState({version: e})}/>
                    </FormGroup>
                    <FormGroup label="Runtime" fieldId="runtime" isRequired>
                        <ToggleGroup aria-label="Runtime">
                            {["QUARKUS", "SPRING"].map(value =>
                                <ToggleGroupItem key={value} text={CamelUtil.capitalizeName(value.toLowerCase())} buttonId={value} isSelected={runtime === value} onChange={selected => this.setState({runtime: value})} />
                            )}
                        </ToggleGroup>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    render() {
        const projects = this.state.projects.filter(p => p.groupId.includes(this.state.filter) || p.artifactId.includes(this.state.filter));
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
                                <Th key='group'>GroupId</Th>
                                <Th key='artifact'>ArtifactId</Th>
                                <Th key='version'>Version</Th>
                                <Th key='commit'>Commit</Th>
                                <Th key='deployment'>Deployment</Th>
                                <Th key='action'></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {projects.map(project => (
                                <Tr key={project.artifactId}>
                                    <Td modifier={"fitContent"}>
                                        <Badge className="runtime-badge">{project.runtime}</Badge>
                                    </Td>
                                    <Td>{project.groupId}</Td>
                                    <Td>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={e=>this.props.onSelect?.call(this, project)}>
                                            {project.artifactId}
                                        </Button>
                                    </Td>
                                    <Td>{project.version}</Td>
                                    <Td isActionCell>
                                        <Tooltip content={project.lastCommit} position={"bottom"}>
                                            <Badge>{project.lastCommit?.substr(0, 7)}</Badge>
                                        </Tooltip>
                                    </Td>
                                    <Td noPadding style={{width:"180px"}}>
                                        <Flex direction={{default: "row"}}>
                                            {environments.filter(e => e !== undefined)
                                                .map(e => <FlexItem key={e}><Badge isRead>{e}</Badge></FlexItem>)}
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