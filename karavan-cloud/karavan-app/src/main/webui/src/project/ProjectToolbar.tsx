import React, {useEffect, useState} from 'react';
import {
    Button,
    Checkbox,
    Flex,
    FlexItem,
    Form,
    FormGroup,
    FormHelperText,
    Label,
    Modal,
    ModalVariant,
    TextInput,
    ToggleGroup,
    ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {RunnerToolbar} from "./RunnerToolbar";
import {useFilesStore, useFileStore, useProjectStore} from "../api/ProjectStore";
import {EventBus} from "../designer/utils/EventBus";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";

interface Props {
    mode: "design" | "code",
    setMode: (mode: "design" | "code") => void,
}

export const ProjectToolbar = (props: Props) => {

    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [project, isPushing] = useProjectStore((state) => [state.project, state.isPushing], shallow )
    const {files} = useFilesStore();
    const [file, editAdvancedProperties, setEditAdvancedProperties, setAddProperty] = useFileStore((state) =>
        [state.file, state.editAdvancedProperties, state.setEditAdvancedProperties, state.setAddProperty], shallow )

    useEffect(() => {
        console.log("ProjectToolbar useEffect", isPushing, project.lastCommitTimestamp);
    }, [project, file]);

    function isFile(): boolean {
        return file !== undefined;
    }

    function isYaml(): boolean {
        return file !== undefined && file.name.endsWith("yaml");
    }

    function isIntegration(): boolean {
        return isYaml() && file?.code !== undefined && CamelDefinitionYaml.yamlIsIntegration(file.code);
    }

    function isProperties(): boolean {
        return file !== undefined && file.name.endsWith("properties");
    }

    function isJava(): boolean {
        return file !== undefined && file.name.endsWith("java");
    }

    function needCommit(): boolean {
        return project ? files.filter(f => f.lastUpdate > project.lastCommitTimestamp).length > 0 : false;
    }

    function downloadImage () {
        EventBus.sendCommand("downloadImage");
    }

    function addProperty() {
        if (file) {
            const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
            const props = project.properties;
            props.push(ProjectProperty.createNew("", ""));
            file.code = ProjectModelApi.propertiesToString(props);
            ProjectService.saveFile(file);
            setAddProperty(Math.random().toString());
        }
    }

    function push () {
        setCommitMessageIsOpen(false);
        ProjectService.pushProject(project, commitMessage);
    }

    function getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toISOString().slice(0, 19).replace('T',' ');
        } else {
            return "N/A"
        }
    }

    function getLastUpdatePanel() {
        const color = needCommit() ? "grey" : "green";
        const commit = project?.lastCommit;
        return (
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                {project?.lastCommitTimestamp > 0 &&
                    <FlexItem>
                        <Tooltip content="Last update" position={TooltipPosition.bottom}>
                            <Label color={color}>{getDate(project?.lastCommitTimestamp)}</Label>
                        </Tooltip>
                    </FlexItem>}
                {project?.lastCommitTimestamp > 0 &&
                <FlexItem>
                    <Tooltip content={commit} position={TooltipPosition.bottom}>
                        <Label
                            color={color}>{commit ? commit?.substring(0, 18) : "-"}</Label>
                    </Tooltip>
                </FlexItem>}
            </Flex>
        )
    }


    function getFileToolbar() {
        const { mode} = props;
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {isJava() && <FlexItem>
                        <Tooltip content="File size" position={TooltipPosition.bottom}>
                            <Label>{file?.code?.length}</Label>
                        </Tooltip>
                    </FlexItem>}
                    {isRunnable() && <RunnerToolbar reloadOnly={true}/>}
                    {!isFile && <FlexItem>
                        <Tooltip content="Commit and push to git" position={"bottom-end"}>
                            <Button isLoading={isPushing ? true : undefined}
                                    isSmall
                                    variant={needCommit() ? "primary" : "secondary"}
                                    className="project-button"
                                    icon={!isPushing ? <PushIcon/> : <div></div>}
                                    onClick={() => {
                                        setCommitMessage(commitMessage === '' ? new Date().toLocaleString() : commitMessage);
                                        setCommitMessageIsOpen(true);
                                    }}>
                                {isPushing ? "..." : "Push"}
                            </Button>
                        </Tooltip>
                    </FlexItem>}
                    {isYaml() && <FlexItem>
                        <ToggleGroup>
                            <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"}
                                             onChange={s => props.setMode("design")}/>
                            <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                             onChange={s => props.setMode("code")}/>
                        </ToggleGroup>
                    </FlexItem>}

                    {isProperties() && <FlexItem>
                        <Checkbox
                            id="advanced"
                            label="Edit advanced"
                            isChecked={editAdvancedProperties}
                            onChange={checked => setEditAdvancedProperties(checked)}
                        />
                    </FlexItem>}
                    {isProperties() && <FlexItem>
                        <Button isSmall variant="primary" icon={<PlusIcon/>} onClick={e => addProperty()}>Add property</Button>
                    </FlexItem>}

                    {isIntegration() && <FlexItem>
                        <Tooltip content="Download image" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadImageIcon/>} onClick={e => downloadImage()}/>
                        </Tooltip>
                    </FlexItem>}
                </Flex>
            </ToolbarContent>
        </Toolbar>
    }

    function getProjectToolbar() {
        return (<Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    <FlexItem>{getLastUpdatePanel()}</FlexItem>
                    {isRunnable() && <RunnerToolbar/>}
                    <FlexItem>
                        <Tooltip content="Commit and push to git" position={"bottom-end"}>
                            <Button isLoading={isPushing ? true : undefined}
                                    isSmall
                                    variant={needCommit() ? "primary" : "secondary"}
                                    className="project-button"
                                    icon={!isPushing ? <PushIcon/> : <div></div>}
                                    onClick={() => {
                                        setCommitMessage(commitMessage === '' ? new Date().toLocaleString() : commitMessage);
                                        setCommitMessageIsOpen(true);
                                    }}>
                                {isPushing ? "..." : "Push"}
                            </Button>
                        </Tooltip>
                    </FlexItem>
                </Flex>
            </ToolbarContent>
        </Toolbar>)
    }

    function getCommitModal() {
        return (
            <Modal
                title="Commit"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => setCommitMessageIsOpen(false)}
                actions={[
                    <Button key="confirm" variant="primary" onClick={() => push()}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={() => setCommitMessageIsOpen(false)}>Cancel</Button>
                ]}
            >
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    <FormGroup label="Message" fieldId="name" isRequired>
                        <TextInput value={commitMessage} onChange={value => setCommitMessage(value)}/>
                        <FormHelperText isHidden={false} component="div"/>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project.projectId === 'templates';
    }

    function isRunnable(): boolean {
        return !isKameletsProject() && !isTemplatesProject();
    }

    const isTemplates = isTemplatesProject();
    return  (
         <>
            {/*{isTemplates && getTemplatesToolbar()}*/}
            {/*{!isTemplates && getProjectToolbar()}*/}
             {!isFile() && getProjectToolbar()}
             {isFile() && getFileToolbar()}
             {getCommitModal()}
        </>
    )
}
