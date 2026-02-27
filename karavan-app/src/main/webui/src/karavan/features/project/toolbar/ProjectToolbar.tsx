import React, {useEffect} from 'react';
import {DevModeToolbar} from "./DevModeToolbar";
import {SettingsToolbar} from "@features/projects/SettingsToolbar";
import {useAppConfigStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {EditorToolbar} from "@features/project/developer/EditorToolbar";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {ProjectContainersContextProvider} from "../ProjectContainersContextProvider";
import {BuildToolbar} from "@features/project/toolbar/BuildToolbar";

export function ProjectToolbar() {

    const [project, tabIndex] = useProjectStore((s) => [s.project, s.tabIndex], shallow)
    const [file, operation] = useFileStore((state) => [state.file, state.operation], shallow)
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';
    const isBuildInProject = BUILD_IN_PROJECTS.includes(project?.projectId);
    const showDevModeToolbar = isDev && !isBuildInProject && tabIndex !== "build";
    const showPackageToolbar = isDev && !isBuildInProject && tabIndex === "build";
    const showResourceToolbar = (isBuildInProject || !isDev) && tabIndex !== "build";

    useEffect(() => {
    }, [project, file]);

    function isFile(): boolean {
        return file !== undefined && operation !== 'delete';
    }

    function getProjectToolbar() {
        return (
            <div id="toolbar-group-types" className='main-toolbar-toolbar'>
                    {showDevModeToolbar &&
                        <ProjectContainersContextProvider>
                            <DevModeToolbar/>
                        </ProjectContainersContextProvider>
                    }
                    {showPackageToolbar &&
                        <ProjectContainersContextProvider>
                            <BuildToolbar/>
                        </ProjectContainersContextProvider>
                    }
                    {showResourceToolbar && <SettingsToolbar/>}
            </div>
        )
    }

    return isFile() ? <EditorToolbar/> : getProjectToolbar();
}
