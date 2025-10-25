import React, {useEffect} from 'react';
import {
    Button,
    Flex,
    FlexItem, Tooltip,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useAppConfigStore, useFileStore, useProjectStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {KaravanApi} from "@/api/KaravanApi";
import ShareIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";
import {BUILD_IN_PROJECTS, ProjectType} from "@/api/ProjectModels";
import {DevModeToolbar} from "@/project/DevModeToolbar";
import {ProjectContainersContextProvider} from "@/project/ProjectContainersContextProvider";

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
                <Flex className="" direction={{default: "row"}} justifyContent={{default: 'justifyContentSpaceBetween'}} alignItems={{default: "alignItemsCenter"}}>
                    {isRunnable() &&
                        <FlexItem align={{default: 'alignRight'}}>
                            <ProjectContainersContextProvider>
                                <DevModeToolbar/>
                            </ProjectContainersContextProvider>
                        </FlexItem>
                    }
                    {isConfiguration && <FlexItem>
                        <Tooltip content={tooltip} position={"bottom-end"}>
                            <Button className="dev-action-button" size="sm" variant={"primary"} icon={<ShareIcon/>}
                                    onClick={e => shareConfigurationFile()}
                            >
                                Share
                            </Button>
                        </Tooltip>
                    </FlexItem>}
                </Flex>
        </div>
    )
}
