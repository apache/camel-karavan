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
    EmptyStateVariant, EmptyStateIcon, Title
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {Project} from "../models/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';

interface Props {
    projects: Project[],
    onSelect: (project: Project) => void
    onCreate: (project: Project) => void
    onDelete: (project: Project) => void
    onRefresh: any
}

interface State {
    projects: Project[],
    isCreateModalOpen: boolean,
    filter: string,
    name: string,
    version: string,
    folder: string,
    type: string,
}

export class ProjectsPage extends React.Component<Props, State> {

    public state: State = {
        projects: this.props.projects,
        isCreateModalOpen: false,
        filter: '',
        name: '',
        version: '',
        folder: '',
        type: 'KARAVAN',
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
                <Button icon={<PlusIcon/>} onClick={e => this.setState({isCreateModalOpen: true})}>Create</Button>
            </ToolbarItem>
        </ToolbarContent>
    </Toolbar>);

    title = () => (<TextContent>
        <Text component="h1">Projects</Text>
    </TextContent>);

    closeModal = () => {
        this.setState({isCreateModalOpen: false, name: '', version: '', folder: '', type: 'KARAVAN'});
        this.props.onRefresh.call(this);
    }

    saveAndCloseCreateModal = () => {
        const p = new Project(this.state.name, this.state.version, this.state.folder, this.state.type? this.state.type : "KARAVAN", '');
        this.props.onCreate.call(this, p);
        this.setState({isCreateModalOpen: false, name: '', version: '', folder: '', type: 'KARAVAN'});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.name !== undefined && this.state.version !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        const {type } = this.state;
        return (
            <Modal
                title="Create new Project"
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
                                   onChange={e => this.setState({name: e, folder: CamelUi.nameFromTitle(e.trim())})}/>
                    </FormGroup>
                    <FormGroup label="Version" fieldId="version" isRequired>
                        <TextInput className="text-field" type="text" id="version" name="version"
                                   value={this.state.version}
                                   onChange={e => this.setState({version: e})}/>
                    </FormGroup>
                    <FormGroup label="Type" fieldId="type" isRequired>
                        <ToggleGroup aria-label="Default with single selectable">
                            {["KARAVAN", "QUARKUS", "SPRING"].map(value =>
                                <ToggleGroupItem key={value} text={CamelUtil.capitalizeName(value.toLowerCase())} buttonId={value} isSelected={type === value} onChange={selected => this.setState({type: value})} />
                            )}
                        </ToggleGroup>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    render() {
        const projects = this.state.projects.filter(p => p.name.includes(this.state.filter));
        return (
            <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                <PageSection isFilled className="kamelets-page" >
                    <TableComposable aria-label="Projects" variant={"compact"}>
                        <Thead>
                            <Tr>
                                <Th key='type'>Type</Th>
                                <Th key='name'>Name</Th>
                                <Th key='version'>Version</Th>
                                <Th key='folder'>Folder</Th>
                                <Th key='status'>Status</Th>
                                <Th key='action'></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {projects.map(project => (
                                <Tr key={project.name}>
                                    <Td modifier={"fitContent"}>
                                        <Tooltip content={project.type} position={"left"}>
                                            <Badge>{project.type.charAt(0)}</Badge>
                                        </Tooltip>
                                    </Td>
                                    <Td>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={e=>this.props.onSelect?.call(this, project)}>
                                            {CamelUi.titleFromName(project.name)}
                                        </Button>
                                    </Td>
                                    <Td>{project.version}</Td>
                                    <Td>{project.folder}</Td>
                                    <Td>Active</Td>
                                    <Td modifier={"fitContent"}>
                                        <Button style={{padding: '0'}} variant={"plain"} onClick={e=>this.props.onDelete?.call(this, project)}>
                                            <DeleteIcon/>
                                        </Button>
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