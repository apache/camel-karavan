import React from 'react';
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    PageSection,
    Text,
    TextContent,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    Card,
    CardBody,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
    ModalVariant, Modal, Spinner, Tooltip, Flex, FlexItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile, ProjectFileTypes} from "../models/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CreateFileModal} from "./CreateFileModal";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {CamelUtil} from "../../../../../../karavan-core/lib/api/CamelUtil";

interface Props {
    project: Project,
    config: any,
}

interface State {
    project?: Project,
    file?: ProjectFile,
    files: ProjectFile[],
    isUploadModalOpen: boolean,
    isDeleteModalOpen: boolean,
    isCreateModalOpen: boolean,
    isPushModalOpen: boolean,
    isPushing: boolean,
    fileToDelete?: ProjectFile
}

export class ProjectPage extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isUploadModalOpen: false,
        isCreateModalOpen: false,
        isDeleteModalOpen: false,
        isPushModalOpen: false,
        isPushing: false,
        files: []
    };

    componentDidMount() {
        this.onRefresh();
    }

    post = (file: ProjectFile) => {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                console.log(res) //TODO show notification
            } else {
                console.log(res) //TODO show notification
            }
        })
    }

    publish = () => {
    }

    copy = () => {
    }

    copyToClipboard = (data: string) => {
        navigator.clipboard.writeText(data);
    }

    changeView = (view: "design" | "code") => {
        // this.setState({view: view});
    }

    save = (name: string, code: string) => {
        const file = this.state.file;
        if (file) {
            file.code = code;
            this.setState({file: file});
            this.post(file);
        }
    }

    download = () => {
        const file = this.state.file;
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }

    tools = () => {
        const isFile = this.state.file !== undefined;
        const isPushing = this.state.isPushing;
        return <Toolbar id="toolbar-group-types">
            {isFile && <ToolbarContent>
                <ToolbarItem>
                    <Button variant="secondary" icon={<DownloadIcon/>} onClick={e => this.download()}>Download</Button>
                </ToolbarItem>
            </ToolbarContent>}
            {!isFile && <ToolbarContent>
                <ToolbarItem>
                    {!isPushing && <Button variant={"primary"} icon={<PlusIcon/>}
                                           onClick={e => this.setState({isCreateModalOpen: true})}>Create</Button>}
                </ToolbarItem>
                <ToolbarItem>
                    {!isPushing && <Button variant="secondary" icon={<UploadIcon/>}
                                           onClick={e => this.setState({isUploadModalOpen: true})}>Upload</Button>}
                </ToolbarItem>
                <ToolbarItem>
                    {!isPushing && <Button variant="secondary" icon={<PushIcon/>}
                                           onClick={e => this.setState({isPushModalOpen: true})}>Push</Button>}
                </ToolbarItem>
                {isPushing && <ToolbarItem>
                    <Button variant="link" isDisabled>Pushing...</Button>
                </ToolbarItem>}
                {isPushing && <ToolbarItem>
                    <Spinner isSVG diameter="30px"/>
                </ToolbarItem>}
            </ToolbarContent>}
        </Toolbar>
    };

    title = () => {
        const file = this.state.file;
        const isFile = file !== undefined;
        return (<div className="dsl-title">
            {isFile &&
                <div>
                    <Breadcrumb>
                        <BreadcrumbItem to="#"
                                        onClick={event => this.setState({file: undefined})}>{"Project: " + this.props.project?.getKey()}</BreadcrumbItem>
                        <BreadcrumbItem to="#" isActive>{this.getType(file?.name)}</BreadcrumbItem>
                    </Breadcrumb>
                    <TextContent className="title">
                        <Text component="h1">{CamelUi.titleFromName(file.name)}</Text>
                    </TextContent>
                </div>
            }
            {!isFile && <TextContent className="title">
                <Text component="h1">Project</Text>
            </TextContent>}
        </div>)
    };

    onRefresh = () => {
        if (this.props.project) {
            KaravanApi.getProject(this.props.project.getKey(), (project: Project) => {
                this.setState({
                    project: project
                })
            });
            KaravanApi.getFiles(this.props.project.getKey(), (files: []) => {
                this.setState({
                    files: files
                })
            });
        }
    }

    closeModal = (isPushing: boolean = false) => {
        this.setState({
            isUploadModalOpen: false,
            isCreateModalOpen: false,
            isPushModalOpen: false,
            isPushing: isPushing
        });
        this.onRefresh();
    }

    select = (file: ProjectFile) => {
        this.setState({file: file});
    }

    openDeleteConfirmation = (file: ProjectFile) => {
        this.setState({isDeleteModalOpen: true, fileToDelete: file})
    }

    delete = () => {
        if (this.state.fileToDelete) {
            KaravanApi.deleteProjectFile(this.state.fileToDelete, res => {
                if (res.status === 204) {
                    this.onRefresh();
                } else {
                }
            });
            this.setState({isDeleteModalOpen: false, fileToDelete: undefined})
        }
    }

    push = () => {
        this.closeModal(true);
        KaravanApi.push(this.props.project, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    getType = (name: string) => {
        const extension = name.substring(name.lastIndexOf('.') + 1);
        const type = ProjectFileTypes.filter(p => p.extension === extension).map(p => p.title)[0];
        if (type) {
            return type
        } else {
            return "Unknown"
        }
    }

    getProjectForm = () => {
        const project = this.state.project;
        const environments: string[] = this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments)
            : [];
        return (
            <Card>
                <CardBody isFilled>
                    <Flex direction={{default: "row"}} alignContent={{default: "alignContentSpaceBetween"}}
                          style={{width: "100%"}}>
                        <FlexItem flex={{default: "flex_1"}}>
                            <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Group</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.groupId}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Artifact</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.artifactId}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Version</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.version}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Folder</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.folder}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Runtime</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Badge>{project?.runtime}</Badge>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                        </FlexItem>
                        <FlexItem flex={{default: "flex_1"}}>
                            <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Latest Commit</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Tooltip content={project?.lastCommit} position={"bottom"}>
                                            <Badge>{project?.lastCommit?.substr(0, 7)}</Badge>
                                        </Tooltip>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Deployment</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Flex direction={{default: "row"}}>
                                            {environments.filter(e => e !== undefined)
                                                .map(e => <FlexItem key={e}><Badge isRead>{e}</Badge></FlexItem>)}
                                        </Flex>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        )
    }

    getProjectFiles = () => {
        const files = this.state.files;
        return (
            <TableComposable aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='type'>Type</Th>
                        <Th key='name'>Name</Th>
                        <Th key='action'></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {files.map(file => {
                        const type = this.getType(file.name)
                        return <Tr key={file.name}>
                            <Td modifier={"fitContent"}>
                                <Badge>{type}</Badge>
                            </Td>
                            <Td>
                                <Button style={{padding: '6px'}} variant={"link"}
                                        onClick={e => this.select(file)}>
                                    {CamelUi.titleFromName(file.name)}
                                </Button>
                            </Td>
                            <Td modifier={"fitContent"}>
                                <Button style={{padding: '0'}} variant={"plain"}
                                        onClick={e => this.openDeleteConfirmation(file)}>
                                    <DeleteIcon/>
                                </Button>
                            </Td>
                        </Tr>
                    })}
                    {files.length === 0 &&
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
        )
    }

    getDesigner = () => {
        const file = this.state.file;
        return (
            file !== undefined &&
            <KaravanDesigner
                showStartHelp={false}
                dark={false}
                key={"key"}
                filename={file.name}
                yaml={file.code}
                onSave={(name, yaml) => this.save(name, yaml)}
            />
        )
    }

    getEditor = () => {
        const file = this.state.file;
        const language = file?.name.split('.').pop();
        return (
            file !== undefined &&
            <Editor
                height="100vh"
                defaultLanguage={language}
                theme={'light'}
                value={file.code}
                className={'code-editor'}
                onChange={(value, ev) => {
                    if (value) {
                        this.save(file?.name, value)
                    }
                }}
            />
        )
    }

    render() {
        const file = this.state.file;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isProperties = file !== undefined && file.name.endsWith("properties");
        const isCode = file !== undefined && (file.name.endsWith("java") || file.name.endsWith("groovy"));
        return (
            <PageSection className="kamelet-section project-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                {file === undefined &&
                    <PageSection isFilled className="kamelets-page"
                                 padding={{default: file !== undefined ? 'noPadding' : 'padding'}}>
                        {this.getProjectForm()}
                        {this.getProjectFiles()}
                    </PageSection>}
                {isYaml && this.getDesigner()}
                {isCode && this.getEditor()}
                {isProperties && this.getEditor()}
                <CreateFileModal project={this.props.project} isOpen={this.state.isCreateModalOpen}
                                 onClose={this.closeModal}/>
                <Modal
                    title="Confirmation"
                    variant={ModalVariant.small}
                    isOpen={this.state.isDeleteModalOpen}
                    onClose={() => this.setState({isDeleteModalOpen: false})}
                    actions={[
                        <Button key="confirm" variant="primary" onClick={e => this.delete()}>Delete</Button>,
                        <Button key="cancel" variant="link"
                                onClick={e => this.setState({isDeleteModalOpen: false})}>Cancel</Button>
                    ]}
                    onEscapePress={e => this.setState({isDeleteModalOpen: false})}>
                    <div>{"Are you sure you want to delete the file " + this.state.fileToDelete?.name + "?"}</div>
                </Modal>
                <Modal
                    title="Push"
                    variant={ModalVariant.small}
                    isOpen={this.state.isPushModalOpen}
                    onClose={() => this.setState({isPushModalOpen: false})}
                    actions={[
                        <Button key="confirm" variant="primary" onClick={e => this.push()}>Push</Button>,
                        <Button key="cancel" variant="link"
                                onClick={e => this.setState({isPushModalOpen: false})}>Cancel</Button>
                    ]}
                    onEscapePress={e => this.setState({isPushModalOpen: false})}>
                    <div>{"Push project to repository"}</div>
                </Modal>
            </PageSection>
        )
    }
}
