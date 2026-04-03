import React, {useEffect} from 'react';
import {Button, Tooltip,} from '@patternfly/react-core';
import '@features/project/designer/karavan.css';
import {useAppConfigStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {KaravanApi} from "@api/KaravanApi";
import ShareIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";
import {BUILD_IN_PROJECTS, ProjectType} from "@models/ProjectModels";
import {DevModeToolbar} from "@features/project/toolbar/DevModeToolbar";
import {ProjectContainersContextProvider} from "@features/project/ProjectContainersContextProvider";

export function EditorToolbar() {

    const {config} = useAppConfigStore();
    const [project, tabIndex] = useProjectStore((s) => [s.project, s.tabIndex], shallow)
    const [file] = useFileStore((state) => [state.file], shallow)

    const isBuildInProject = BUILD_IN_PROJECTS.includes(project.projectId);
    const isConfiguration = project.projectId === ProjectType.configuration.toString();
    const isKubernetes = config.infrastructure === 'kubernetes'
    const tooltip = isKubernetes ? "Save as Configmaps" : "Save on shared volume";

    useEffect(() => {
    }, [project, file]);

    function shareConfigurationFile () {
        if (file) {
            KaravanApi.shareConfigurationFile(file?.name, res => {})
        }
    }

    function isRunnable(): boolean {
        return !isBuildInProject && !['build', 'container'].includes(tabIndex.toString());
    }

    return (
        <div id="toolbar-group-types">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'}}>
                {isRunnable() &&
                    <ProjectContainersContextProvider>
                        <DevModeToolbar/>
                    </ProjectContainersContextProvider>
                }
                {isConfiguration &&
                    <Tooltip content={tooltip} position={"bottom-end"}>
                        <Button className="dev-action-button" variant={"primary"} icon={<ShareIcon/>}
                                onClick={e => shareConfigurationFile()}
                        >
                            Share
                        </Button>
                    </Tooltip>
                }
            </div>
        </div>
    )
}
