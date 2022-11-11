import React from 'react';
import {
    Badge,
    Button,
    Toolbar,
    ToolbarContent,
    Flex,
    FlexItem,
    ToggleGroup,
    ToggleGroupItem,
    Checkbox, Tooltip, ToolbarItem
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project, ProjectFile} from "./ProjectModels";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";

interface Props {
    project: Project,
    isTemplates?: boolean,
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
}

export class ProjectPageToolbar extends React.Component<Props> {

    render() {
        const {isTemplates, project, file, mode, editAdvancedProperties} = this.props;
        const isFile = file !== undefined;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                {isTemplates &&
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
                                <Tooltip content={project?.lastCommit} position={"right"}>
                                    <Badge>{project?.lastCommit ? project?.lastCommit?.substr(0, 7) : "-"}</Badge>
                                </Tooltip>
                            </FlexItem>
                            <FlexItem>
                                <Button variant="primary" icon={<PushIcon/>} onClick={e => {}}>Commit</Button>
                            </FlexItem>
                        </Flex>
                    </ToolbarItem>
                }
                {!isTemplates &&
                    <Flex className="toolbar" direction={{default: "row"}} alignItems={{default:"alignItemsCenter"}}>
                        {isYaml && <FlexItem>
                            <ToggleGroup>
                                <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"}
                                                 onChange={s => this.props.setMode.call(this, "design")} />
                                <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                                 onChange={s => this.props.setMode.call(this, "code")} />
                            </ToggleGroup>
                        </FlexItem>}

                        {isProperties && <FlexItem>
                            <Checkbox
                                id="advanced"
                                label="Edit advanced"
                                isChecked={editAdvancedProperties}
                                onChange={checked => this.props.setEditAdvancedProperties.call(this, checked)}
                            />
                        </FlexItem>}
                        {isProperties && <FlexItem>
                            <Button variant="primary" icon={<PlusIcon/>} onClick={e => this.props.addProperty.call(this)}>Add property</Button>
                        </FlexItem>}

                        {isFile && <FlexItem>
                            <Tooltip content="Download source" position={"bottom-end"}>
                                <Button variant="control" icon={<DownloadIcon/>} onClick={e => this.props.download.call(this)}/>
                            </Tooltip>
                        </FlexItem>}
                        {isIntegration && <FlexItem>
                            <Tooltip content="Download image" position={"bottom-end"}>
                                <Button variant="control" icon={<DownloadImageIcon/>} onClick={e => this.props.downloadImage.call(this)}/>
                            </Tooltip>
                        </FlexItem>}
                        {!isFile && <FlexItem>
                            <Button variant={"primary"} icon={<PlusIcon/>}
                                    onClick={e => this.props.setCreateModalOpen.call(this)}>Create</Button>
                        </FlexItem>}
                        {!isFile && <FlexItem>
                            <Button variant="secondary" icon={<UploadIcon/>}
                                    onClick={e => this.props.setUploadModalOpen.call(this)}>Upload</Button>
                        </FlexItem>}
                    </Flex>}
            </ToolbarContent>
        </Toolbar>
    }
}
