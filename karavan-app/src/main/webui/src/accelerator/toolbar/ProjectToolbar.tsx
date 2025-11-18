import React, {useEffect} from 'react';
import {DevModeToolbar} from "./DevModeToolbar";
import {ResourceToolbar} from "./ResourceToolbar";
import {useAppConfigStore, useFileStore, useProjectStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {EditorToolbar} from "@/accelerator/developer/EditorToolbar";
import {BUILD_IN_PROJECTS} from "@/api/ProjectModels";
import {FileSearchToolbarItem} from "@/integration/FileSearchToolbarItem";
import {ProjectContainersContextProvider} from "../context/ProjectContainersContextProvider";

export function ProjectToolbar() {

    const [project] = useProjectStore((s) => [s.project, s.tabIndex], shallow)
    const [file, operation] = useFileStore((state) => [state.file, state.operation], shallow)
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    const isBuildInProject = BUILD_IN_PROJECTS.includes(project.projectId);

    useEffect(() => {
    }, [project, file]);

    function isFile(): boolean {
        return file !== undefined && operation !== 'delete';
    }

    function getProjectToolbar() {
        return (
            <div id="toolbar-group-types" className='main-toolbar-toolbar'>
                    <FileSearchToolbarItem/>
                    {!isBuildInProject && isDev &&
                        <ProjectContainersContextProvider>
                            <DevModeToolbar/>
                        </ProjectContainersContextProvider>
                    }
                    {(isBuildInProject || !isDev) && <ResourceToolbar/>}
            </div>
        )
    }

    return isFile() ? <EditorToolbar/> : getProjectToolbar();
}
