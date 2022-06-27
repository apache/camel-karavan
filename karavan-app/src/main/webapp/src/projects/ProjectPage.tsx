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
    ModalVariant, Modal, Spinner, Tooltip, Flex, FlexItem, ProgressStep, ProgressStepper
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile, ProjectFileTypes, ProjectStatus} from "../models/ProjectModels";
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
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {PropertiesEditor} from "./PropertiesEditor";
import PendingIcon from "@patternfly/react-icons/dist/esm/icons/pending-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

interface Props {
    project: Project,
    config: any,
}

interface State {
    project?: Project,
    status?: ProjectStatus,
    file?: ProjectFile,
    files: ProjectFile[],
    isUploadModalOpen: boolean,
    isDeleteModalOpen: boolean,
    isCreateModalOpen: boolean,
    isPushing: boolean,
    isBuilding: boolean,
    fileToDelete?: ProjectFile,
    environments: string[],
    environment: string,
    key?: string,
}

export class ProjectPage extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isUploadModalOpen: false,
        isCreateModalOpen: false,
        isDeleteModalOpen: false,
        isPushing: false,
        isBuilding: false,
        files: [],
        environments: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments) : [],
        environment: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? this.props.config.environments[0] : ''
    };
    interval: any;

    componentDidMount() {
        this.onRefresh();
        this.interval = setInterval(() => this.onRefreshStatus(), 3000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onRefresh = () => {
        if (this.props.project) {
            KaravanApi.getProject(this.props.project.projectId, (project: Project) => {
                this.setState({
                    project: project
                })
            });
            KaravanApi.getFiles(this.props.project.projectId, (files: []) => {
                this.setState({
                    files: files
                })
            });
        }
    }

    onRefreshStatus = () => {
        if (this.props.project) {
            KaravanApi.getProjectStatus(this.props.project.projectId, (status: ProjectStatus) => {
                this.setState({
                    key: Math.random().toString(),
                    status: status
                });
                // console.log(status);
            });
        }
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
        return <Toolbar id="toolbar-group-types">
            {isFile && <ToolbarContent>
                <ToolbarItem>
                    <Button variant="secondary" icon={<DownloadIcon/>} onClick={e => this.download()}>Download</Button>
                </ToolbarItem>
            </ToolbarContent>}
            {!isFile && <ToolbarContent>
                <ToolbarItem>
                    <Button variant={"primary"} icon={<PlusIcon/>}
                            onClick={e => this.setState({isCreateModalOpen: true})}>Create</Button>
                </ToolbarItem>
                <ToolbarItem>
                    <Button variant="secondary" icon={<UploadIcon/>}
                            onClick={e => this.setState({isUploadModalOpen: true})}>Upload</Button>
                </ToolbarItem>
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
                                        onClick={event => this.setState({file: undefined})}>{"Project: " + this.props.project?.projectId}</BreadcrumbItem>
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

    closeModal = (isPushing: boolean = false) => {
        this.setState({
            isUploadModalOpen: false,
            isCreateModalOpen: false,
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

    push = (after?: () => void) => {
        this.setState({isPushing: true});
        KaravanApi.push(this.props.project, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                after?.call(this);
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    build = () => {
        this.setState({isBuilding: true});
        KaravanApi.tekton(this.props.project, this.state.environment, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isBuilding: false});
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

    pushButton = () => {
        const isPushing = this.state.isPushing;
        return (<Tooltip content="Commit and push to git" position={"left"}>
            <Button isLoading={isPushing ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isPushing ? <PushIcon/> : <div></div>}
                    onClick={e => this.push()}>
                {isPushing ? "..." : "Commit"}
            </Button>
        </Tooltip>)
    }

    buildButton = () => {
        const isDeploying = this.state.isBuilding;
        return (<Tooltip content="Commit, push, build and deploy" position={"left"}>
            <Button isLoading={isDeploying ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isDeploying ? <BuildIcon/> : <div></div>}
                    onClick={e => {
                        this.push(() => this.build());
                    }}>
                {isDeploying ? "..." : "Build"}
            </Button>
        </Tooltip>)
    }

    getProgressIcon(status?: 'pending' | 'progress' | 'done' | 'error') {
        switch (status) {
            case "pending":
                return <PendingIcon color={"grey"}/>;
            case "progress":
                return <Spinner isSVG size="md"/>
            case "done":
                return <CheckCircleIcon color={"green"}/>;
            case "error":
                return <ExclamationCircleIcon color={"red"}/>;
            default:
                return undefined;
        }
    }

    getCurrentStatus() {
        return (<Text>OK</Text>)
    }

    getPipelineState() {
        const {project, status} = this.state;
        const isRunning = status?.pipeline === 'Running';
        const isFailed = status?.pipeline === 'Failed';
        const isSucceeded = status?.pipeline === 'Succeeded';
        let classname = "pipeline"
        if (isRunning) classname = classname + " pipeline-running";
        if (isFailed) classname = classname + " pipeline-running";
        if (isSucceeded) classname = classname + " pipeline-succeeded";
        return (
            <Flex spaceItems={{default: 'spaceItemsNone'}} className={classname} direction={{default: "row"}}
                  alignItems={{default: "alignItemsCenter"}}>
                <FlexItem style={{height: "18px"}}>
                    {isRunning && <Spinner isSVG diameter="16px"/>}
                </FlexItem>
                <FlexItem style={{height: "18px"}}>
                    {project?.lastPipelineRun ? project?.lastPipelineRun : "-"}
                </FlexItem>
            </Flex>
        )
    }

    isUp(env: string): boolean {
        if (this.state.status) {
            return this.state.status.statuses.find(s => s.environment === env)?.status === 'UP';
        } else {
            return false;
        }
    }

    getProjectForm = () => {
        const {project, environments, status} = this.state;
        return (
            <Card>
                <CardBody isFilled>
                    <Flex direction={{default: "row"}} alignContent={{default: "alignContentSpaceBetween"}}
                          style={{width: "100%"}}>
                        <FlexItem flex={{default: "flex_1"}}>
                            <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Project ID</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.projectId}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Name</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.name}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Description</DescriptionListTerm>
                                    <DescriptionListDescription>{project?.description}</DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                        </FlexItem>
                        <FlexItem flex={{default: "flex_1"}}>
                            <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Commit</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Tooltip content={project?.lastCommit} position={"bottom"}>
                                            <Badge>{project?.lastCommit ? project?.lastCommit?.substr(0, 7) : "-"}</Badge>
                                        </Tooltip>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Pipeline Run</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        {this.getPipelineState()}
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup key={this.state.key}>
                                    <DescriptionListTerm>Status</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Flex direction={{default: "row"}}>
                                            {environments.filter(e => e !== undefined)
                                                .map(e =>
                                                    <FlexItem key={e}>
                                                        <Tooltip content={"Last update: " + (status ? new Date(status.lastUpdate).toISOString() : "N/A")}
                                                                 position={"bottom"}>
                                                            <Badge className={this.isUp(e) ? "badge-env-up" : ""} isRead>{e}</Badge>
                                                        </Tooltip>
                                                    </FlexItem>)}
                                        </Flex>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                        </FlexItem>
                        <FlexItem>
                            <Flex direction={{default: "column"}}>
                                <FlexItem>
                                    {this.pushButton()}
                                </FlexItem>
                                <FlexItem>
                                    {this.buildButton()}
                                </FlexItem>
                                <FlexItem>
                                    <Button isSmall style={{visibility: "hidden"}}>Refresh</Button>
                                </FlexItem>
                            </Flex>
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
                                        isDisabled={file.name === 'application.properties'}
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

    getPropertiesEditor = () => {
        const file = this.state.file;
        return (
            file !== undefined &&
            <PropertiesEditor
                file={file}
                onSave={(name, code) => this.save(name, code)}
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
                {isProperties && this.getPropertiesEditor()}
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
            </PageSection>
        )
    }
}
