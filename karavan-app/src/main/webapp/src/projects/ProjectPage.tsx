import React from 'react';
import {
    Badge, Breadcrumb, BreadcrumbItem,
    Button, Form,
    FormGroup,
    PageSection,
    Text,
    TextContent, TextInput,
    ToggleGroup,
    ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription, Card, CardBody
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile} from "../models/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {UploadModal} from "../integrations/UploadModal";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";

interface Props {
    project?: Project,
}

interface State {
    project?: Project,
    file?: ProjectFile,
    files: ProjectFile[],
    isUploadModalOpen: boolean,
}

export class ProjectPage extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isUploadModalOpen: false,
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

    save = (name: string, yaml: string) => {
        const file = this.state.file;
        if (file){
            file.code = yaml;
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
        const file = this.state.file;
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                {file === undefined && <ToolbarItem>
                    <Button variant="secondary" icon={<UploadIcon/>}
                            onClick={e => this.setState({isUploadModalOpen: true})}>Upload</Button>
                </ToolbarItem>}
                {file !== undefined && <ToolbarItem>
                    <Button variant="secondary" icon={<DownloadIcon/>} onClick={e => this.download()}>Download</Button>
                </ToolbarItem>}
            </ToolbarContent>
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
                                        onClick={event => this.setState({file: undefined})}>{"Project: " + this.props.project?.name}</BreadcrumbItem>
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
            KaravanApi.getProject(this.props.project.name, (project: Project) => {
                this.setState({
                    project: project
                })
            });
            KaravanApi.getFiles(this.props.project.name, (files: []) => {
                this.setState({
                    files: files
                })
            });
        }
    }

    closeModal = () => {
        this.setState({isUploadModalOpen: false});
        this.onRefresh();
    }

    select = (file: ProjectFile) => {
        this.setState({file: file});
    }

    delete = (file: ProjectFile) => {

    }

    getType = (name: string) => {
        return name.endsWith("yaml") ? "Integration" : (name.endsWith("properties") ? "Properties" : "Code")
    }

    getProjectForm = () => {
        const project = this.state.project;
        return (
            <Card>
                <CardBody>
                    <DescriptionList isHorizontal>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Name</DescriptionListTerm>
                            <DescriptionListDescription>{CamelUi.titleFromName(project?.name)}</DescriptionListDescription>
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
                            <DescriptionListTerm>Type</DescriptionListTerm>
                            <DescriptionListDescription>
                                <ToggleGroup aria-label="Default with single selectable">
                                    {["KARAVAN", "QUARKUS", "SPRING"].map(value =>
                                        <ToggleGroupItem text={CamelUtil.capitalizeName(value.toLowerCase())}
                                                         buttonId={value} isSelected={project?.type === value}/>
                                    )}
                                </ToggleGroup>
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    </DescriptionList>
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
                                        onClick={e => this.delete(file)}>
                                    <DeleteIcon/>
                                </Button>
                            </Td>
                        </Tr>
                    })}
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
        const language = file?.name.endsWith("java") ? "java" : (file?.name.endsWith("groovy") ? "groovy" : "yaml");
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
                <UploadModal isOpen={this.state.isUploadModalOpen} onClose={this.closeModal}/>
            </PageSection>
        )
    }
}
