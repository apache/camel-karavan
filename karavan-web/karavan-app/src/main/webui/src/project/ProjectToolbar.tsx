import React, {useEffect} from 'react';
import {
    Button,
    Checkbox, Divider,
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
import {BuildToolbar} from "./BuildToolbar";


export function ProjectToolbar () {

    const [project, isPushing, tabIndex] = useProjectStore((s) => [s.project, s.isPushing, s.tabIndex], shallow )
    const [file, editAdvancedProperties, setEditAdvancedProperties, setAddProperty]
        = useFileStore((state) =>
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



    function getFileToolbar() {
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {isRunnable() && <DevModeToolbar reloadOnly={true}/>}

                    {isIntegration() && <FlexItem>
                        <Tooltip content="Download image" position={"bottom-end"}>
                            <Button size="sm" variant="control" icon={<DownloadImageIcon/>} onClick={e => downloadImage()}/>
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
                {isBuildContainer() && <BuildToolbar/>}
            </ToolbarContent>
        </Toolbar>)
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project.projectId === 'templates';
    }

    function isServicesProject(): boolean {
        return project.projectId === 'services';
    }

    function isRunnable(): boolean {
        return !isKameletsProject() && !isTemplatesProject() && !isServicesProject() && !['build', 'container'].includes(tabIndex.toString());
    }

    function isBuildContainer(): boolean {
        return !isKameletsProject() && !isTemplatesProject() && !isServicesProject() && ['build', 'container'].includes(tabIndex.toString());
    }

    function allowAddFiles(): boolean {
        return !isTemplatesProject() && !isServicesProject();
    }

    const isTemplates = isTemplatesProject();
    return  isFile() ? getFileToolbar() : getProjectToolbar()
}
