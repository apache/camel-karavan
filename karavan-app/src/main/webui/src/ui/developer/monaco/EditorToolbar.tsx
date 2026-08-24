import React from 'react';
import '@designer/karavan.css';
import {useProjectStore} from "@stores/ProjectStore";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {DevModeToolbar} from "@page-project/toolbar/DevModeToolbar";
import {ProjectContainersContextProvider} from "@page-project/ProjectContainersContextProvider";
import {useAppConfig} from "@compass/useConfig";

export function EditorToolbar() {

    const project = useProjectStore((s) => s.project)
    const tabIndex = useProjectStore((s) => s.tabIndex)
    const {isDev} = useAppConfig();

    const isBuildInProject = BUILD_IN_PROJECTS.includes(project.projectId);

    function isRunnable(): boolean {
        return isDev && !isBuildInProject && !['build', 'container'].includes(tabIndex.toString());
    }

    return (
        <div id="toolbar-group-types">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'}}>
                {isRunnable() &&
                    <ProjectContainersContextProvider>
                        <DevModeToolbar/>
                    </ProjectContainersContextProvider>
                }
            </div>
        </div>
    )
}
