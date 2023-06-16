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
import {Project, ProjectFile} from "./ProjectModels";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {KaravanApi} from "../api/KaravanApi";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import {RunnerToolbar} from "./RunnerToolbar";
import {ProjectEventBus} from "./ProjectEventBus";

interface Props {
    project: Project,
    needCommit: boolean,
    isTemplates: boolean,
    isKamelets: boolean,
    config: any,
    file?: ProjectFile,
    mode: "design" | "code",
    editAdvancedProperties: boolean,
    addProperty: () => void,
    download: () => void,
    downloadImage: () => void,
    setCreateModalOpen: () => void,
    setUploadModalOpen: () => void,
    setEditAdvancedProperties: (checked: boolean) => void,
    setMode: (mode: "design" | "code") => void,
    onRefresh: () => void,
}

export const ProjectPageToolbar = (props: Props) => {

    const [isPushing, setIsPushing] = useState(false);
    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [currentRunner, setCurrentRunner] = useState('');

    useEffect(() => {
        const sub1 = ProjectEventBus.onCurrentRunner()?.subscribe((result) => {
            setCurrentRunner(result || '');
        });
        return () => {
            sub1.unsubscribe();
        };
    });

    function push () {
        setIsPushing(true);
        setCommitMessageIsOpen(false);
        const params = {
            "projectId": props.project.projectId,
            "message": commitMessage
        };
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                setIsPushing(false);
                props.onRefresh();
            } else {
                // Todo notification
            }
        });
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
        const {project, needCommit} = props;
        const color = needCommit ? "grey" : "green";
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

    function getTemplatesToolbar() {
        const {file,needCommit, editAdvancedProperties, download, setCreateModalOpen, setUploadModalOpen} = props;
        const isFile = file !== undefined;
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                        {!isFile && <FlexItem>
                            {getLastUpdatePanel()}
                        </FlexItem>}
                        {!isFile && <FlexItem>
                            <Tooltip content="Commit and push to git" position={"bottom"}>
                                <Button isLoading={isPushing ? true : undefined}
                                        isSmall
                                        variant={needCommit ? "primary" : "secondary"}
                                        className="project-button"
                                        icon={!isPushing ? <PushIcon/> : <div></div>}
                                        onClick={() => setCommitMessageIsOpen(true)}>
                                    {isPushing ? "..." : "Commit"}
                                </Button>
                            </Tooltip>
                        </FlexItem>}
                        {isProperties && <FlexItem>
                            <Checkbox
                                id="advanced"
                                label="Edit advanced"
                                isChecked={editAdvancedProperties}
                                onChange={checked => props.setEditAdvancedProperties(checked)}
                            />
                        </FlexItem>}
                        {isFile && <FlexItem>
                            <Tooltip content="Download source" position={"bottom-end"}>
                                <Button isSmall variant="control" icon={<DownloadIcon/>} onClick={e => download()}/>
                            </Tooltip>
                        </FlexItem>}
                        {!isFile && <FlexItem>
                            <Button isSmall variant={"secondary"} icon={<PlusIcon/>}
                                    onClick={e => setCreateModalOpen()}>Create</Button>
                        </FlexItem>}
                        {!isFile && <FlexItem>
                            <Button isSmall variant="secondary" icon={<UploadIcon/>}
                                    onClick={e => setUploadModalOpen()}>Upload</Button>
                        </FlexItem>}
                    </Flex>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }

    function getProjectToolbar() {
        const {file,needCommit, mode, editAdvancedProperties, project, config,
            addProperty, setEditAdvancedProperties, download, downloadImage, setCreateModalOpen, setUploadModalOpen} = props;
        const isFile = file !== undefined;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
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
                                    variant={needCommit ? "primary" : "secondary"}
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

                    {isFile && <FlexItem>
                        <Tooltip content="Download source" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadIcon/>} onClick={e => download()}/>
                        </Tooltip>
                    </FlexItem>}
                    {isIntegration && <FlexItem>
                        <Tooltip content="Download image" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadImageIcon/>} onClick={e => downloadImage()}/>
                        </Tooltip>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button isSmall variant={"secondary"} icon={<PlusIcon/>}
                                onClick={e => setCreateModalOpen()}>Create</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button isSmall variant="secondary" icon={<UploadIcon/>}
                                onClick={e => setUploadModalOpen()}>Upload</Button>
                    </FlexItem>}

                    {isYaml && currentRunner === project.name && <FlexItem>
                        <RunnerToolbar project={project} config={config} showConsole={false} reloadOnly={true} />
                    </FlexItem>}
                </Flex>
            </ToolbarContent>
        </Toolbar>
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

    const {isTemplates} = props;
    return  (
         <>
            {isTemplates && getTemplatesToolbar()}
            {!isTemplates && getProjectToolbar()}
             {getCommitModal()}
        </>
    )
}
