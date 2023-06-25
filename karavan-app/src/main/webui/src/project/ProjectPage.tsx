import React, {useEffect, useState} from 'react';
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    PageSection,
    Text,
    TextContent,
    Flex,
    FlexItem,
    CodeBlockCode,
    CodeBlock, Skeleton, Tabs, Tab
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";
import {PropertiesEditor} from "./PropertiesEditor";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectToolbar} from "./ProjectToolbar";
import {FilesTab} from "./files/FilesTab";
import {EventBus} from "../designer/utils/EventBus";
import {ProjectLog} from "./ProjectLog";
import {getProjectFileType, ProjectFile, ProjectFileTypes} from "../api/ProjectModels";
import {useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {DashboardTab} from "./dashboard/DashboardTab";
import {TraceTab} from "./trace/TraceTab";
import {ProjectPipelineTab} from "./pipeline/ProjectPipelineTab";
import {MainToolbar} from "../common/MainToolbar";
import {CreateFileModal} from "./CreateFileModal";
import {DeleteFileModal} from "./DeleteFileModal";

interface Props {
    config: any,
}

export const ProjectPage = (props: Props) => {

    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [editAdvancedProperties, setEditAdvancedProperties] = useState<boolean>(false);
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [file, setFile] = useState<ProjectFile | undefined>(undefined);
    const [fileToDelete, setFileToDelete] = useState<ProjectFile | undefined>(undefined);
    const [mode, setMode] = useState<"design" | "code">("design");
    const [key, setKey] = useState<string>('');
    const [tab, setTab] = useState<string | number>('files');
    const [environments, setEnvironments] = useState<string[]>((
        props.config.environments && Array.isArray(props.config.environments)) ? Array.from(props.config.environments) : []
    );
    const [environment, setEnvironment] = useState<string>(props.config.environment);
    const {project, setProject} = useProjectStore();

    useEffect(() => {
        // console.log("UseEffect ProjectPage")

        onRefresh();
        // const sub1 = ProjectEventBus.onCurrentRunner()?.subscribe((result) => {
            // setCurrentRunner(result || '');
        // });
        // return () => {
        //     sub1.unsubscribe();
        // };
    });

    function needCommit(): boolean {
        return project ? files.filter(f => f.lastUpdate > project.lastCommitTimestamp).length > 0 : false;
    }

    function onRefresh () {
        ProjectService.refreshProjectData(environment);
    }

    function post (file: ProjectFile)  {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                setFiles((files => {
                    const index = files.findIndex(f => f.name === newFile.name);
                    if (index !== -1) files.splice(index, 1, newFile)
                    else files.push(newFile);
                    return files
                }))
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    function copyToClipboard (data: string) {
        navigator.clipboard.writeText(data);
    }

    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            setFile(file);
            post(file);
        }
    }

    function download () {
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }

    function downloadImage () {
        EventBus.sendCommand("downloadImage");
    }

    function addProperty() {
        if (file) {
            const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
            const props = project.properties;
            props.push(ProjectProperty.createNew("", ""))
            save(file.name, ProjectModelApi.propertiesToString(props));
            setKey(Math.random().toString());
        }
    }

    function tools () {
        return <ProjectToolbar key={key}
                               project={project}
                               file={file}
                               mode={mode}
                               isTemplates={false}
                               isKamelets={false}
                               config={props.config}
                               addProperty={() => addProperty()}
                               download={() => download()}
                               downloadImage={() => downloadImage()}
                               editAdvancedProperties={editAdvancedProperties}
                               setEditAdvancedProperties={checked => setEditAdvancedProperties(checked)}
                               setMode={mode => setMode(mode)}
                               setUploadModalOpen={() => setIsUploadModalOpen(isUploadModalOpen)}
                               needCommit={needCommit()}
                               onRefresh={onRefresh}
        />
    }


    function title ()  {
        const isFile = file !== undefined;
        const isLog = file !== undefined && file.name.endsWith("log");
        const filename = file ? file.name.substring(0, file.name.lastIndexOf('.')) : "";
        return (<div className="dsl-title project-title">
            {isFile && <Flex direction={{default: "column"}} >
                <FlexItem>
                    <Breadcrumb>
                        <BreadcrumbItem to="#" onClick={event => {
                            setFile(undefined)
                            onRefresh();
                        }}>
                            <div className={"project-breadcrumb"}>{project?.name + " (" + project?.projectId + ")"}</div>
                        </BreadcrumbItem>
                    </Breadcrumb>
                </FlexItem>
                <FlexItem>
                    <Flex direction={{default: "row"}}>
                        <FlexItem>
                            <Badge>{getProjectFileType(file)}</Badge>
                        </FlexItem>
                        <FlexItem>
                            <TextContent className="description">
                                <Text>{isLog ? filename : file.name}</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                </FlexItem>
            </Flex>}
            {!isFile && <Flex direction={{default: "column"}} >
                <FlexItem>
                    <TextContent className="title">
                        <Text component="h2">{project?.name + " (" + project?.projectId + ")"}</Text>
                    </TextContent>
                </FlexItem>
                <FlexItem>
                    <TextContent className="description">
                        <Text>{project?.description}</Text>
                    </TextContent>
                </FlexItem>
            </Flex>}
        </div>)
    };

    function closeModal (isPushing: boolean = false) {
        setIsUploadModalOpen(false);
    }

    function select (file: ProjectFile) {
        setFile(file);
    }

    function openDeleteConfirmation (file: ProjectFile) {
        setIsDeleteModalOpen(true)
        setFileToDelete(file);
    }

    function getDesigner () {
        return (
            file !== undefined &&
            <KaravanDesigner
                dark={false}
                key={"key"}
                filename={file.name}
                yaml={file.code}
                onSave={(name, yaml) => save(name, yaml)}
                onSaveCustomCode={(name, code) => post(new ProjectFile(name + ".java", project.projectId, code, Date.now()))}
                onGetCustomCode={(name, javaType) => {
                    return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code))
                }}
            />
        )
    }

    function getEditor () {
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
                        save(file?.name, value)
                    }
                }}
            />
        )
    }

    function deleteEntity  (type: 'pod' | 'deployment' | 'pipelinerun', name: string, environment: string)  {
        switch (type) {
            case "deployment":
                KaravanApi.deleteDeployment(environment, name, (res: any) => {
                    if (Array.isArray(res) && Array.from(res).length > 0)
                        onRefresh();
                });
                break;
            case "pod":
                KaravanApi.deletePod(environment, name, (res: any) => {
                    if (Array.isArray(res) && Array.from(res).length > 0)
                        onRefresh();
                });
                break;
            case "pipelinerun":
                KaravanApi.stopPipelineRun(environment, name, (res: any) => {
                    if (Array.isArray(res) && Array.from(res).length > 0)
                        onRefresh();
                });
                break;
        }
    }

    function getLogView ()  {
        return (
            <div>
                {file !== undefined && file.code.length !== 0 &&
                    <CodeBlock>
                        <CodeBlockCode id="code-content" className="log-code">{file.code}</CodeBlockCode>
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

    function getPropertiesEditor  ()  {
        return (
            file !== undefined &&
            <PropertiesEditor key={key}
                              editAdvanced={editAdvancedProperties}
                              file={file}
                              onSave={(name, code) => save(name, code)}
            />
        )
    }

    function getProjectPanel() {
        return (
            <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                {getProjectPanelTabs()}
                {getProjectPanelDetails()}
            </Flex>
        )
    }

    function getProjectPanelTabs() {
        return (
            <FlexItem className="project-tabs">
                <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                    <Tab eventKey="files" title="Files"/>
                    <Tab eventKey="dashboard" title="Dashboard"/>
                    <Tab eventKey="trace" title="Trace"/>
                    <Tab eventKey="pipeline" title="Pipeline"/>
                </Tabs>
            </FlexItem>
        )
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project.projectId === 'templates';
    }

    function getProjectPanelDetails() {
        const buildIn = isBuildIn();
        return (
            <FlexItem>
                {buildIn && tab === 'files' && <FilesTab/>}
                {!buildIn &&
                    <>
                        {tab === 'files' && <FilesTab/>}
                        {tab === 'dashboard' && project && <DashboardTab config={props.config}/>}
                        {tab === 'trace' && project && <TraceTab config={props.config}/>}
                        {tab === 'pipeline' && <ProjectPipelineTab project={project}
                                                                   needCommit={needCommit()}
                                                                   config={props.config}/>}
                    </>
                }
            </FlexItem>
        )
    }

    function getFilePanel() {
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
        const isLog = file !== undefined && file.name.endsWith("log");
        const isCode = file !== undefined && (file.name.endsWith("java") || file.name.endsWith("groovy") || file.name.endsWith("json"));
        const showDesigner = isYaml && isIntegration && mode === 'design';
        const showEditor = isCode || (isYaml && !isIntegration) || (isYaml && mode === 'code');
        return (
            <>
                {showDesigner && getDesigner()}
                {showEditor && getEditor()}
                {isLog && getLogView()}
                {isProperties && getPropertiesEditor()}
            </>
        )
    }
    const types = isBuildIn()
        ? (isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
        : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);
    return (
        <PageSection key={key} className="kamelet-section project-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={tools()}/>
            </PageSection>
            {file === undefined && getProjectPanel()}
            {/*{file !== undefined && getFilePanel()}*/}
            <ProjectLog/>
            <CreateFileModal types={types}/>
            <DeleteFileModal />
        </PageSection>
    )
}
