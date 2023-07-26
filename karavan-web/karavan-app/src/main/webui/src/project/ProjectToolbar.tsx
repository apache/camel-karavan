import React, {useEffect} from 'react';
import {
    Button,
    Checkbox,
    Flex,
    FlexItem,
    ToggleGroup,
    ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    Tooltip
} from '@patternfly/react-core';
import '../designer/karavan.css';
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {DevModeToolbar} from "./DevModeToolbar";
import {useFileStore, useProjectStore} from "../api/ProjectStore";
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

    const [project, isPushing] = useProjectStore((state) => [state.project, state.isPushing], shallow )
    const [file, editAdvancedProperties, setEditAdvancedProperties, setAddProperty] = useFileStore((state) =>
        [state.file, state.editAdvancedProperties, state.setEditAdvancedProperties, state.setAddProperty], shallow )

    useEffect(() => {
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

    function getFileToolbar() {
        const { mode} = props;
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {isRunnable() && <DevModeToolbar reloadOnly={true}/>}
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
                {isRunnable() && <DevModeToolbar/>}
            </ToolbarContent>
        </Toolbar>)
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
        </>
    )
}
