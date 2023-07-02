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
    ToolbarItem,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import {RunnerToolbar} from "./RunnerToolbar";
import {ProjectFile} from "../api/ProjectModels";
import {useFilesStore, useProjectStore, useRunnerStore} from "../api/ProjectStore";
import {EventBus} from "../designer/utils/EventBus";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";

interface Props {
    file?: ProjectFile,
    mode: "design" | "code",
    editAdvancedProperties: boolean,
    setUploadModalOpen: () => void,
    setEditAdvancedProperties: (checked: boolean) => void,
    setMode: (mode: "design" | "code") => void,
}

export const ProjectToolbar = (props: Props) => {

    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [isFile, setIsFile] = useState(false);
    const [isYaml, setIsYaml] = useState(false);
    const [isIntegration, setIsIntegration] = useState(false);
    const [isProperties, setIsProperties] = useState(false);
    const [ project, isPushing] = useProjectStore((state) => [state.project, state.isPushing], shallow )
    const {files} = useFilesStore();

    useEffect(() => {
        console.log("ProjectToolbar useEffect", isPushing, project.lastCommitTimestamp);
        const {file, mode, editAdvancedProperties,
            setEditAdvancedProperties, setUploadModalOpen} = props;
        const isFile = file !== undefined;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code !== undefined && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
        setIsFile(isFile);
        setIsYaml(isYaml);
        setIsIntegration(isIntegration);
        setIsProperties(isProperties);
    });

    function needCommit(): boolean {
        return project ? files.filter(f => f.lastUpdate > project.lastCommitTimestamp).length > 0 : false;
    }

    function downloadImage () {
        EventBus.sendCommand("downloadImage");
    }

    function addProperty() {
        // if (file) {
        //     const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
        //     const props = project.properties;
        //     props.push(ProjectProperty.createNew("", ""))
        //     save(file.name, ProjectModelApi.propertiesToString(props));
        //     setKey(Math.random().toString());
        // }
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
                {project?.lastCommitTimestamp && project?.lastCommitTimestamp > 0 &&
                    <FlexItem>
                        <Tooltip content="Last update" position={TooltipPosition.bottom}>
                            <Label color={color}>{getDate(project?.lastCommitTimestamp)}</Label>
                        </Tooltip>
                    </FlexItem>
                }
                <FlexItem>
                    <Tooltip content={commit} position={TooltipPosition.bottom}>
                        <Label
                            color={color}>{commit ? commit?.substring(0, 18) : "-"}</Label>
                    </Tooltip>
                </FlexItem>
            </Flex>
        )
    }


    function getFileToolbar() {
        const {file, mode, editAdvancedProperties,
            setEditAdvancedProperties, setUploadModalOpen} = props;
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {!isFile && <FlexItem>
                        {getLastUpdatePanel()}
                    </FlexItem>}
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
                    {isYaml && <FlexItem>
                        <ToggleGroup>
                            <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"}
                                             onChange={s => props.setMode("design")}/>
                            <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                             onChange={s => props.setMode("code")}/>
                        </ToggleGroup>
                    </FlexItem>}

                    {isProperties && <FlexItem>
                        <Checkbox
                            id="advanced"
                            label="Edit advanced"
                            isChecked={editAdvancedProperties}
                            onChange={checked => setEditAdvancedProperties(checked)}
                        />
                    </FlexItem>}
                    {isProperties && <FlexItem>
                        <Button isSmall variant="primary" icon={<PlusIcon/>} onClick={e => addProperty()}>Add property</Button>
                    </FlexItem>}


                    {isIntegration && <FlexItem>
                        <Tooltip content="Download image" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadImageIcon/>} onClick={e => downloadImage()}/>
                        </Tooltip>
                    </FlexItem>}
                    {/*{isYaml && currentRunner === project.name && <FlexItem>*/}
                    {/*    <RunnerToolbar project={project} showConsole={false} reloadOnly={true} />*/}
                    {/*</FlexItem>}*/}
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
             {!isFile && getProjectToolbar()}
             {getCommitModal()}
        </>
    )
}
