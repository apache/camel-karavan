import React from 'react';
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    PageSection,
    Text,
    TextContent,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
    ModalVariant,
    Modal,
    Flex,
    FlexItem,
    CodeBlockCode,
    CodeBlock, Skeleton, Tabs, Tab
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile, ProjectFileTypes} from "./ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
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
import {ProjectOperations} from "./ProjectOperations";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {ProjectPageToolbar} from "./ProjectPageToolbar";

interface Props {
    project: Project,
    isTemplates?: boolean,
    config: any,
}

interface State {
    karavanDesignerRef: any,
    project?: Project,
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
        karavanDesignerRef: React.createRef(),
        project: this.props.project,
        isUploadModalOpen: false,
        isCreateModalOpen: false,
        isDeleteModalOpen: false,
        files: [],
        mode: "design",
        editAdvancedProperties: false,
        key: '',
        tab: "development",
        environments: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments) : [],
        environment: this.props.config.environment
    };

    componentDidMount() {
        this.onRefresh();
    }

    onRefresh = () => {
        if (this.props.project) {
            KaravanApi.getProject(this.props.project.projectId, (project: Project) => {
                this.setState({project: project})
            });
            KaravanApi.getFiles(this.props.project.projectId, (files: []) => {
                this.setState({files: files})
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

    downloadImage = () => {
        if (this.state.karavanDesignerRef) {
            this.state.karavanDesignerRef.current.downloadImage();
        }
    }

    addProperty() {
        const file = this.state.file;
        if (file) {
            const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
            const props = project.properties;
            props.push(ProjectProperty.createNew("", ""))
            this.save(file.name, ProjectModelApi.propertiesToString(props));
            this.setState({key: Math.random().toString()});
        }
    }

    tools = () => {
        return <ProjectPageToolbar
            project={this.props.project}
            file={this.state.file}
            mode={this.state.mode}
            isTemplates={this.props.isTemplates}
            config={this.props.config}
            addProperty={() => this.addProperty()}
            download={() => this.download()}
            downloadImage={() => this.downloadImage()}
            editAdvancedProperties={this.state.editAdvancedProperties}
            setEditAdvancedProperties={checked => this.setState({editAdvancedProperties: checked})}
            setMode={mode => this.setState({mode: mode})}
            setCreateModalOpen={() => this.setState({isCreateModalOpen: true})}
            setUploadModalOpen={() => this.setState({isUploadModalOpen: true})}
        />
    }

    getType = (file: ProjectFile) => {
        if (file.name.endsWith(".camel.yaml")) return ProjectFileTypes.filter(p => p.name === "INTEGRATION").map(p => p.title)[0];
        if (file.name.endsWith(".json")) return ProjectFileTypes.filter(p => p.name === "OPENAPI_JSON").map(p => p.title)[0];
        if (file.name.endsWith(".yaml")) return ProjectFileTypes.filter(p => p.name === "OPENAPI_YAML").map(p => p.title)[0];
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1);
        return ProjectFileTypes.filter(p => p.extension === extension).map(p => p.title)[0];
    }

    title = () => {
        const {project, isTemplates} = this.props;
        const file = this.state.file;
        const isFile = file !== undefined;
        const isLog = file !== undefined && file.name.endsWith("log");
        const filename = file ? file.name.substring(0, file.name.lastIndexOf('.')) : "";
        return (<div className="dsl-title">
            {isFile &&
                <div>
                    <Breadcrumb>
                        <BreadcrumbItem to="#" onClick={event => this.setState({file: undefined})}>
                            {"Project: " + project?.projectId}
                        </BreadcrumbItem>
                        <BreadcrumbItem to="#" isActive>{this.getType(file)}</BreadcrumbItem>
                    </Breadcrumb>
                    <TextContent className="title">
                        <Text component="h1">{isLog ? filename : file.name}</Text>
                    </TextContent>
                </div>
            }
            {!isFile && <TextContent className="title">
                <Text component="h2">{isTemplates ? 'Templates' : 'Project: ' + project?.projectId}</Text>
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
                        <Th key='type' width={10}>Type</Th>
                        <Th key='filename' width={50}>Filename</Th>
                        <Th key='action'></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {files.map(file => {
                        const type = this.getType(file)
                        return <Tr key={file.name}>
                            <Td>
                                <Badge>{type}</Badge>
                            </Td>
                            <Td>
                                <Button style={{padding: '6px'}} variant={"link"}
                                        onClick={e => this.select(file)}>
                                    {file.name}
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
                ref={this.state.karavanDesignerRef}
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
        if (type === 'pipeline') {
            KaravanApi.getPipelineLog(environment, name, (res: any) => {
                if (Array.isArray(res) && Array.from(res).length > 0)
                    this.setState({file: new ProjectFile(filename, this.props.project.projectId, res.at(0).log)});
            });
        } else if (type === 'container') {
            KaravanApi.getContainerLog(environment, name, (res: any) => {
                this.setState({file: new ProjectFile(filename, this.props.project.projectId, res)});
            });
        }

    }

    deleteEntity = (type: 'pod' | 'deployment', name: string, environment: string) => {
        switch (type) {
            case "deployment":
                KaravanApi.deleteDeployment(environment, name, (res: any) => {
                    if (Array.isArray(res) && Array.from(res).length > 0)
                        this.onRefresh();
                });
                break;
            case "pod":
                KaravanApi.deletePod(environment, name, (res: any) => {
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
                    <CodeBlock style={{width: "90%"}}>
                        <CodeBlockCode id="code-content">{file.code}</CodeBlockCode>
                    </CodeBlock>}
                {(file === undefined || file.code.length === 0) &&
                    <div>
                        <Skeleton width="25%" screenreaderText="Loading contents"/>
                        <br/>
                        <Skeleton width="33%"/>
                        <br/>
                        <Skeleton width="50%"/>
                        <br/>
                        <Skeleton width="66%"/>
                        <br/>
                        <Skeleton width="75%"/>
                        <br/>
                        <Skeleton/>
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

    getTemplatePanel() {
        return (
            <PageSection isFilled className="kamelets-page project-page-section" padding={{default: 'padding'}}>
                {this.getProjectFiles()}
            </PageSection>
        )
    }

    getProjectPanel() {
        const {tab} = this.state;
        return (
            <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                <FlexItem className="project-tabs">
                    <Tabs activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex})}>
                        <Tab eventKey="development" title="Development"/>
                        <Tab eventKey="operations" title="Operations"/>
                    </Tabs>
                </FlexItem>
                <FlexItem>
                    <PageSection padding={{default: "padding"}}>
                        {tab === 'development' && <ProjectInfo project={this.props.project} config={this.props.config} deleteEntity={this.deleteEntity} showLog={this.showLogs}/>}
                        {tab === 'development' && this.getProjectFiles()}
                        {tab === 'operations' && <ProjectOperations environments={this.state.environments} project={this.props.project} config={this.props.config}/>}
                    </PageSection>
                </FlexItem>
            </Flex>
        )
    }

    getFilePanel() {
        const {file, mode} = this.state;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
        const isLog = file !== undefined && file.name.endsWith("log");
        const isCode = file !== undefined && (file.name.endsWith("java") || file.name.endsWith("groovy") || file.name.endsWith("json"));
        const showDesigner = isYaml && isIntegration && mode === 'design';
        const showEditor = isCode || (isYaml && !isIntegration) || (isYaml && mode === 'code');
        return (
            <>
                {showDesigner && this.getDesigner()}
                {showEditor && this.getEditor()}
                {isLog && this.getLogView()}
                {isProperties && this.getPropertiesEditor()}
            </>
        )
    }

    render() {
        const {isTemplates} = this.props;
        const {file} = this.state;
        return (
            <PageSection className="kamelet-section project-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                {file === undefined && isTemplates && this.getTemplatePanel()}
                {file === undefined && !isTemplates && this.getProjectPanel()}
                {file !== undefined && this.getFilePanel()}

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
