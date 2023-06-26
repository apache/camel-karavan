import React, {useEffect, useState} from 'react';
import {
    PageSection,
    CodeBlockCode,
    CodeBlock, Skeleton
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";
import {PropertiesEditor} from "./PropertiesEditor";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectToolbar} from "./ProjectToolbar";
import {EventBus} from "../designer/utils/EventBus";
import {ProjectLog} from "./ProjectLog";
import {AppConfig, ProjectFile, ProjectFileTypes} from "../api/ProjectModels";
import {useAppConfigStore, useFileStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {MainToolbar} from "../common/MainToolbar";
import {CreateFileModal} from "./CreateFileModal";
import {DeleteFileModal} from "./DeleteFileModal";
import {ProjectTitle} from "./ProjectTitle";
import {ProjectPanel} from "./ProjectPanel";

export const ProjectPage = () => {

    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [editAdvancedProperties, setEditAdvancedProperties] = useState<boolean>(false);
    const {file, operation} = useFileStore();
    const [mode, setMode] = useState<"design" | "code">("design");
    const [key, setKey] = useState<string>('');
    const [tab, setTab] = useState<string | number>('files');
    const {project} = useProjectStore();
    const {config} = useAppConfigStore();

    useEffect(() => {
        onRefresh();
    });

    function onRefresh () {
        ProjectService.refreshProjectData(config.environment);
    }

    function post (file: ProjectFile)  {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                // setFiles((files => {
                //     const index = files.findIndex(f => f.name === newFile.name);
                //     if (index !== -1) files.splice(index, 1, newFile)
                //     else files.push(newFile);
                //     return files
                // }))
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            // setFile(file);
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
                               addProperty={() => addProperty()}
                               downloadImage={() => downloadImage()}
                               editAdvancedProperties={editAdvancedProperties}
                               setEditAdvancedProperties={checked => setEditAdvancedProperties(checked)}
                               setMode={mode => setMode(mode)}
                               setUploadModalOpen={() => setIsUploadModalOpen(isUploadModalOpen)}
                               needCommit={false}
                               onRefresh={onRefresh}
        />
    }

    // function getDesigner () {
    //     return (
    //         file !== undefined &&
    //         <KaravanDesigner
    //             dark={false}
    //             key={"key"}
    //             filename={file.name}
    //             yaml={file.code}
    //             onSave={(name, yaml) => save(name, yaml)}
    //             onSaveCustomCode={(name, code) => post(new ProjectFile(name + ".java", project.projectId, code, Date.now()))}
    //             onGetCustomCode={(name, javaType) => {
    //                 return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code))
    //             }}
    //         />
    //     )
    // }

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

    function isBuildIn(): boolean {
        return ['kamelets', 'templates'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project.projectId === 'templates';
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
                {/*{showDesigner && getDesigner()}*/}
                {showEditor && getEditor()}
                {isLog && getLogView()}
                {isProperties && getPropertiesEditor()}
            </>
        )
    }
    console.log(operation, file)
    const types = isBuildIn()
        ? (isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
        : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);
    return (
        <PageSection key={key} className="kamelet-section project-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={<ProjectTitle/>} tools={tools()}/>
            </PageSection>
            {file === undefined && operation !== 'select' && <ProjectPanel/>}
            {file !== undefined && operation === 'select' && getFilePanel()}
            <ProjectLog/>
            <CreateFileModal types={types}/>
            <DeleteFileModal />
        </PageSection>
    )
}
