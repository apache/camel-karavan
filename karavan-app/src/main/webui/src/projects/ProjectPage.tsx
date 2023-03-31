import React from 'react';
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    PageSection,
    Text,
    TextContent,
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
import {getProjectFileType, Project, ProjectFile, ProjectFileTypes} from "./ProjectModels";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";
import {CreateFileModal} from "./CreateFileModal";
import {PropertiesEditor} from "./PropertiesEditor";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {KubernetesAPI} from "../designer/utils/KubernetesAPI";
import {UploadModal} from "./UploadModal";
import {ProjectInfo} from "./ProjectInfo";
import {ProjectOperations} from "./ProjectOperations";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectPageToolbar} from "./ProjectPageToolbar";
import {ProjectFilesTable} from "./ProjectFilesTable";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";

interface Props {
    project: Project,
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

    needCommit(): boolean {
        const {project, files} = this.state;
        return project ? files.filter(f => f.lastUpdate > project.lastCommitTimestamp).length > 0 : false;
    }

    onRefresh = () => {
        if (this.props.project) {
            KaravanApi.getProject(this.props.project.projectId, (project: Project) => {
                this.setState({project: project, key: Math.random().toString()});
                KaravanApi.getTemplatesFiles((files: ProjectFile[]) => {
                    files.filter(f => f.name.endsWith("java"))
                        .filter(f => f.name.startsWith(project.runtime))
                        .forEach(f => {
                            const name = f.name.replace(project.runtime + "-", '').replace(".java", '');
                            TemplateApi.saveTemplate(name, f.code);
                        })
                });
            });
            KaravanApi.getFiles(this.props.project.projectId, (files: []) => {
                this.setState({files: files, key: Math.random().toString()})
            });

            KubernetesAPI.inKubernetes = true;
            if (!this.isBuildIn()) {
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
    }

    isBuildIn(): boolean {
        return ['kamelets', 'templates'].includes(this.props.project.projectId);
    }

    isKameletsProject(): boolean {
        return this.props.project.projectId === 'kamelets';
    }

    isTemplatesProject(): boolean {
        return this.props.project.projectId === 'templates';
    }

    post = (file: ProjectFile) => {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                this.setState((state => {
                    const index = state.files.findIndex(f => f.name === newFile.name);
                    if (index !== -1) state.files.splice(index, 1, newFile)
                    else state.files.push(newFile);
                    return state
                }))
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
        return <ProjectPageToolbar key={this.state.key}
            project={this.props.project}
            needCommit={this.needCommit()}
            file={this.state.file}
            mode={this.state.mode}
            isTemplates={this.isTemplatesProject()}
            isKamelets={this.isKameletsProject()}
            config={this.props.config}
            addProperty={() => this.addProperty()}
            download={() => this.download()}
            downloadImage={() => this.downloadImage()}
            editAdvancedProperties={this.state.editAdvancedProperties}
            setEditAdvancedProperties={checked => this.setState({editAdvancedProperties: checked})}
            setMode={mode => this.setState({mode: mode})}
            setCreateModalOpen={() => this.setState({isCreateModalOpen: true})}
            setUploadModalOpen={() => this.setState({isUploadModalOpen: true})}
            onRefresh={this.onRefresh}
        />
    }


    title = () => {
        const {project} = this.props;
        const file = this.state.file;
        const isFile = file !== undefined;
        const isLog = file !== undefined && file.name.endsWith("log");
        const filename = file ? file.name.substring(0, file.name.lastIndexOf('.')) : "";
        return (<div className="dsl-title">
            {isFile &&
                <div>
                    <Breadcrumb>
                        <BreadcrumbItem to="#" onClick={event => {
                            this.setState({file: undefined})
                            this.onRefresh();
                        }}>
                            <Flex direction={{default: "row"}}>
                                <FlexItem>{"Project: " + project?.projectId}</FlexItem>
                                <FlexItem><Badge>{getProjectFileType(file)}</Badge></FlexItem>
                            </Flex>
                        </BreadcrumbItem>
                    </Breadcrumb>
                    <TextContent className="title">
                        <Text component="h1">{isLog ? filename : file.name}</Text>
                    </TextContent>
                </div>
            }
            {!isFile && <TextContent className="title">
                <Text component="h2">{project?.name}</Text>
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

    getDesigner = () => {
        const {file, files} = this.state;
        const {project} = this.props;
        return (
            file !== undefined &&
            <KaravanDesigner
                ref={this.state.karavanDesignerRef}
                dark={false}
                key={"key"}
                filename={file.name}
                yaml={file.code}
                onSave={(name, yaml) => this.save(name, yaml)}
                onSaveCustomCode={(name, code) => this.post(new ProjectFile(name + ".java", project.projectId, code, Date.now()))}
                onGetCustomCode={(name, javaType) => {
                    return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code))
                }}
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
        this.setState({file: new ProjectFile(filename, this.props.project.projectId, code, Date.now())});
        if (type === 'pipeline') {
            KaravanApi.getPipelineLog(environment, name, (res: any) => {
                if (Array.isArray(res) && Array.from(res).length > 0)
                    this.setState({file: new ProjectFile(filename, this.props.project.projectId, res.at(0).log, Date.now())});
            });
        } else if (type === 'container') {
            KaravanApi.getContainerLog(environment, name, (res: any) => {
                this.setState({file: new ProjectFile(filename, this.props.project.projectId, res, Date.now())});
            });
        }

    }

    deleteEntity = (type: 'pod' | 'deployment' | 'pipelinerun', name: string, environment: string) => {
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
            case "pipelinerun":
                KaravanApi.stopPipelineRun(environment, name, (res: any) => {
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

    getProjectPanel() {
        const isBuildIn = this.isBuildIn();
        return (
            <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                {!isBuildIn && this.getProjectPanelTabs()}
                {this.getProjectPanelFiles()}
            </Flex>
        )
    }

    getProjectPanelTabs() {
        const {tab} = this.state;
        return (
            <FlexItem className="project-tabs">
                <Tabs activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex})}>
                    <Tab eventKey="development" title="Development"/>
                    <Tab eventKey="operations" title="Operations"/>
                </Tabs>
            </FlexItem>
        )
    }

    getProjectPanelFiles() {
        const {tab, files, project} = this.state;
        const isBuildIn = this.isBuildIn();
        return (
            <FlexItem>
                {isBuildIn &&
                    <PageSection padding={{default: "padding"}}>
                        {tab === 'development' && <ProjectFilesTable files={files}
                                                                     onOpenDeleteConfirmation={this.openDeleteConfirmation}
                                                                     onSelect={this.select}/>}
                    </PageSection>
                }
                {!isBuildIn &&
                    <PageSection padding={{default: "padding"}}>
                        {tab === 'development' && project && <ProjectInfo project={project}
                                                                          needCommit={this.needCommit()}
                                                                          files={files}
                                                                          config={this.props.config}
                                                                          deleteEntity={this.deleteEntity}
                                                                          showLog={this.showLogs}/>}
                        {tab === 'development' && <ProjectFilesTable files={files}
                                                                     onOpenDeleteConfirmation={this.openDeleteConfirmation}
                                                                     onSelect={this.select}/>}
                        {tab === 'operations' && <ProjectOperations environments={this.state.environments} project={this.props.project} config={this.props.config}/>}
                    </PageSection>
                }
            </FlexItem>
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
        const {file, isDeleteModalOpen, fileToDelete, isUploadModalOpen, isCreateModalOpen, key} = this.state;
        const {project} = this.props;
        const types = this.isBuildIn()
            ? (this.isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
            : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);
        return (
            <PageSection key={key} className="kamelet-section project-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                {file === undefined && this.getProjectPanel()}
                {file !== undefined && this.getFilePanel()}

                <CreateFileModal project={project}
                                 isOpen={isCreateModalOpen}
                                 types={types}
                                 onClose={this.closeModal}/>
                <Modal
                    title="Confirmation"
                    variant={ModalVariant.small}
                    isOpen={isDeleteModalOpen}
                    onClose={() => this.setState({isDeleteModalOpen: false})}
                    actions={[
                        <Button key="confirm" variant="primary" onClick={e => this.delete()}>Delete</Button>,
                        <Button key="cancel" variant="link"
                                onClick={e => this.setState({isDeleteModalOpen: false})}>Cancel</Button>
                    ]}
                    onEscapePress={e => this.setState({isDeleteModalOpen: false})}>
                    <div>{"Are you sure you want to delete the file " + fileToDelete?.name + "?"}</div>
                </Modal>
                <UploadModal projectId={project.projectId} isOpen={isUploadModalOpen} onClose={this.closeModal}/>
            </PageSection>
        )
    }
}
