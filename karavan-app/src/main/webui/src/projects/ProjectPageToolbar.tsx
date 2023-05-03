import React from 'react';
import {
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

interface Props {
    project: Project,
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
}

export const ProjectPageToolbar = (props: Props) => {

    function getTemplatesToolbar() {
        const {file, editAdvancedProperties, download, setCreateModalOpen, setUploadModalOpen} = props;
        const isFile = file !== undefined;
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
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
        const {file, mode, editAdvancedProperties,
            addProperty, setEditAdvancedProperties, download, downloadImage, setCreateModalOpen, setUploadModalOpen} = props;
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
                </Flex>
            </ToolbarContent>
        </Toolbar>
    }

    const {isTemplates} = props;
    return  (
         <>
            {isTemplates && getTemplatesToolbar()}
            {!isTemplates && getProjectToolbar()}
        </>
    )
}
