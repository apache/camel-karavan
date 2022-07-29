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
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
    ModalVariant,
    Modal,
    Flex,
    FlexItem,
    ToggleGroup,
    ToggleGroupItem,
    CodeBlockCode,
    CodeBlock, Skeleton, Checkbox, Tabs, Tab
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
import {PropertiesEditor} from "./PropertiesEditor";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {KubernetesAPI} from "../designer/utils/KubernetesAPI";
import {UploadModal} from "./UploadModal";
import {ProjectInfo} from "./ProjectInfo";
import {ProjectDashboard} from "./ProjectDashboard";

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
    fileToDelete?: ProjectFile,
    mode: "design" | "code",
    editAdvancedProperties: boolean
    key: string
    environments: string[],
    environment: string,
    tab: string | number;
}

export class ProjectPage extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isUploadModalOpen: false,
        isCreateModalOpen: false,
        isDeleteModalOpen: false,
        files: [],
        mode: "design",
        editAdvancedProperties: false,
        key: '',
        tab: "details",
        environments: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments) : [],
        environment: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? this.props.config.environments[0] : ''
    };

    componentDidMount() {
        this.onRefresh();
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
            KubernetesAPI.inKubernetes = true;
            KaravanApi.getConfigMaps(this.state.environment, (any: []) => {
                KubernetesAPI.setConfigMaps(any);
            });
            KaravanApi.getSecrets(this.state.environment, (any: []) => {
                KubernetesAPI.setSecrets(any);
            });
            KaravanApi.getServices(this.state.environment, (any: []) => {
                KubernetesAPI.setServices(any);
            });
        }
    }

    post = (file: ProjectFile) => {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                // console.log(res) //TODO show notification
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    copyToClipboard = (data: string) => {
        navigator.clipboard.writeText(data);
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

    addProperty() {
        const file = this.state.file;
        if (file){
            const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
            const props = project.properties;
            props.push(ProjectProperty.createNew("", ""))
            this.save(file.name, ProjectModelApi.propertiesToString(props));
            this.setState({key: Math.random().toString()});
        }
    }

    tools = () => {
        const {file, mode} = this.state;
        const isFile = file !== undefined;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default:"alignItemsCenter"}}>
                    {isYaml && <FlexItem>
                        <ToggleGroup>
                            <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"} onChange={s => this.setState({mode:"design"})} />
                            <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"} onChange={s => this.setState({mode:"code"})} />
                        </ToggleGroup>
                    </FlexItem>}

                    {isProperties && <FlexItem>
                        <Checkbox
                            id="advanced"
                            label="Edit advanced"
                            isChecked={this.state.editAdvancedProperties}
                            onChange={checked => this.setState({editAdvancedProperties: checked})}
                        />
                    </FlexItem>}
                    {isProperties && <FlexItem>
                        <Button variant="primary" icon={<PlusIcon/>} onClick={e => this.addProperty()}>Add property</Button>
                    </FlexItem>}

                    {isFile && <FlexItem>
                        <Button variant="secondary" icon={<DownloadIcon/>} onClick={e => this.download()}>Download</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button variant={"primary"} icon={<PlusIcon/>}
                                onClick={e => this.setState({isCreateModalOpen: true})}>Create</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button variant="secondary" icon={<UploadIcon/>}
                                onClick={e => this.setState({isUploadModalOpen: true})}>Upload</Button>
                    </FlexItem>}
                </Flex>
            </ToolbarContent>
        </Toolbar>
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

    title = () => {
        const file = this.state.file;
        const isFile = file !== undefined;
        const isLog = file !== undefined && file.name.endsWith("log");
        const filename = file ? file.name.substring(0, file.name.lastIndexOf('.')) : "";
        return (<div className="dsl-title">
            {isFile &&
                <div>
                    <Breadcrumb>
                        <BreadcrumbItem to="#" onClick={event => this.setState({file: undefined})}>
                            {"Project: " + this.props.project?.projectId}
                        </BreadcrumbItem>
                        <BreadcrumbItem to="#" isActive>{this.getType(file?.name)}</BreadcrumbItem>
                    </Breadcrumb>
                    <TextContent className="title">
                        <Text component="h1">{isLog ? filename : CamelUi.titleFromName(file.name)}</Text>
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

    getProjectFiles = () => {
        const files = this.state.files;
        return (
            <TableComposable aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='type'>Type</Th>
                        <Th key='name'>Name</Th>
                        <Th key='filename'>Filename</Th>
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
                            <Td>{file.name}</Td>
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

    showLogs = (type: 'container' | 'pipeline', name: string, environment: string) => {
        const filename = name + ".log";
        const code = '';
        this.setState({file: new ProjectFile(filename, this.props.project.projectId, code)});
        if (type === 'pipeline'){
            KaravanApi.getPipelineLog(environment, name, (res: any) => {
                if (Array.isArray(res) && Array.from(res).length > 0)
                    this.setState({file: new ProjectFile(filename, this.props.project.projectId, res.at(0).log)});
            });
        } else if (type === 'container'){
            KaravanApi.getContainerLog(environment, name, (res: any) => {
                this.setState({file: new ProjectFile(filename, this.props.project.projectId, res)});
            });
        }

    }

    deleteEntity = (type: 'pod' | 'deployment', name: string, environment: string) => {
        switch (type) {
            case "deployment": KaravanApi.deleteDeployment(environment, name, (res: any) => {
                if (Array.isArray(res) && Array.from(res).length > 0)
                    this.onRefresh();
            });
                break;
            case "pod": KaravanApi.deletePod(environment, name, (res: any) => {
                if (Array.isArray(res) && Array.from(res).length > 0)
                    this.onRefresh();
            });
                break;
        }
    }

    getLogView = () => {
        const file = this.state.file;
        return (
            <div style={{overflow: "auto"}}>
                {file !== undefined && file.code.length !== 0 &&
                    <CodeBlock style={{width:"90%"}}>
                        <CodeBlockCode id="code-content">{file.code}</CodeBlockCode>
                    </CodeBlock>}
                {file === undefined || file.code.length === 0 &&
                    <div>
                        <Skeleton width="25%" screenreaderText="Loading contents" />
                        <br />
                        <Skeleton width="33%" />
                        <br />
                        <Skeleton width="50%" />
                        <br />
                        <Skeleton width="66%" />
                        <br />
                        <Skeleton width="75%" />
                        <br />
                        <Skeleton />
                    </div>}
            </div>
        )
    }

    getPropertiesEditor = () => {
        const file = this.state.file;
        return (
            file !== undefined &&
            <PropertiesEditor key={this.state.key}
                editAdvanced={this.state.editAdvancedProperties}
                file={file}
                onSave={(name, code) => this.save(name, code)}
            />
        )
    }

    render() {
        const {file, mode, tab} = this.state;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isProperties = file !== undefined && file.name.endsWith("properties");
        const isLog = file !== undefined && file.name.endsWith("log");
        const isCode = file !== undefined && (file.name.endsWith("java") || file.name.endsWith("groovy") || file.name.endsWith("json"));
        const showDesigner = isYaml && mode === 'design';
        const showEditor = isCode || (isYaml && mode === 'code');
        return (
            <PageSection className="kamelet-section project-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                {file === undefined &&
                    <PageSection isFilled className="kamelets-page project-page-section"
                                 padding={{default: file !== undefined ? 'noPadding' : 'noPadding'}}>
                        <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                            <FlexItem>
                                <Tabs activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex})}>
                                    <Tab eventKey="details" title="Details"/>
                                    <Tab eventKey="dashboard" title="Dashboard"/>
                                </Tabs>
                            </FlexItem>
                            <FlexItem>
                                <PageSection padding={{default: "padding"}}>
                                    {tab === 'details' && <ProjectInfo project={this.props.project} config={this.props.config} deleteEntity={this.deleteEntity} showLog={this.showLogs}/>}
                                    {tab === 'dashboard' && <ProjectDashboard environments={this.state.environments} project={this.props.project} config={this.props.config}/>}
                                </PageSection>
                            </FlexItem>
                        </Flex>
                        {tab === 'details' && this.getProjectFiles()}
                    </PageSection>}
                {showDesigner && this.getDesigner()}
                {showEditor && this.getEditor()}
                {isLog && this.getLogView()}
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
                <UploadModal projectId={this.props.project.projectId} isOpen={this.state.isUploadModalOpen} onClose={this.closeModal}/>
            </PageSection>
        )
    }
}
