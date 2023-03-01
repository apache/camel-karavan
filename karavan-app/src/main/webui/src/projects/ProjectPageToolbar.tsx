import React from 'react';
import {
    Button,
    Toolbar,
    ToolbarContent,
    Flex,
    FlexItem,
    ToggleGroup,
    ToggleGroupItem,
    Checkbox, Tooltip, ToolbarItem, Modal, ModalVariant, Form, FormGroup, TextInput, FormHelperText
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
    onRefresh: () => void,
    setEditAdvancedProperties: (checked: boolean) => void,
    setMode: (mode: "design" | "code") => void,
}

interface State {
    isPushing: boolean,
    commitMessageIsOpen: boolean,
    commitMessage: string
}

export class ProjectPageToolbar extends React.Component<Props> {

    public state: State = {
        isPushing: false,
        commitMessageIsOpen: false,
        commitMessage: ''
    };

    push = (after?: () => void) => {
        this.setState({isPushing: true, commitMessageIsOpen: false});
        const params = {
            "projectId": this.props.project.projectId,
            "message": this.state.commitMessage
        };
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                after?.call(this);
                this.props.onRefresh.call(this);
            } else {
                // Todo notification
            }
        });
    }

    getTemplatesToolbar() {
        const {file, editAdvancedProperties, needCommit} = this.props;
        const {isPushing} = this.state;
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                        {isProperties && <FlexItem>
                            <Checkbox
                                id="advanced"
                                label="Edit advanced"
                                isChecked={editAdvancedProperties}
                                onChange={checked => this.props.setEditAdvancedProperties.call(this, checked)}
                            />
                        </FlexItem>}
                        <FlexItem>
                            <Tooltip content="Commit and push to git" position={"bottom"}>
                                <Button isLoading={isPushing ? true : undefined}
                                        isSmall
                                        variant={needCommit ? "primary" : "secondary"}
                                        className="project-button"
                                        icon={!isPushing ? <PushIcon/> : <div></div>}
                                        onClick={() => this.setState({commitMessageIsOpen: true})}>
                                    {isPushing ? "..." : "Commit"}
                                </Button>
                            </Tooltip>
                        </FlexItem>
                    </Flex>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }

    getProjectToolbar() {
        const {isPushing, commitMessage} = this.state;
        const {file, needCommit, mode, editAdvancedProperties, addProperty, setEditAdvancedProperties, download, downloadImage, setCreateModalOpen, setUploadModalOpen} = this.props;
        const isFile = file !== undefined;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {isYaml && <FlexItem>
                        <ToggleGroup>
                            <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"}
                                             onChange={s => this.props.setMode.call(this, "design")}/>
                            <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                             onChange={s => this.props.setMode.call(this, "code")}/>
                        </ToggleGroup>
                    </FlexItem>}

                    {isProperties && <FlexItem>
                        <Checkbox
                            id="advanced"
                            label="Edit advanced"
                            isChecked={editAdvancedProperties}
                            onChange={checked => setEditAdvancedProperties.call(this, checked)}
                        />
                    </FlexItem>}
                    {isProperties && <FlexItem>
                        <Button isSmall variant="primary" icon={<PlusIcon/>} onClick={e => addProperty.call(this)}>Add property</Button>
                    </FlexItem>}

                    {isFile && <FlexItem>
                        <Tooltip content="Download source" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadIcon/>} onClick={e => download.call(this)}/>
                        </Tooltip>
                    </FlexItem>}
                    {isIntegration && <FlexItem>
                        <Tooltip content="Download image" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadImageIcon/>} onClick={e => downloadImage.call(this)}/>
                        </Tooltip>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button isSmall variant={"secondary"} icon={<PlusIcon/>}
                                onClick={e => setCreateModalOpen.call(this)}>Create</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button isSmall variant="secondary" icon={<UploadIcon/>}
                                onClick={e => setUploadModalOpen.call(this)}>Upload</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Tooltip content="Commit and push to git" position={"bottom-end"}>
                            <Button isLoading={isPushing ? true : undefined}
                                    isSmall
                                    variant={needCommit ? "primary" : "secondary"}
                                    className="project-button"
                                    icon={!isPushing ? <PushIcon/> : <div></div>}
                                    onClick={() => this.setState({
                                        commitMessageIsOpen: true,
                                        commitMessage : commitMessage === '' ? new Date().toLocaleString() : commitMessage
                                    })}>
                                {isPushing ? "..." : "Push"}
                            </Button>
                        </Tooltip>
                    </FlexItem>}
                </Flex>
            </ToolbarContent>
        </Toolbar>
    }

    getCommitModal() {
        let {commitMessage, commitMessageIsOpen} = this.state;
        return (
            <Modal
                title="Commit"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => this.setState({commitMessageIsOpen: false})}
                actions={[
                    <Button key="confirm" variant="primary" onClick={() => this.push()}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={() => this.setState({commitMessageIsOpen: false})}>Cancel</Button>
                ]}
            >
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    <FormGroup label="Message" fieldId="name" isRequired>
                        <TextInput value={commitMessage} onChange={value => this.setState({commitMessage: value})}/>
                        <FormHelperText isHidden={false} component="div"/>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    render() {
        const {isTemplates} = this.props;
        return <div>
            {isTemplates && this.getTemplatesToolbar()}
            {!isTemplates && this.getProjectToolbar()}
            {this.getCommitModal()}
        </div>
    }
}
