import React, {useEffect} from 'react';
import {
    Flex,
    FlexItem,
    Toolbar,
    ToolbarContent,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {DevModeToolbar} from "./DevModeToolbar";
import {useFileStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {BuildToolbar} from "./BuildToolbar";

export function ProjectToolbar() {

    const [project, tabIndex] = useProjectStore((s) => [s.project, s.tabIndex], shallow)
    const [file] = useFileStore((state) => [state.file], shallow)

    useEffect(() => {
    }, [project, file]);

    function isFile(): boolean {
        return file !== undefined;
    }

    function getFileToolbar() {
        return (
            <Toolbar id="toolbar-group-types">
                <ToolbarContent>
                    <Flex className="" direction={{default: "row"}}
                          justifyContent={{default: 'justifyContentSpaceBetween'}}
                          alignItems={{default: "alignItemsCenter"}}>
                        {isRunnable() &&
                            <FlexItem align={{default: 'alignRight'}}>
                                <DevModeToolbar reloadOnly={true}/>
                            </FlexItem>
                        }
                    </Flex>
                </ToolbarContent>
            </Toolbar>
        )
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

    return isFile() ? getFileToolbar() : getProjectToolbar()
}
