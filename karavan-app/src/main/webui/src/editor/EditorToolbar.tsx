/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useEffect} from 'react';
import {
    Button,
    Flex,
    FlexItem,
    Toolbar,
    ToolbarContent, Tooltip,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useAppConfigStore, useFileStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {DevModeToolbar} from "../project/DevModeToolbar";
import {KaravanApi} from "../api/KaravanApi";
import ShareIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";
import {BUILD_IN_PROJECTS, ProjectType} from "../api/ProjectModels";


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
        <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="" direction={{default: "row"}} justifyContent={{default: 'justifyContentSpaceBetween'}} alignItems={{default: "alignItemsCenter"}}>
                    {isRunnable() &&
                        <FlexItem align={{default: 'alignRight'}}>
                            <DevModeToolbar reloadOnly={true}/>
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
            </ToolbarContent>
        </Toolbar>
    )
}
